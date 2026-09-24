"""Regression evaluation helpers — MAE, MSE, RMSE, R² (no invented numbers)."""
from __future__ import annotations

import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

METRIC_NAMES = ("MAE", "MSE", "RMSE", "R2")


def compute_metrics(y_true, y_pred) -> dict:
    """Return all four regression metrics, computed from actual predictions."""
    y_true = np.asarray(y_true, dtype=float)
    y_pred = np.asarray(y_pred, dtype=float)
    return {
        "MAE": round(float(mean_absolute_error(y_true, y_pred)), 2),
        "MSE": round(float(mean_squared_error(y_true, y_pred)), 2),
        "RMSE": round(float(np.sqrt(mean_squared_error(y_true, y_pred))), 2),
        "R2": round(float(r2_score(y_true, y_pred)), 4),
    }


def describe_metric(metric: str) -> str:
    """Plain-language explanation used by the API/UI."""
    return {
        "MAE": "Mean absolute error — average ₹ miss per prediction (lower is better).",
        "MSE": "Mean squared error — squared errors, penalising large misses (lower is better).",
        "RMSE": "Root mean squared error — MSE in ₹ terms (lower is better).",
        "R2": "R² score — share of price variance explained by the model (higher is better, max 1.0).",
    }[metric]
