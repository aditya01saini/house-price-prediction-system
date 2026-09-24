"""Mistral Generative-AI service — ALL Mistral logic lives here.

Security & design:
  * The API key (MISTRAL_API_KEY) is read from the backend environment ONLY.
    It never reaches the frontend, logs, or error payloads.
  * Mistral NEVER produces the numerical price — that always comes from the
    trained scikit-learn pipeline. Mistral only produces natural-language
    interpretation (analysis / explanation / chat).
  * Typed failures (not configured, auth, rate limit, timeout, upstream…)
    are mapped by the routes into friendly HTTP responses.
  * A tiny in-memory TTL cache avoids duplicate billable calls for identical
    analysis/explanation requests.
"""
from __future__ import annotations

import hashlib
import logging
import time
from typing import Any

import httpx

from ..config import settings
from .prompts import (
    DISCLAIMER,
    build_analysis_messages,
    build_chat_messages,
    build_explain_messages,
)

logger = logging.getLogger("app.mistral")

NOT_CONFIGURED_MESSAGE = (
    "AI insights are temporarily unavailable because no Mistral API key is configured on the "
    "server. Your ML prediction is still fully available. (Server admin: set MISTRAL_API_KEY in backend/.env)"
)


class MistralError(RuntimeError):
    """Typed failure with a user-safe message (kind → HTTP mapping in routes)."""

    def __init__(self, kind: str, message: str):
        super().__init__(message)
        self.kind = kind
        self.user_message = message


def is_configured() -> bool:
    return bool(settings.mistral_api_key)


# --------------------------------------------------------------------------- #
# Tiny TTL cache (dedupe identical billable calls)                             #
# --------------------------------------------------------------------------- #
_CACHE: dict[str, tuple[float, str]] = {}
_CACHE_TTL_SECONDS = 300


def _cache_key(prefix: str, payload: Any) -> str:
    return prefix + ":" + hashlib.sha1(repr(payload).encode("utf-8")).hexdigest()


def _cache_get(key: str) -> str | None:
    hit = _CACHE.get(key)
    if not hit:
        return None
    stored_at, value = hit
    if time.monotonic() - stored_at > _CACHE_TTL_SECONDS:
        _CACHE.pop(key, None)
        return None
    return value


def _cache_set(key: str, value: str) -> None:
    if len(_CACHE) > 128:  # keep memory bounded
        _CACHE.clear()
    _CACHE[key] = (time.monotonic(), value)


# --------------------------------------------------------------------------- #
# Core chat-completions call                                                   #
# --------------------------------------------------------------------------- #
def _chat_completion(messages: list[dict[str, str]], *, max_tokens: int, temperature: float) -> str:
    if not is_configured():
        raise MistralError("not_configured", NOT_CONFIGURED_MESSAGE)

    payload = {
        "model": settings.mistral_model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    headers = {
        "Authorization": f"Bearer {settings.mistral_api_key}",
        "Content-Type": "application/json",
    }

    attempt = 0
    while True:
        attempt += 1
        try:
            response = httpx.post(
                f"{settings.mistral_base_url}/chat/completions",
                json=payload,
                headers=headers,
                timeout=httpx.Timeout(settings.mistral_timeout, connect=6.0),
            )
        except httpx.TimeoutException as exc:
            raise MistralError(
                "timeout", "The AI service took too long to respond. Please try again in a moment."
            ) from exc
        except httpx.HTTPError as exc:
            raise MistralError(
                "network", "Could not reach the AI service. Check connectivity and try again."
            ) from exc

        # One polite retry on rate-limit / transient upstream errors.
        if response.status_code == 429 and attempt == 1:
            retry_after = min(float(response.headers.get("Retry-After") or 2), 6.0)
            time.sleep(retry_after)
            continue
        if response.status_code >= 500 and attempt == 1:
            time.sleep(1.5)
            continue

        if response.status_code in (401, 403):
            logger.error("Mistral rejected the API key (HTTP %s)", response.status_code)
            raise MistralError(
                "auth", "The configured Mistral API key was rejected. Check MISTRAL_API_KEY on the server."
            )
        if response.status_code == 429:
            raise MistralError(
                "rate_limited", "The AI service is busy right now. Please retry in a few seconds."
            )
        if response.status_code >= 400:
            logger.error("Mistral HTTP %s: %s", response.status_code, response.text[:300])
            raise MistralError(
                "upstream", "The AI service returned an unexpected response. Please try again shortly."
            )
        break

    try:
        content = response.json()["choices"][0]["message"]["content"]
    except Exception as exc:  # malformed provider payload
        logger.error("Malformed Mistral response: %s", response.text[:300])
        raise MistralError(
            "invalid_response", "The AI service response could not be read. Please try again."
        ) from exc

    if not content or not content.strip():
        raise MistralError("empty", "The AI service returned an empty result. Please try again.")
    return content.strip()


def _meta() -> dict:
    return {"provider": "mistral", "model": settings.mistral_model, "disclaimer": DISCLAIMER}


# --------------------------------------------------------------------------- #
# Public AI operations                                                         #
# --------------------------------------------------------------------------- #
def analyze_property(context: dict[str, Any]) -> dict:
    """Seven-section professional property analysis of the ML estimate."""
    key = _cache_key("analyze", {k: context.get(k) for k in sorted(context)})
    cached = _cache_get(key)
    if cached is not None:
        return {**_meta(), "analysis": cached, "cached": True}

    content = _chat_completion(build_analysis_messages(context), max_tokens=850, temperature=0.45)
    _cache_set(key, content)
    return {**_meta(), "analysis": content, "cached": False}


def explain_prediction(context: dict[str, Any]) -> dict:
    """Plain-language explanation of THIS prediction, grounded in real feature importance."""
    key = _cache_key("explain", {k: context.get(k) for k in sorted(context)})
    cached = _cache_get(key)
    if cached is not None:
        analysis = cached
        cached_flag = True
    else:
        analysis = _chat_completion(build_explain_messages(context), max_tokens=650, temperature=0.4)
        _cache_set(key, analysis)
        cached_flag = False

    return {
        **_meta(),
        "explanation": analysis,
        "feature_importance": context.get("feature_importance"),
        "cached": cached_flag,
    }


def chat(history: list[dict[str, str]], context: dict[str, Any] | None) -> dict:
    """Context-aware assistant reply. No caching — conversations are stateful."""
    reply = _chat_completion(build_chat_messages(history, context), max_tokens=500, temperature=0.6)
    return {**_meta(), "reply": reply}
