"""End-to-end training orchestrator for the House Price Prediction System.

Pipeline (run from the ``backend`` directory with ``python -m ml.train``):

    Dataset → Data Loading → Data Cleaning → EDA → Feature Engineering
    → Categorical Encoding → Train/Test Split → Model Training
    → Model Evaluation → Model Selection → Model Saving

Artifacts written to ``backend/models``:
    house_price_model.joblib  full Pipeline (features + preprocessing + regressor)
    metrics.json              per-model MAE/MSE/RMSE/R² computed on the test set
    model_info.json           schema/features/validation bounds for the API & UI
    analytics.json            real chart data for the Analytics page

Reports written to ``backend/reports`` (matplotlib/seaborn):
    price_distribution.png, correlation_heatmap.png, model_comparison.png,
    actual_vs_predicted.png, feature_importance.png
"""
from __future__ import annotations

import json
import time
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import sklearn
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeRegressor

from ml.evaluate import compute_metrics
from ml.preprocessing import (
    ALL_CATEGORICAL,
    ALL_NUMERICAL,
    BASE_NUMERICAL,
    FEATURE_COUNT,
    RAW_INPUT_COLUMNS,
    TARGET,
    build_pipeline,
)

# --------------------------------------------------------------------------- #
# Paths (all relative to the backend/ directory)                               #
# --------------------------------------------------------------------------- #
BASE_DIR = Path(__file__).resolve().parents[1]
DATA_PATH = BASE_DIR / "data" / "house_prices.csv"
MODELS_DIR = BASE_DIR / "models"
REPORTS_DIR = BASE_DIR / "reports"

RANDOM_STATE = 42
TEST_SIZE = 0.2

MODEL_CANDIDATES = {
    "Linear Regression": lambda: LinearRegression(),
    "Decision Tree": lambda: DecisionTreeRegressor(random_state=RANDOM_STATE),
    "Random Forest": lambda: RandomForestRegressor(n_estimators=240, min_samples_leaf=2, random_state=RANDOM_STATE, n_jobs=-1),
}

# Validation bounds exposed to the API and reused by the frontend form.
PREDICTION_INPUTS = [
    {"name": "area", "label": "Area", "unit": "sq ft", "type": "number", "min": 300, "max": 10000, "step": 50,
     "hint": "Total built-up area of the property in square feet."},
    {"name": "bedrooms", "label": "Bedrooms", "unit": "BHK", "type": "number", "min": 1, "max": 6, "step": 1,
     "hint": "Number of bedrooms in the property."},
    {"name": "bathrooms", "label": "Bathrooms", "unit": "", "type": "number", "min": 1, "max": 5, "step": 1,
     "hint": "Number of bathrooms in the property."},
    {"name": "floors", "label": "Floors", "unit": "", "type": "number", "min": 1, "max": 3, "step": 1,
     "hint": "Number of floors (or the floor level for apartments)."},
    {"name": "parking", "label": "Parking", "unit": "spots", "type": "number", "min": 0, "max": 3, "step": 1,
     "hint": "Number of covered parking spots."},
    {"name": "property_age", "label": "Property Age", "unit": "years", "type": "number", "min": 0, "max": 45, "step": 1,
     "hint": "Years since the property was built (0 for new construction)."},
    {"name": "location", "label": "Location", "unit": "", "type": "select",
     "hint": "City / metro where the property is located."},
    {"name": "property_type", "label": "Property Type", "unit": "", "type": "select",
     "hint": "Kind of property being valued."},
]


# --------------------------------------------------------------------------- #
# 1–2. Data loading & cleaning                                                 #
# --------------------------------------------------------------------------- #
def load_data(path: Path = DATA_PATH) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(
            f"Dataset not found at {path}. Generate it with: python -m ml.generate_dataset"
        )
    return pd.read_csv(path)


