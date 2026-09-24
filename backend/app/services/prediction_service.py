"""Prediction service — runs the saved ML pipeline on validated user input.

No hardcoded values: the price always comes from
``models/house_price_model.joblib`` (the full preprocessing + regressor
pipeline), so serving uses exactly the same transformations as training.
"""
from __future__ import annotations

import logging

import numpy as np
import pandas as pd

from .artifacts import registry

logger = logging.getLogger("app.prediction")

# Column order expected by the saved pipeline's FeatureEngineer step.
RAW_INPUT_COLUMNS = [
    "area",
    "bedrooms",
    "bathrooms",
    "floors",
    "parking",
    "property_age",
    "location",
    "property_type",
]


class PredictionError(RuntimeError):
    """Raised when the pipeline itself fails (mapped to HTTP 500 with a
    friendly message — never a raw traceback)."""


def predict_price(payload: dict) -> dict:
    model = registry.require_model()
    metrics = registry.require_metrics()

    frame = pd.DataFrame([{name: payload[name] for name in RAW_INPUT_COLUMNS}])

    try:
        prediction = model.predict(frame)
    except Exception as exc:  # noqa: BLE001 - converted to a safe API error
        logger.exception("Pipeline prediction failed")
        raise PredictionError(
            "The model could not process this property. Please check the input values and try again."
        ) from exc

    predicted_price = round(float(np.ravel(prediction)[0]), 2)
    predicted_price = max(predicted_price, 0.0)

    best_name = metrics["best_model"]
    best_stats = next(m for m in metrics["models"] if m["model"] == best_name)

    return {
        "predicted_price": predicted_price,
        "currency": "INR",
        "model": best_name,
        "performance": {
            "r2": best_stats["R2"],
            "mae": best_stats["MAE"],
            "rmse": best_stats["RMSE"],
        },
        "inputs": payload,
    }
