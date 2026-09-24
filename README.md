# 🏠 House Price Prediction System

> **HousePredict AI** — *Smart Property Valuation Powered by Machine Learning*

A complete, production-style full-stack Machine Learning application that predicts the
estimated price of a residential property (INR) from its characteristics. It covers the
**entire ML lifecycle** — dataset → cleaning → EDA → feature engineering → encoding →
train/test split → model training → evaluation → selection → saved pipeline → live
prediction API → interactive analytics dashboard.

| | |
|---|---|
| **Frontend** | React 18 · Vite · Tailwind CSS · React Router · Axios · Recharts |
| **Backend** | Python · FastAPI · Uvicorn · Pydantic |
| **Machine Learning** | scikit-learn (Pipeline + ColumnTransformer) · Pandas · NumPy · Joblib |
| **Visualisation** | Matplotlib + Seaborn (offline reports) · Recharts (live dashboard) |

---

## 1. Project Overview

Users enter property details (area, bedrooms, bathrooms, floors, parking, age, location,
property type) into a React dashboard. The form itself is **generated from the backend's
model schema**, validated on the client, sent via Axios to a FastAPI endpoint, re-validated
by Pydantic, and scored by a **Joblib-serialised scikit-learn Pipeline**. The dashboard also
exposes model evaluation metrics and dataset analytics — every number and chart comes from
the real dataset/test set; nothing is mocked or hardcoded.

## 2. Features

- 🧠 **Complete ML pipeline** — one saved object (feature engineering + preprocessing + model)
- 📊 **3 models trained & compared** — Linear Regression, Decision Tree, Random Forest
- 📈 **Real evaluation** — MAE, MSE, RMSE, R² computed on a held-out test set
- 🏆 **Automatic model selection** — best test R² wins and gets served
- 🌐 **REST API** — health, model-info, metrics, analytics, prediction (Swagger docs included)
- 🖥️ **Premium React dashboard** — Dashboard, Predict, Model Insights, Analytics, About, 404
- 📱 **Fully responsive** — mobile hamburger nav, stacking forms, responsive charts
- ♿ **Accessible** — semantic HTML, labelled inputs, keyboard-focusable controls, aria-live states
- 🛡️ **Robust error handling** — friendly messages for validation, network, and missing-model cases (no stack traces reach the UI)
- ⚙️ **12-factor config** — `VITE_API_BASE_URL`, `ALLOWED_ORIGINS`, `.env.example` files

## 3. Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, Tailwind CSS, React Router, Axios, Recharts |
| Backend | FastAPI, Uvicorn, Pydantic |
| ML | scikit-learn, Pandas, NumPy, Joblib |
| Offline EDA reports | Matplotlib, Seaborn |

No other runtime dependencies — everything earns its place.

## 4. Architecture

```
┌────────────────────────────┐         ┌─────────────────────────────────┐
│  React SPA (Vite, :5173)   │         │  FastAPI (Uvicorn, :8000)       │
│  ─ React Router pages      │  Axios  │  ─ /api/health                  │
│  ─ Recharts dashboards     │ ──────▶ │  ─ /api/model-info              │
│  ─ Toasts, error states    │  JSON   │  ─ /api/metrics                 │
│  ─ api.js (central client) │         │  ─ /api/analytics               │
└────────────────────────────┘         │  ─ /api/predict  ───────┐       │
        │   dev proxy /api/*           │  Pydantic validation    │       │
        └─────────────────────────────▶└─────────────────────────┼───────┘
                                                                ▼
                                            models/house_price_model.joblib
                                            (FeatureEngineer → ColumnTransformer
                                             → RandomForestRegressor)
```

In development the Vite dev server proxies `/api/*` to the backend, so the browser uses
same-origin URLs and no host is hardcoded. In production, set `VITE_API_BASE_URL`.

## 5. ML Workflow

Implemented in `backend/ml/` and reproducible with **one command** (`python -m ml.train`):

```
DATASET → DATA CLEANING → EDA → FEATURE ENGINEERING → ENCODING
→ TRAIN/TEST SPLIT → MODEL TRAINING → MODEL EVALUATION
→ MODEL SELECTION → MODEL SAVING → PRICE PREDICTION
```

## 6. Dataset

> **Important:** no public house-price dataset existed in this project's environment, so a
> **clearly-documented sample dataset** (`backend/ml/generate_dataset.py`) is used for
> development/demo purposes. Prices follow realistic Indian metro market assumptions
> (₹8,300–₹18,500 per sq ft by city, type premiums, age depreciation, ±9 % noise) and
> **realistic data-quality issues are injected on purpose** (missing values, duplicates,
> zero prices, negative areas, impossible ages) so the cleaning stage does real work.
>
> **Use your own data:** drop any CSV with the same columns into
> `backend/data/house_prices.csv` and re-run training — everything regenerates.

**Schema** (`backend/data/house_prices.csv`, 5,030 rows):

