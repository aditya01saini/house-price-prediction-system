"""POST /api/predict — validate input, run the saved pipeline, return price."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from ..schemas.prediction import PredictionRequest, PredictionResponse
from ..services.artifacts import registry
from ..services.prediction_service import PredictionError, predict_price

router = APIRouter(tags=["Prediction"])


@router.post(
    "/predict",
    response_model=PredictionResponse,
    responses={
        422: {"description": "Invalid property details (validation failed)."},
        503: {"description": "ML model not loaded — train the model first."},
    },
    summary="Predict house price from property details",
)
def predict(payload: PredictionRequest) -> PredictionResponse:
    data = payload.model_dump()

    # Unknown categories are rejected with a friendly, field-specific message.
    info = registry.model_info
    if info:
        locations = info.get("locations") or []
        property_types = info.get("property_types") or []
        if locations and data["location"] not in locations:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Unknown location '{data['location']}'. Valid options: {', '.join(locations)}.",
            )
        if property_types and data["property_type"] not in property_types:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Unknown property type '{data['property_type']}'. "
                       f"Valid options: {', '.join(property_types)}.",
            )

    try:
        return predict_price(data)
    except PredictionError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc
