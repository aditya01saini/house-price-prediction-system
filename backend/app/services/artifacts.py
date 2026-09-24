"""Model artifact registry — loads and owns the trained pipeline + metadata.

Everything is loaded once at application startup (lifespan) so predictions are
served from memory. All accessors raise ``ArtifactError`` subclasses with
user-friendly messages when artifacts are missing, and the API layer converts
those into proper HTTP 503 responses — raw stack traces never reach clients.
"""
from __future__ import annotations

import json
import logging
from typing import Any

from ..config import ANALYTICS_PATH, METRICS_PATH, MODEL_INFO_PATH, MODEL_PATH

logger = logging.getLogger("app.artifacts")


class ArtifactError(RuntimeError):
    """Base class for artifact problems (mapped to HTTP 503 by the API)."""


class ModelNotLoadedError(ArtifactError):
    pass


class ArtifactRegistry:
    def __init__(self) -> None:
        self._model: Any | None = None
        self._metrics: dict | None = None
        self._model_info: dict | None = None
        self._analytics: dict | None = None
        self._loaded: bool = False

    # ------------------------------------------------------------------ #
    def load(self) -> None:
        if not MODEL_PATH.exists():
            raise ModelNotLoadedError(
                f"Trained model not found at {MODEL_PATH}. "
                "Train it first: cd backend && python -m ml.train"
            )
        logger.info("Loading model pipeline from %s", MODEL_PATH)
        self._model = joblib_load(MODEL_PATH)

        if not METRICS_PATH.exists():
            raise ModelNotLoadedError(
                f"metrics.json missing next to the model ({METRICS_PATH}). "
                "Re-run training: python -m ml.train"
            )
        self._metrics = json.loads(METRICS_PATH.read_text(encoding="utf-8"))

        if not MODEL_INFO_PATH.exists():
            raise ModelNotLoadedError(f"model_info.json missing ({MODEL_INFO_PATH}). Re-run training.")
        self._model_info = json.loads(MODEL_INFO_PATH.read_text(encoding="utf-8"))

        if ANALYTICS_PATH.exists():
            self._analytics = json.loads(ANALYTICS_PATH.read_text(encoding="utf-8"))
        else:
            logger.warning("analytics.json not found — /api/analytics will return 503 until training is re-run.")

        self._loaded = True
        logger.info("Artifacts ready — best model: %s", self._metrics.get("best_model"))

    # ------------------------------------------------------------------ #
    @property
    def is_ready(self) -> bool:
        return self._loaded

    def require_model(self) -> Any:
        if not self._loaded or self._model is None:
            raise ModelNotLoadedError(
                "The ML model is not loaded. Train it with: cd backend && python -m ml.train"
            )
        return self._model

    @property
    def metrics(self) -> dict | None:
        return self._metrics

    @property
    def model_info(self) -> dict | None:
        return self._model_info

    @property
    def analytics(self) -> dict | None:
        return self._analytics

    def require_metrics(self) -> dict:
        if self._metrics is None:
            raise ModelNotLoadedError("Model metrics are not available. Re-run training.")
        return self._metrics

    def require_model_info(self) -> dict:
        if self._model_info is None:
            raise ModelNotLoadedError("Model info is not available. Re-run training.")
        return self._model_info

    def require_analytics(self) -> dict:
        if self._analytics is None:
            raise ModelNotLoadedError(
                "Analytics data is not available. Generate it with: python -m ml.train"
            )
        return self._analytics


def joblib_load(path):
    import joblib

    return joblib.load(path)


registry = ArtifactRegistry()
