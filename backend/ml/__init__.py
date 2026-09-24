"""Machine Learning layer of HousePredict AI.

Modules
-------
generate_dataset : creates the documented sample dataset (only if no real dataset exists)
preprocessing    : feature engineering + scikit-learn ColumnTransformer/Pipeline factory
evaluate         : regression metric computation (MAE, MSE, RMSE, R²)
train            : end-to-end training orchestrator (clean → EDA → split → train → select → save)

Run training from the ``backend`` directory:

    python -m ml.train
"""