| Column | Type | Description |
|---|---|---|
| `area` | float | Built-up area, sq ft (400–8000) |
| `bedrooms` | int | 1–6 |
| `bathrooms` | int | 1–5 |
| `floors` | int | 1–3 |
| `parking` | int | Covered spots, 0–3 |
| `property_age` | int | Years since built (0–45) |
| `location` | category | Mumbai, Delhi, Bangalore, Chennai, Hyderabad, Pune, Kolkata |
| `property_type` | category | Apartment, Independent House, Villa |
| `price` | float | **Target** — market price in INR |

## 7. Data Preprocessing

**Structural cleaning** (`ml/train.py → clean_data`) — before the split:
- exact duplicates removed (30 found)
- rows with `price ≤ 0` or `area ≤ 0` dropped (12 found)
- impossible `property_age` values treated as missing (5 found)
- categorical whitespace/blank values normalised
- every action logged into `cleaning_log` (exposed via `/api/model-info`)

**Statistical preprocessing** — *inside the Pipeline, fitted on the training split only*:

| Feature type | Steps |
|---|---|
| Numerical (8) | `SimpleImputer(median)` → `StandardScaler` |
| Categorical (3) | `SimpleImputer(most_frequent)` → `OneHotEncoder(handle_unknown="ignore")` |

Numerical: `area, bedrooms, bathrooms, floors, parking, property_age, total_rooms, area_per_room`
Categorical: `location, property_type, age_group`

## 8. Feature Engineering

Derived **at both train and predict time** by the `FeatureEngineer` transformer inside the
saved pipeline:

- `total_rooms = bedrooms + bathrooms`
- `area_per_room = area / total_rooms` (spaciousness proxy)
- `age_group` — binned property age: New (0–5) / Recent (5–15) / Established (15–30) / Old (30+)

> **Leakage note:** `price_per_sqft` is computed for EDA reports only. It is *derived from
> the target* and wouldn't exist at prediction time — using it as a feature would be target
> leakage. It is deliberately excluded from the model.

## 9. Models

Trained inside identical full Pipelines (`build_pipeline()` in `ml/preprocessing.py`):

1. **Linear Regression** — interpretable baseline
2. **Decision Tree Regressor** — non-linear, single tree (`random_state=42`)
3. **Random Forest Regressor** — 240-tree ensemble, `min_samples_leaf=2` ✅ *selected*

## 10. Evaluation Metrics

All metrics are computed on the **same 998-row held-out test split** (`test_size=0.2`,
`random_state=42`) — these are the actual values from `models/metrics.json`:

| Model | MAE (₹) | MSE (₹²) | RMSE (₹) | R² |
|---|---|---|---|---|
| Linear Regression | 2,812,032 | 1.879 × 10¹³ | 4,334,929 | 0.8979 |
| Decision Tree | 2,613,447 | 1.710 × 10¹³ | 4,135,397 | 0.9071 |
| **Random Forest** ⭐ | **1,882,569** | **9.509 × 10¹²** | **3,083,714** | **0.9483** |

*Lower MAE/MSE/RMSE indicate smaller prediction errors; higher R² means more target
variance explained. Random Forest won on every measure and was saved as the serving model.*

## 11. API Endpoints

Base URL: `http://localhost:8000` · Interactive docs: `/docs` (Swagger) · `/redoc`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Service + model status (`200 ok` / `503 degraded`) |
| GET | `/api/model-info` | Feature schema, dataset stats, prediction-form definition |
| GET | `/api/metrics` | Per-model MAE / MSE / RMSE / R² from the test set |
| GET | `/api/analytics` | Real chart data (distribution, scatter, correlation, city averages, actual-vs-predicted) |
| POST | `/api/predict` | Validate + score a property, return estimated price |

Error contract: `422` field-level validation, `503` model/artifact unavailable, `500` friendly
generic message. Raw tracebacks are never returned.

## 12. Project Structure

