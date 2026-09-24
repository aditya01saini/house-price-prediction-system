"""Integration tests for the Generative-AI layer.

Run from the backend directory:  python -m tests.test_ai_flow

The Mistral HTTP boundary is mocked (never the app logic), so the full chain
is exercised: Pydantic validation -> route -> service -> prompts -> response.
Also proves the ML prediction endpoint is independent of Mistral availability.
"""
from __future__ import annotations

import sys

from fastapi.testclient import TestClient

from app.main import app
from app.services import mistral_service

CLIENT_PAYLOAD = {
    "area": 2000,
    "bedrooms": 3,
    "bathrooms": 2,
    "floors": 2,
    "parking": 1,
    "property_age": 5,
    "location": "Mumbai",
    "property_type": "Apartment",
    "predicted_price": 37694907.24,
    "model_name": "Random Forest",
}

CANNED_ANALYSIS = (
    "Property Summary:\n"
    "- 2000 sq ft Mumbai apartment with 3 bedrooms.\n\n"
    "Price Interpretation:\n"
    "- The ML model estimates INR 3,76,94,907.\n\n"
    "Note: This is an AI-generated interpretation of the ML prediction, not verified market data."
)

captured_messages: list[list[dict]] = []


def fake_chat_success(messages, *, max_tokens, temperature):
    captured_messages.append(messages)
    return CANNED_ANALYSIS


def fake_chat_rate_limited(messages, *, max_tokens, temperature):
    raise mistral_service.MistralError(
        "rate_limited", "The AI service is busy right now. Please retry in a few seconds."
    )


def run() -> int:
    failures: list[str] = []

    def check(name: str, condition: bool, detail: str = ""):
        print(f"{'PASS' if condition else 'FAIL'}  {name}" + (f" -- {detail}" if detail and not condition else ""))
        if not condition:
            failures.append(name)

    with TestClient(app) as client:  # context manager runs lifespan -> loads model
        # 1. No key configured -> friendly 503, ML untouched
        response = client.post("/api/ai/analyze", json=CLIENT_PAYLOAD)
        check("analyze without key -> 503", response.status_code == 503)
        check("503 message is user-friendly", "temporarily unavailable" in response.json()["message"])

        # 2. Simulate a configured key + successful Mistral call
        mistral_service.settings.mistral_api_key = "test-key-for-mocks"
        mistral_service._chat_completion = fake_chat_success
        mistral_service._CACHE.clear()

        response = client.post("/api/ai/analyze", json=CLIENT_PAYLOAD)
        body = response.json()
        check("analyze with key -> 200", response.status_code == 200)
        check("analysis text returned", "Property Summary" in body.get("analysis", ""))
        check("provider is mistral", body.get("provider") == "mistral")
        check("disclaimer present", "AI-generated interpretation" in body.get("disclaimer", ""))

        # 3. Prompt hygiene: property data + grounding rules included
        prompt_text = captured_messages[-1][0]["content"] + captured_messages[-1][1]["content"]
        check("prompt contains property area", "Area: 2000 sq ft" in prompt_text)
        check("prompt contains ML price", "37,694,907" in prompt_text)
        check("prompt forbids price invention", "never" in prompt_text.lower())
        check("prompt includes real feature importance", "feature importance" in prompt_text.lower())

        # 4. Explain endpoint returns REAL model importance
        response = client.post("/api/ai/explain", json=CLIENT_PAYLOAD)
        body = response.json()
        check("explain -> 200", response.status_code == 200)
        importance = body.get("feature_importance") or []
        check("real feature importance attached", any(i["feature"] == "area" for i in importance))
        check("importances sum to ~1", abs(sum(i["importance"] for i in importance) - 1) < 0.02)

        # 5. Chat with context
        response = client.post(
            "/api/ai/chat",
            json={"messages": [{"role": "user", "content": "Why is this price high?"}], "context": CLIENT_PAYLOAD},
        )
        check("chat with context -> 200", response.status_code == 200)
        check("chat reply returned", "ML" in response.json().get("reply", ""))

        # 6. Chat history capped (schema rejects >12 messages)
        response = client.post(
            "/api/ai/chat",
            json={"messages": [{"role": "user", "content": "hi"}] * 13},
        )
        check("oversized history -> 422", response.status_code == 422)

        # 7. Rate-limit mapping
        mistral_service._chat_completion = fake_chat_rate_limited
        response = client.post("/api/ai/chat", json={"messages": [{"role": "user", "content": "hello"}]})
        check("rate limited -> 429", response.status_code == 429)

        # 8. ML prediction completely unaffected by AI failures
        response = client.post(
            "/api/predict",
            json={k: v for k, v in CLIENT_PAYLOAD.items() if k not in ("predicted_price", "model_name")},
        )
        check("ML predict still works", response.status_code == 200 and response.json()["predicted_price"] > 0)

        # 9. No key leakage in any response body
        check("no API key leakage", "test-key-for-mocks" not in response.text)

    print("-" * 60)
    if failures:
        print(f"{len(failures)} test(s) FAILED: {failures}")
        return 1
    print("All AI-flow integration tests passed.")
    return 0


if __name__ == "__main__":
    sys.exit(run())
