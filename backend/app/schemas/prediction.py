"""Pydantic schemas — request validation and response contracts.

Field constraints mirror the training dataset's realistic ranges so invalid
property details are rejected with a clear 422 before reaching the model.
"""
from __future__ import annotations

from pydantic import BaseModel, Field, field_validator


class PredictionRequest(BaseModel):
    area: float = Field(
        ...,
        gt=0,
        le=15000,
        description="Built-up area of the property in square feet.",
        examples=[2000],
    )
    bedrooms: int = Field(..., ge=1, le=10, description="Number of bedrooms.", examples=[3])
    bathrooms: int = Field(..., ge=1, le=10, description="Number of bathrooms.", examples=[2])
    floors: int = Field(..., ge=1, le=6, description="Number of floors (or apartment floor level).", examples=[2])
    parking: int = Field(..., ge=0, le=6, description="Number of covered parking spots.", examples=[1])
    property_age: int = Field(
        ..., ge=0, le=100, description="Age of the property in years (0 for new builds).", examples=[5]
    )
    location: str = Field(..., min_length=1, max_length=60, description="City / metro location.", examples=["Mumbai"])
    property_type: str = Field(
        ..., min_length=1, max_length=60, description="Type of property (e.g. Apartment, Villa).",
        examples=["Apartment"],
    )

    @field_validator("location", "property_type")
    @classmethod
    def _not_blank(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("must not be blank")
        return stripped


class ModelPerformance(BaseModel):
    r2: float = Field(..., description="R² score of the serving model on the held-out test set.")
    mae: float = Field(..., description="Mean absolute error (₹) on the test set.")
    rmse: float = Field(..., description="Root mean squared error (₹) on the test set.")


class PredictionResponse(BaseModel):
    predicted_price: float = Field(..., description="Estimated market price in INR.")
    currency: str = Field(..., examples=["INR"])
    model: str = Field(..., description="Name of the trained model that produced the estimate.")
    performance: ModelPerformance = Field(..., description="Test-set metrics of the serving model.")
    inputs: dict = Field(..., description="Echo of the property details used for the prediction.")

    model_config = {"json_schema_extra": {
        "examples": [
            {
                "predicted_price": 28650000.0,
                "currency": "INR",
                "model": "Random Forest",
                "performance": {"r2": 0.9489, "mae": 1886053.0, "rmse": 3067646.0},
                "inputs": {
                    "area": 2000, "bedrooms": 3, "bathrooms": 2, "floors": 2,
                    "parking": 1, "property_age": 5, "location": "Mumbai", "property_type": "Apartment",
                },
            }
        ]
    }}


class ErrorResponse(BaseModel):
    message: str = Field(..., description="Human-readable error explanation.")
    errors: list[dict] | None = Field(None, description="Optional field-level validation details.")
