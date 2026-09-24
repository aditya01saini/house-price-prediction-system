"""GET /api/model-info — trained model metadata (drives the frontend forms)."""
from __future__ import annotations

from fastapi import APIRouter

from ..services.artifacts import registry

router = APIRouter(tags=["Model"])


@router.get("/model-info", summary="Model metadata, features and input schema")
def get_model_info():
    """Feature schema, dataset stats and validation bounds. The prediction
    form is generated dynamically from ``prediction_inputs`` so the UI always
    matches the trained model."""
    return registry.require_model_info()
