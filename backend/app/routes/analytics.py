"""GET /api/analytics — real chart data for the Analytics page.

All series are computed by ``ml/train.py`` from the actual dataset and the
best model's predictions on the test set. No chart data is invented in the
frontend; if this payload is missing the API returns 503 and the UI shows a
clear message instead of fake charts.
"""
from __future__ import annotations

from fastapi import APIRouter

from ..services.artifacts import registry

router = APIRouter(tags=["Analytics"])


@router.get("/analytics", summary="Dataset and model visualisation data")
def get_analytics():
    return registry.require_analytics()
