/**
 * ML pipeline stages — used by the Dashboard strip and the full About-page
 * timeline. Explanations match the actual implementation in backend/ml/.
 */

export const PIPELINE_STAGES = [
  {
    title: 'Dataset',
    description: '5,000+ property records with 8 attributes and an INR price target; realistic data-quality issues included on purpose.',
    icon: 'M4 7c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3Zm0 0v10c0 1.7 3.6 3 8 3s8-1.3 8-3V7',
  },
  {
    title: 'Data Cleaning',
    description: 'Duplicate rows removed, invalid prices/areas dropped, impossible ages treated as missing — a cleaning log records every fix.',
    icon: 'M5 7h14M5 12h9m5 0-2-2m2 2-2 2M5 17h6',
  },
  {
    title: 'EDA',
    description: 'Price distribution, city-level averages, area-vs-price trends and a feature correlation heatmap, exported as charts.',
    icon: 'M4 19h16M7 16v-5m5 5V7m5 9v-3',
  },
  {
    title: 'Feature Engineering',
    description: 'total_rooms, area_per_room and age_group derived at training AND prediction time. price_per_sqft is deliberately excluded (target leakage).',
    icon: 'M12 3v6m0 0 3-3m-3 3-3-3m3 9v6m0 0 3-3m-3 3-3-3M4 12h16',
  },
  {
    title: 'Encoding & Scaling',
    description: 'One-hot encoding for location/type/age-group with median imputation and standard scaling — wrapped in a ColumnTransformer.',
    icon: 'M8 9l-4 3 4 3m8-6 4 3-4 3M13 5l-2 14',
  },
  {
    title: 'Train / Test Split',
    description: '80/20 split with a fixed random seed so every metric is reproducible on the same held-out test set.',
    icon: 'M8 3H5a2 2 0 0 0-2 2v3m13-5h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3m13 5h3a2 2 0 0 0 2-2v-3M9 12h6',
  },
  {
    title: 'Model Training',
    description: 'Three regression candidates trained inside full scikit-learn Pipelines: Linear Regression, Decision Tree and Random Forest.',
    icon: 'M12 2a4 4 0 0 1 4 4c0 1.9-1.3 3.4-3 3.9V12h4a2 2 0 0 1 2 2v1.1c1.7.5 3 2 3 3.9a4 4 0 0 1-8 0c0-1.9 1.3-3.4 3-3.9V14H7v2.1c1.7.5 3 2 3 3.9a4 4 0 0 1-8 0c0-1.9 1.3-3.4 3-3.9V14a2 2 0 0 1 2-2h4v-2.1C9.3 9.4 8 7.9 8 6a4 4 0 0 1 4-4Z',
  },
  {
    title: 'Model Evaluation',
    description: 'Every candidate scored on the same test set with MAE, MSE, RMSE and R² — computed, never assumed.',
    icon: 'M9 12.5l2 2 4-4.5M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6Z',
  },
  {
    title: 'Model Selection',
    description: 'Random Forest won on test R² (≈0.95) and lowest errors; the winning pipeline is serialised with Joblib.',
    icon: 'M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12Zm0 0v6m-3 3h6M12 7v3l2 2',
  },
  {
    title: 'Price Prediction',
    description: 'FastAPI loads the saved pipeline once and serves /api/predict — identical preprocessing at training and inference time.',
    icon: 'M3 11l9-8 9 8M5 9.5V21h14V9.5M9 21v-6h6v6',
  },
];

export const DASHBOARD_STAGES = PIPELINE_STAGES.slice(0, 5);