def clean_data(df: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    """Structural cleaning. Statistical imputation is intentionally left to the
    scikit-learn Pipeline (fitted on the training split only) to avoid leakage."""
    log: dict = {"initial_rows": int(len(df)), "initial_columns": int(df.shape[1])}

    df = df.copy()
    df.columns = [c.strip() for c in df.columns]

    # Exact duplicate records (re-scraped listings).
    before = len(df)
    df = df.drop_duplicates()
    log["duplicates_removed"] = int(before - len(df))

    # Enforce numeric dtypes; unparseable entries become NaN (imputed later).
    numeric_cols = ["area", "bedrooms", "bathrooms", "floors", "parking", "property_age", "price"]
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    # Drop rows with an invalid or missing target / impossible area.
    invalid_target = int((df["price"].isna() | (df["price"] <= 0)).sum())
    invalid_area = int((df["area"].isna() | (df["area"] <= 0)).sum())
    df = df[df["price"].notna() & (df["price"] > 0)]
    df = df[df["area"].notna() & (df["area"] > 0)]
    log["invalid_target_rows_removed"] = invalid_target
    log["invalid_area_rows_removed"] = invalid_area

    # Impossible ages are data-entry errors — treat them as missing so the
    # pipeline's imputer handles them like the other gaps.
    bad_age = int((df["property_age"] < 0).sum() + (df["property_age"] > 100).sum())
    df.loc[(df["property_age"] < 0) | (df["property_age"] > 100), "property_age"] = np.nan
    log["invalid_age_values_neutered"] = bad_age

    # Plain `object` dtype with np.nan (NOT pandas StringDtype/pd.NA) — sklearn
    # imputers and encoders require numpy-native missing values.
    for col in ("location", "property_type"):
        raw_values = df[col].astype(object)
        df[col] = raw_values.map(lambda v: v.strip() if isinstance(v, str) and v.strip() else np.nan)

    df = df.reset_index(drop=True)
    log["final_rows"] = int(len(df))
    log["rows_removed_total"] = log["initial_rows"] - log["final_rows"]
    log["missing_values_after_cleaning"] = int(df.isna().sum().sum())
    return df, log


# --------------------------------------------------------------------------- #
# 3. Exploratory Data Analysis                                                 #
# --------------------------------------------------------------------------- #
def perform_eda(df: pd.DataFrame) -> dict:
    price = df[TARGET]
    return {
        "records": int(len(df)),
        "price_min": round(float(price.min()), 2),
        "price_max": round(float(price.max()), 2),
        "price_mean": round(float(price.mean()), 2),
        "price_median": round(float(price.median()), 2),
        "price_std": round(float(price.std()), 2),
        "area_min": round(float(df["area"].min()), 2),
        "area_max": round(float(df["area"].max()), 2),
        "locations": sorted(df["location"].dropna().unique().tolist()),
        "property_types": sorted(df["property_type"].dropna().unique().tolist()),
        "missing_per_column": {k: int(v) for k, v in df.isna().sum().items() if v > 0},
    }


# --------------------------------------------------------------------------- #
# 4. Analytics payload (REAL data for the frontend charts)                     #
# --------------------------------------------------------------------------- #
def _compact_inr(value: float) -> str:
    if value >= 1e7:
        return f"₹{value / 1e7:.1f}Cr"
    if value >= 1e5:
        return f"₹{value / 1e5:.0f}L"
    if value >= 1e3:
        return f"₹{value / 1e3:.0f}k"
    return f"₹{value:.0f}"


def build_analytics(df: pd.DataFrame, y_test: pd.Series, y_pred_best: np.ndarray,
                    test_r2: float) -> dict:
    rng = np.random.default_rng(RANDOM_STATE)

    # 1. Price distribution (10 equal-width bins).
    counts, edges = np.histogram(df[TARGET], bins=10)
    bins = [
        {
            "label": f"{_compact_inr(edges[i])}–{_compact_inr(edges[i + 1])}",
            "from": round(float(edges[i]), 2),
            "to": round(float(edges[i + 1]), 2),
            "count": int(counts[i]),
        }
        for i in range(len(counts))
    ]

    # 2. Area vs price (sampled scatter, coloured by property type in the UI).
    sample = df.sample(n=min(450, len(df)), random_state=RANDOM_STATE)
    area_price = [
        {"area": round(float(r.area)), "price": round(float(r.price)), "property_type": r.property_type}
        for r in sample.itertuples()
    ]

    # 3. Correlation matrix (base numerical features + target).
    corr_df = df[[*BASE_NUMERICAL, TARGET]].corr(numeric_only=True)
    columns = corr_df.columns.tolist()
    matrix = [[round(float(v), 3) for v in row] for row in corr_df.to_numpy()]

    # 4. Average price per location.
    grouped = df.groupby("location")[TARGET].agg(["mean", "count"]).sort_values("mean", ascending=False)
    avg_by_location = [
        {"location": idx, "avg_price": round(float(row["mean"]), 2), "count": int(row["count"])}
        for idx, row in grouped.iterrows()
    ]

    # 5. Actual vs predicted on the held-out test set (sampled).
    idx = rng.choice(len(y_test), size=min(300, len(y_test)), replace=False)
    y_t = np.asarray(y_test)[idx]
    y_p = np.asarray(y_pred_best)[idx]
    order = np.argsort(y_t)
    actual_vs_predicted = [
        {"actual": round(float(y_t[i]), 2), "predicted": round(float(y_p[i]), 2)}
        for i in order
    ]

    # 6. Price per sq ft by city — computed for EDA reporting only (leaky as a feature).
    ppsf = (df[TARGET] / df["area"]).groupby(df["location"]).mean().sort_values(ascending=False)
    price_per_sqft = [{"location": idx, "price_per_sqft": round(float(v), 2)} for idx, v in ppsf.items()]

    return {
        "price_distribution": bins,
        "area_vs_price": {"sample_size": len(area_price), "points": area_price},
        "correlation": {"columns": columns, "matrix": matrix},
        "avg_price_by_location": avg_by_location,
        "actual_vs_predicted": {"sample_size": len(actual_vs_predicted), "r2": test_r2, "points": actual_vs_predicted},
        "price_per_sqft_by_location": price_per_sqft,
    }



# --------------------------------------------------------------------------- #
# 4b. Model-based feature importance (from the trained forest itself)          #
# --------------------------------------------------------------------------- #
def extract_feature_importance(pipeline) -> list[dict] | None:
    """Aggregated feature importances from the final regressor, if supported.

    One-hot columns are summed back into their logical feature (e.g. all
    `location_*` dummies count towards `location`) so the importance vector
    matches the 11 model features shown in the UI and passed to the AI layer.
    """
    regressor = pipeline.named_steps["regressor"]
    if not hasattr(regressor, "feature_importances_"):
        return None
    try:
        names = pipeline.named_steps["preprocessing"].get_feature_names_out()
        importances = regressor.feature_importances_
    except Exception as exc:  # pragma: no cover - never break training on reporting
        print(f"[importance] skipped: {exc}")
        return None

    aggregated = {feature: 0.0 for feature in ALL_NUMERICAL + ALL_CATEGORICAL}
    for name, importance in zip(names, importances):
        for feature in ALL_CATEGORICAL:
            if name.startswith(f"{feature}_"):
                aggregated[feature] += float(importance)
                break
        else:
            if name in aggregated:
                aggregated[name] += float(importance)

    total = sum(aggregated.values()) or 1.0
    items = [
        {"feature": feature, "importance": round(value / total, 4)}
        for feature, value in aggregated.items()
    ]
    items.sort(key=lambda item: item["importance"], reverse=True)
    return items


# --------------------------------------------------------------------------- #
# 5. Static EDA reports (matplotlib + seaborn)                                 #
# --------------------------------------------------------------------------- #
def generate_reports(df: pd.DataFrame, results: list, best_name: str, y_test, y_pred_best) -> list:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    import seaborn as sns

    sns.set_theme(style="whitegrid", palette="crest")
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    written = []

    def save(fig, name):
        path = REPORTS_DIR / name
        fig.tight_layout()
        fig.savefig(path, dpi=130)
        plt.close(fig)
        written.append(str(path.relative_to(BASE_DIR)))

    fig, ax = plt.subplots(figsize=(8, 4.5))
    sns.histplot(df[TARGET] / 1e6, bins=40, kde=True, ax=ax, color="#0f766e")
    ax.set_title("Price Distribution")
    ax.set_xlabel("Price (₹ million)")
    ax.set_ylabel("Number of properties")
    save(fig, "price_distribution.png")

    fig, ax = plt.subplots(figsize=(8, 6.5))
    sns.heatmap(df[[*BASE_NUMERICAL, TARGET]].corr(numeric_only=True), annot=True, fmt=".2f",
                cmap="crest", square=True, cbar_kws={"shrink": 0.8}, ax=ax)
    ax.set_title("Feature Correlation Heatmap")
    save(fig, "correlation_heatmap.png")

    names = [r["model"] for r in results]
    x = np.arange(len(names))
    fig, axes = plt.subplots(1, 2, figsize=(11, 4.2))
    axes[0].bar(x, [r["R2"] for r in results], color=["#94a3b8", "#94a3b8", "#0f766e"])
    axes[0].set_title("R² Score by Model")
    axes[0].set_xticks(x, names, fontsize=9)
    axes[1].bar(x, [r["RMSE"] / 1e6 for r in results], color=["#94a3b8", "#94a3b8", "#0f766e"])
    axes[1].set_title("RMSE by Model (₹ million)")
    axes[1].set_xticks(x, names, fontsize=9)
    save(fig, "model_comparison.png")

    fig, ax = plt.subplots(figsize=(6.5, 6))
    lim = max(y_test.max(), y_pred_best.max()) * 1.02
    ax.scatter(y_test / 1e6, y_pred_best / 1e6, s=12, alpha=0.45, color="#0f766e")
    ax.plot([0, lim / 1e6], [0, lim / 1e6], "--", color="#f59e0b", label="Perfect prediction")
    ax.set_title(f"Actual vs Predicted — {best_name}")
    ax.set_xlabel("Actual price (₹ million)")
    ax.set_ylabel("Predicted price (₹ million)")
    ax.legend()
    save(fig, "actual_vs_predicted.png")

    # Random-forest feature importance (mapped back through the pipeline).
    try:
        best_result = next(r for r in results if r["model"] == best_name)
        pipe = best_result["_pipeline"]
        reg = pipe.named_steps["regressor"]
        pre = pipe.named_steps["preprocessing"]
        if hasattr(reg, "feature_importances_"):
            names_out = pre.get_feature_names_out()
            importances = pd.Series(reg.feature_importances_, index=names_out).sort_values(ascending=True)
            fig, ax = plt.subplots(figsize=(8, 5.5))
            importances.tail(12).plot(kind="barh", ax=ax, color="#0f766e")
            ax.set_title(f"Top Feature Importances — {best_name}")
            save(fig, "feature_importance.png")
    except Exception as exc:  # pragma: no cover - reporting must never break training
        print(f"[reports] skipped feature importance: {exc}")

    return written


# --------------------------------------------------------------------------- #
# 6–10. Orchestration                                                          #
# --------------------------------------------------------------------------- #
def main() -> None:
    print("=" * 72)
    print("HousePredict AI — model training")
    print("=" * 72)

    # 1. Load -------------------------------------------------------------- #
    raw = load_data()
    print(f"[load]     {raw.shape[0]} rows × {raw.shape[1]} columns from {DATA_PATH.name}")

    # 2. Clean ------------------------------------------------------------- #
    df, clean_log = clean_data(raw)
    print(f"[clean]    {clean_log}")

    # 3. EDA --------------------------------------------------------------- #
    eda = perform_eda(df)
    print(f"[eda]      price ₹{eda['price_min']:,.0f} – ₹{eda['price_max']:,.0f} "
          f"(median ₹{eda['price_median']:,.0f}); locations={len(eda['locations'])}")

    # 4–5. Features / encoding are inside the pipeline; 6. split ----------- #
    X = df[RAW_INPUT_COLUMNS].copy()
    y = df[TARGET].copy()
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE
    )
    print(f"[split]    train={len(X_train)}  test={len(X_test)}  (test_size={TEST_SIZE})")

    # 7–8. Train + evaluate every candidate -------------------------------- #
    results = []
    for name, factory in MODEL_CANDIDATES.items():
        pipeline = build_pipeline(factory())
        start = time.perf_counter()
        pipeline.fit(X_train, y_train)
        fit_seconds = time.perf_counter() - start
        y_pred = pipeline.predict(X_test)
        metrics = compute_metrics(y_test, y_pred)
        results.append({
            "model": name,
            **metrics,
            "fit_seconds": round(fit_seconds, 3),
            "_pipeline": pipeline,
            "_y_pred": y_pred,
        })
        print(f"[train]    {name:<18} MAE=₹{metrics['MAE']:>12,.0f}  RMSE=₹{metrics['RMSE']:>12,.0f}  R²={metrics['R2']:.4f}")

    # 9. Select the best model (highest test R²) ---------------------------- #
    best = max(results, key=lambda r: r["R2"])
    feature_importance = extract_feature_importance(best["_pipeline"])
    print(f"[explain]  feature importance ready: {(feature_importance or [])[:3]}")
    best_name = best["model"]
    print(f"[select]   best model: {best_name} (R²={best['R2']:.4f})")

    # 10. Persist artifacts -------------------------------------------------- #
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    model_path = MODELS_DIR / "house_price_model.joblib"
    joblib.dump(best["_pipeline"], model_path, compress=3)
    print(f"[save]     pipeline → {model_path.relative_to(BASE_DIR)}")

    metrics_doc = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "selection_metric": "R2",
        "selection_rule": "Highest R-squared on the held-out test set.",
        "test_size": TEST_SIZE,
        "random_state": RANDOM_STATE,
        "n_train": int(len(X_train)),
        "n_test": int(len(X_test)),
        "best_model": best_name,
        "models": [{k: v for k, v in r.items() if not k.startswith("_")} for r in results],
        "metric_explanations": {
            "MAE": "Lower is better — average absolute ₹ error on the test set.",
            "MSE": "Lower is better — mean of squared ₹ errors (penalises large misses).",
            "RMSE": "Lower is better — square root of MSE, in ₹.",
            "R2": "Higher is better — proportion of price variance explained (max 1.0).",
        },
    }
    (MODELS_DIR / "metrics.json").write_text(json.dumps(metrics_doc, indent=2))

    model_info = {
        "generated_at": metrics_doc["generated_at"],
        "project": "House Price Prediction System (HousePredict AI)",
        "target": TARGET,
        "currency": "INR",
        "best_model": best_name,
        "features": {
            "numerical": ALL_NUMERICAL,
            "categorical": ALL_CATEGORICAL,
            "count": FEATURE_COUNT,
        },
        "raw_inputs": RAW_INPUT_COLUMNS,
        "prediction_inputs": [
            {**spec, "options": (
                eda["locations"] if spec["name"] == "location"
                else eda["property_types"] if spec["name"] == "property_type"
                else None
            )}
            for spec in PREDICTION_INPUTS
        ],
        "feature_importance": feature_importance,
        "locations": eda["locations"],
        "property_types": eda["property_types"],
        "dataset": {
            "source": "Sample dataset generated by ml/generate_dataset.py (development/demo data — see README)",
            "records_raw": clean_log["initial_rows"],
            "records_clean": eda["records"],
            "duplicates_removed": clean_log["duplicates_removed"],
            "invalid_rows_removed": clean_log["invalid_target_rows_removed"] + clean_log["invalid_area_rows_removed"],
            "missing_values_in_features": eda["missing_per_column"],
            **{f"price_{k}": v for k, v in eda.items() if k.startswith("price_")},
            "area_min": eda["area_min"],
            "area_max": eda["area_max"],
            "n_locations": len(eda["locations"]),
            "train_samples": int(len(X_train)),
            "test_samples": int(len(X_test)),
        },
        "environment": {},  # filled below with explicit versions
        "cleaning_log": clean_log,
    }
    import sys
    model_info["environment"] = {
        "python": sys.version.split()[0],
        "sklearn": sklearn.__version__,
        "pandas": pd.__version__,
        "numpy": np.__version__,
    }
    (MODELS_DIR / "model_info.json").write_text(json.dumps(model_info, indent=2))

    analytics = build_analytics(df, y_test, best["_y_pred"], best["R2"])
    (MODELS_DIR / "analytics.json").write_text(json.dumps(analytics, indent=2))
    print("[save]     metrics.json, model_info.json, analytics.json → models/")

    reports = generate_reports(df, results, best_name, y_test, best["_y_pred"])
    for r in reports:
        print(f"[report]   {r}")

    print("-" * 72)
    print(f"{'Model':<20}{'MAE (₹)':>14}{'MSE (₹²)':>18}{'RMSE (₹)':>14}{'R²':>10}")
    for r in results:
        marker = "  ★ best" if r["model"] == best_name else ""
        print(f"{r['model']:<20}{r['MAE']:>14,.0f}{r['MSE']:>18,.0f}{r['RMSE']:>14,.0f}{r['R2']:>10.4f}{marker}")
    print("=" * 72)
    print("Training complete. Start the API with: uvicorn app.main:app --reload")


if __name__ == "__main__":
    main()
