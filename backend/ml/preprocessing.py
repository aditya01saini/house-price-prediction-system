"""Preprocessing components shared by training and serving.

The single source of truth for feature engineering lives here so the *exact*
transformations fitted during training are replayed at prediction time — the
whole Pipeline (FeatureEngineer → ColumnTransformer → Regressor) is persisted
with Joblib as one object.

Design note (target leakage): ``price_per_sqft`` is computed during EDA for
reporting, but is deliberately NOT used as a model feature — it is derived
from the target ``price`` itself and would not exist at prediction time.
"""
from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

# --------------------------------------------------------------------------- #
# Schema — mirrors the dataset produced by ml/generate_dataset.py              #
# --------------------------------------------------------------------------- #
TARGET = "price"

BASE_NUMERICAL = ["area", "bedrooms", "bathrooms", "floors", "parking", "property_age"]
BASE_CATEGORICAL = ["location", "property_type"]

ENGINEERED_NUMERICAL = ["total_rooms", "area_per_room"]
ENGINEERED_CATEGORICAL = ["age_group"]

ALL_NUMERICAL = BASE_NUMERICAL + ENGINEERED_NUMERICAL
ALL_CATEGORICAL = BASE_CATEGORICAL + ENGINEERED_CATEGORICAL
FEATURE_COUNT = len(ALL_NUMERICAL) + len(ALL_CATEGORICAL)  # 11

# Raw columns the prediction API must receive (order matters for the DataFrame).
RAW_INPUT_COLUMNS = BASE_NUMERICAL + BASE_CATEGORICAL

AGE_BINS = [-np.inf, 5, 15, 30, np.inf]
AGE_LABELS = ["New (0-5 yrs)", "Recent (5-15 yrs)", "Established (15-30 yrs)", "Old (30+ yrs)"]


class FeatureEngineer(BaseEstimator, TransformerMixin):
    """Derives model features from the raw input columns.

    Engineered features (all available at prediction time):
      * ``total_rooms``    = bedrooms + bathrooms
      * ``area_per_room``  = area / total_rooms   (spaciousness proxy)
      * ``age_group``      = binned property age (categorical)
    """

    def fit(self, X: pd.DataFrame, y=None) -> "FeatureEngineer":
        return self

    def transform(self, X: pd.DataFrame) -> pd.DataFrame:
        df = X.copy()

        bedrooms = pd.to_numeric(df["bedrooms"], errors="coerce")
        bathrooms = pd.to_numeric(df["bathrooms"], errors="coerce")
        df["total_rooms"] = bedrooms + bathrooms

        area = pd.to_numeric(df["area"], errors="coerce")
        rooms = df["total_rooms"].replace(0, np.nan)
        df["area_per_room"] = area / rooms

        age = pd.to_numeric(df["property_age"], errors="coerce")
        df["age_group"] = pd.cut(age, bins=AGE_BINS, labels=AGE_LABELS).astype(object)

        return df


def build_preprocessor() -> ColumnTransformer:
    """Numerical: median imputation + standard scaling.
    Categorical: most-frequent imputation + one-hot encoding.

    ``handle_unknown='ignore'`` keeps the API resilient to unseen categories at
    prediction time instead of crashing.
    """
    numerical = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
    ])
    categorical = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
    ])
    return ColumnTransformer(
        transformers=[
            ("numerical", numerical, ALL_NUMERICAL),
            ("categorical", categorical, ALL_CATEGORICAL),
        ],
        remainder="drop",
        verbose_feature_names_out=False,
    )


def build_pipeline(regressor) -> Pipeline:
    """Full trainable/servable pipeline: features → preprocessing → model."""
    return Pipeline(steps=[
        ("features", FeatureEngineer()),
        ("preprocessing", build_preprocessor()),
        ("regressor", regressor),
    ])
