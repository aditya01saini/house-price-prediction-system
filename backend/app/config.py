"""Application configuration — paths, metadata and environment settings.

Secrets (e.g. MISTRAL_API_KEY) are read from backend/.env or the process
environment ONLY. They are never hardcoded and never sent to the frontend.
"""
from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

# backend/ directory (this file lives at backend/app/config.py)
BASE_DIR = Path(__file__).resolve().parents[1]

# Load backend/.env when present (git-ignored; see backend/.env.example).
load_dotenv(BASE_DIR / ".env")

MODELS_DIR = BASE_DIR / "models"
DATA_DIR = BASE_DIR / "data"
MODEL_PATH = MODELS_DIR / "house_price_model.joblib"
METRICS_PATH = MODELS_DIR / "metrics.json"
MODEL_INFO_PATH = MODELS_DIR / "model_info.json"
ANALYTICS_PATH = MODELS_DIR / "analytics.json"


def _split_origins(raw: str) -> list[str]:
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


class Settings:
    """Runtime settings — environment-driven (12-factor style)."""

    app_name: str = "HousePredict AI API"
    description: str = "Smart Property Valuation Powered by Machine Learning & Generative AI"
    version: str = "1.1.0"
    currency: str = "INR"

    # ------------------------------------------------------------------ #
    # CORS — dev proxy is same-origin; this covers direct cross-origin use #
    # ------------------------------------------------------------------ #
    frontend_url: str = os.getenv("FRONTEND_URL", "http://localhost:5173").strip()
    allowed_origins: list[str] = (
        _split_origins(os.getenv("ALLOWED_ORIGINS", ""))
        or _split_origins(f"{frontend_url},http://127.0.0.1:5173")
    )

    # ------------------------------------------------------------------ #
    # Mistral (Generative AI) — key stays on the backend, ALWAYS          #
    # ------------------------------------------------------------------ #
    mistral_api_key: str = os.getenv("MISTRAL_API_KEY", "").strip()
    mistral_model: str = os.getenv("MISTRAL_MODEL", "mistral-small-latest").strip()
    mistral_base_url: str = os.getenv("MISTRAL_BASE_URL", "https://api.mistral.ai/v1").strip()
    mistral_timeout: float = float(os.getenv("MISTRAL_TIMEOUT", "30"))


settings = Settings()
