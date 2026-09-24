"""Generative-AI routes — thin, safe wrappers around the Mistral service.

Error mapping (user-safe messages only; stack traces never leave the server):
    not_configured / auth  → 503
    rate_limited           → 429
    timeout / network      → 504
    upstream / invalid / empty → 502
The ML prediction endpoints are independent — a Mistral failure never
affects /api/predict.
"""
from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from ..schemas.ai import (
    AIAnalysisResponse,
    AIAnalyzeRequest,
    AIChatRequest,
    AIChatResponse,
    AIExplainRequest,
    AIExplanationResponse,
)
from ..services import mistral_service
from ..services.mistral_service import MistralError
from ..services.artifacts import registry

router = APIRouter(tags=["Generative AI"])

_STATUS_BY_KIND = {
    "not_configured": 503,
    "auth": 503,
    "rate_limited": 429,
    "timeout": 504,
    "network": 504,
    "upstream": 502,
    "invalid_response": 502,
    "empty": 502,
}


def _ai_error(exc: MistralError) -> JSONResponse:
    return JSONResponse(
        status_code=_STATUS_BY_KIND.get(exc.kind, 502),
        content={"message": exc.user_message, "error": exc.kind, "provider": "mistral"},
    )


def _model_context(payload: dict, *, include_importance: bool) -> dict:
    """Enrich the validated request with real model data (importance/metrics)."""
    context = dict(payload)
    metrics = registry.metrics or {}
    best = metrics.get("best_model")
    best_stats = next((m for m in metrics.get("models", []) if m.get("model") == best), None)
    if best_stats:
        context["model_metrics"] = {"r2": best_stats["R2"], "mae": best_stats["MAE"], "rmse": best_stats["RMSE"]}
    if include_importance:
        info = registry.model_info or {}
        context["feature_importance"] = info.get("feature_importance")
    return context


@router.post(
    "/ai/analyze",
    response_model=AIAnalysisResponse,
    responses={429: {"description": "AI rate-limited."}, 502: {"description": "AI upstream error."},
               503: {"description": "AI not configured or unavailable."}, 504: {"description": "AI timeout."}},
    summary="Mistral analysis of the ML property valuation",
)
def analyze_property_ai(payload: AIAnalyzeRequest):
    try:
        return mistral_service.analyze_property(_model_context(payload.model_dump(), include_importance=True))
    except MistralError as exc:
        return _ai_error(exc)


@router.post(
    "/ai/explain",
    response_model=AIExplanationResponse,
    responses={429: {"description": "AI rate-limited."}, 502: {"description": "AI upstream error."},
               503: {"description": "AI not configured or unavailable."}, 504: {"description": "AI timeout."}},
    summary="Explain My Prediction — simple-language explanation + real feature importance",
)
def explain_prediction_ai(payload: AIExplainRequest):
    try:
        return mistral_service.explain_prediction(_model_context(payload.model_dump(), include_importance=True))
    except MistralError as exc:
        return _ai_error(exc)


@router.post(
    "/ai/chat",
    response_model=AIChatResponse,
    responses={429: {"description": "AI rate-limited."}, 502: {"description": "AI upstream error."},
               503: {"description": "AI not configured or unavailable."}, 504: {"description": "AI timeout."}},
    summary="Property AI Assistant — context-aware conversational endpoint",
)
def chat_with_assistant(payload: AIChatRequest):
    context = _model_context(payload.context.model_dump(), include_importance=True) if payload.context else None
    history = [message.model_dump() for message in payload.messages]
    try:
        return mistral_service.chat(history, context)
    except MistralError as exc:
        return _ai_error(exc)
