"""GET /api/metrics — model evaluation results computed on the real test set."""
from __future__ import annotations

from fastapi import APIRouter

from ..services.artifacts import registry

router = APIRouter(tags=["Metrics"])


@router.get("/metrics", summary="Model comparison metrics (MAE, MSE, RMSE, R²)")
def get_metrics():
    """Returns per-model metrics calculated during training on the held-out
    test set — the exact same numbers shown on the Model Insights page."""
    return registry.require_metrics()
