"""Pydantic schemas for the Generative-AI endpoints.

The AI context reuses the exact prediction field definitions so the same
validation protects Mistral calls. The Mistral key never appears here —
responses carry only text + metadata.
"""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from .prediction import PredictionRequest


class AIContext(PredictionRequest):
    """Property + ML prediction context passed to the AI service."""

    predicted_price: float = Field(..., ge=0, le=1_000_000_000_000, description="ML-estimated price in INR.")
    model_name: str = Field(default="Random Forest", max_length=80, description="Name of the serving model.")


class AIAnalyzeRequest(AIContext):
    """POST /api/ai/analyze — flat body: property fields + predicted_price + model_name."""


class AIExplainRequest(AIContext):
    """POST /api/ai/explain — same body as analyze; response adds real feature importance."""


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(..., min_length=1, max_length=1200)


class AIChatRequest(BaseModel):
    """POST /api/ai/chat — conversation history + optional prediction context."""

    messages: list[ChatMessage] = Field(..., min_length=1, max_length=12)
    context: AIContext | None = Field(None, description="Latest prediction to ground the chat on (optional).")


class AIAnalysisResponse(BaseModel):
    provider: str = "mistral"
    model: str
    analysis: str = Field(..., description="Markdown-style analysis text with section headings and bullets.")
    disclaimer: str
    cached: bool = False


class AIExplanationResponse(BaseModel):
    provider: str = "mistral"
    model: str
    explanation: str
    feature_importance: list[dict] | None = Field(
        None, description="Real model-based importances (aggregated from the trained forest)."
    )
    disclaimer: str
    cached: bool = False


class AIChatResponse(BaseModel):
    provider: str = "mistral"
    model: str
    reply: str
    disclaimer: str