```
house-price-prediction/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app, CORS, error handlers, lifespan
│   │   ├── config.py                # paths + env settings
│   │   ├── routes/
│   │   │   ├── health.py            # GET  /api/health
│   │   │   ├── model_info.py        # GET  /api/model-info
│   │   │   ├── metrics.py           # GET  /api/metrics
│   │   │   ├── analytics.py         # GET  /api/analytics
│   │   │   └── prediction.py        # POST /api/predict
│   │   ├── schemas/
│   │   │   └── prediction.py        # Pydantic request/response models
│   │   └── services/
│   │       ├── artifacts.py         # model registry (joblib + JSON artifacts)
│   │       └── prediction_service.py# runs the saved pipeline
│   ├── ml/
│   │   ├── generate_dataset.py      # documented sample dataset generator
│   │   ├── preprocessing.py         # FeatureEngineer, ColumnTransformer factory
│   │   ├── evaluate.py              # MAE / MSE / RMSE / R²
│   │   └── train.py                 # full training orchestrator
│   ├── models/
│   │   ├── house_price_model.joblib # saved pipeline (preprocessing + model)
│   │   ├── metrics.json             # evaluation results (served via /api/metrics)
│   │   ├── model_info.json          # schema/stats (served via /api/model-info)
│   │   └── analytics.json           # chart data   (served via /api/analytics)
│   ├── data/house_prices.csv        # dataset (sample, documented)
│   ├── reports/*.png                # Matplotlib/Seaborn EDA reports
│   ├── requirements.txt
│   └── README.md
├── frontend/
│   ├── public/                      # favicon, hero image
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/              # Navbar (responsive), Footer
│   │   │   ├── ui/                  # Toast, Spinner, MetricCard, states, badges…
│   │   │   ├── charts/              # 6 Recharts/custom visualisations
│   │   │   ├── form/                # data-driven FormField
│   │   │   └── predict/             # ResultCard
│   │   ├── pages/                   # Dashboard, Predict, ModelInsights, Analytics, About, NotFound
│   │   ├── services/api.js          # centralised Axios client
│   │   ├── hooks/useApi.js          # loading/error/data state hook
│   │   ├── utils/format.js          # INR formatting helpers
│   │   └── constants/pipeline.js    # pipeline stage definitions
│   ├── index.html
│   ├── vite.config.js               # dev proxy /api → :8000
│   ├── .env.example
│   └── package.json
├── .gitignore
└── README.md
```

## 13. Installation

Requirements: **Python 3.10+** and **Node 18+**.

```bash
git clone <your-repo-url> house-price-prediction
cd house-price-prediction
```

## 14. Backend Setup

```bash
cd backend

# create & activate a virtual environment
python -m venv venv

# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
```

## 15. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env      # optional: defaults work with the dev proxy (Windows: copy .env.example .env)
```

## 16. Running the Project

**Terminal 1 — train the model** (only needed once, or after dataset changes):

```bash
cd backend
python -m ml.generate_dataset     # create the sample dataset (skip if using your own CSV)
python -m ml.train                # clean → EDA → train → evaluate → save artifacts
```

**Terminal 2 — start the backend:**

```bash
cd backend
uvicorn app.main:app --reload
# → http://localhost:8000  (docs at /docs)
```

**Terminal 3 — start the frontend:**

```bash
cd frontend
npm run dev
# → http://localhost:5173
```

Open **http://localhost:5173** — the Vite dev server proxies `/api/*` to port 8000.

> Production build: `npm run build` then `npm run preview`. For deployment, build the
> frontend and set `VITE_API_BASE_URL` to the backend's public URL.

## 17. Example Prediction

```bash
curl -X POST http://localhost:8000/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "area": 2000, "bedrooms": 3, "bathrooms": 2, "floors": 2,
    "parking": 1, "property_age": 5,
    "location": "Mumbai", "property_type": "Apartment"
  }'
```

Actual response (Random Forest pipeline):

```json
{
  "predicted_price": 37694907.24,
  "currency": "INR",
  "model": "Random Forest",
  "performance": { "r2": 0.9483, "mae": 1882568.81, "rmse": 3083713.99 },
  "inputs": {
    "area": 2000.0, "bedrooms": 3, "bathrooms": 2, "floors": 2,
    "parking": 1, "property_age": 5, "location": "Mumbai", "property_type": "Apartment"
  }
}
```

Invalid input returns actionable field errors instead of a stack trace:

```json
{
  "message": "Please correct the highlighted fields and try again.",
  "errors": [{ "field": "area", "message": "Input should be greater than 0" }]
}
```

## 18. Screenshots

Offline EDA/training reports are auto-generated in `backend/reports/`:

| File | Content |
|---|---|
| `price_distribution.png` | Histogram + KDE of listing prices |
| `correlation_heatmap.png` | Pearson correlation of numerical features vs price |
| `model_comparison.png` | R² and RMSE across the three models |
| `actual_vs_predicted.png` | Best model on the test set with perfect-prediction line |
| `feature_importance.png` | Top feature importances of the Random Forest |

The live dashboard pages (Dashboard, Predict, Model Insights, Analytics) render the same
real data interactively via Recharts — run the app and screenshot them for your report.

## 19. Future Improvements

- Hyperparameter tuning (GridSearchCV / Optuna) and gradient boosting (XGBoost/LightGBM)
- Cross-validated reporting (k-fold) alongside the single held-out split
- Prediction intervals (quantile regression) instead of point estimates
- Real geospatial features (locality, distance to transit) from an actual listings dataset
- Auth + rate limiting; Dockerised deployment with a production ASGI server
- Model versioning and drift monitoring (e.g. MLflow / Evidently)

## 20. Author

Built as a B.Tech final-year / portfolio project demonstrating the full machine-learning
lifecycle and a production-style full-stack workflow.

> **Disclaimer:** the bundled dataset is a documented synthetic sample for development/demo
> purposes. Predictions are model outputs for educational use, not professional valuations.
