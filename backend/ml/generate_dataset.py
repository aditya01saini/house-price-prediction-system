"""Sample dataset generator for the House Price Prediction System.

IMPORTANT
---------
No public house-price dataset was available in this project environment, so a
realistic SAMPLE dataset is generated for development/demo purposes only. Every
assumption made by the generator is documented below and mirrored in the
README so the synthetic nature of the data is fully transparent.

Schema produced (backend/data/house_prices.csv)
-----------------------------------------------
| column       | type     | description                                   |
|--------------|----------|-----------------------------------------------|
| area         | float    | Built-up area in square feet (400 – 8000)     |
| bedrooms     | int      | Number of bedrooms (1 – 6)                    |
| bathrooms    | int      | Number of bathrooms (1 – 5)                   |
| floors       | int      | Floors / level of the property (1 – 3)        |
| parking      | int      | Covered parking spots (0 – 3)                 |
| property_age | int      | Age of the property in years (0 – 45)         |
| location     | category | Indian metro/city (7 classes)                 |
| property_type| category | Apartment / Independent House / Villa         |
| price        | float    | TARGET — market price in INR                  |

The price is generated from a *known deterministic relationship* (city rate per
sq ft × type premium × age depreciation + amenity contributions + log-normal
noise), so the ML models have a genuine signal to learn. A small amount of
realistic data-quality noise (missing values, duplicates, invalid entries) is
injected on purpose so the cleaning stage of the pipeline has real work to do.

Run from the ``backend`` directory:

    python -m ml.generate_dataset
"""
from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import pandas as pd

# --------------------------------------------------------------------------- #
# Configuration — realistic Indian metro market assumptions (INR, 2024-ish)    #
# --------------------------------------------------------------------------- #
CITY_RATE_PER_SQFT = {
    "Mumbai": 18500,
    "Delhi": 14200,
    "Bangalore": 11800,
    "Chennai": 10600,
    "Hyderabad": 9900,
    "Pune": 10300,
    "Kolkata": 8300,
}

TYPE_PREMIUM = {
    "Apartment": 1.00,
    "Independent House": 1.12,
    "Villa": 1.38,
}

TYPE_AREA = {
    #              mean   std   min   max
    "Apartment": (1250, 350, 500, 3500),
    "Independent House": (1800, 520, 800, 5000),
    "Villa": (2800, 700, 1500, 8000),
}

RANDOM_SEED = 42
N_ROWS = 5000


def _generate_clean_frame(rng: np.random.Generator) -> pd.DataFrame:
    n = len(rng.choice(list(CITY_RATE_PER_SQFT), size=N_ROWS))
    locations = rng.choice(list(CITY_RATE_PER_SQFT), size=n, p=[0.24, 0.18, 0.18, 0.10, 0.10, 0.12, 0.08])
    property_types = rng.choice(list(TYPE_PREMIUM), size=n, p=[0.55, 0.30, 0.15])

    areas = np.empty(n)
    for ptype, (mean, std, lo, hi) in TYPE_AREA.items():
        mask = property_types == ptype
        areas[mask] = rng.normal(mean, std, size=mask.sum())
    areas = np.clip(areas, 500, 8000).round(0)

    # Rooms scale with area (~550 sq ft per bedroom, plus living space).
    bedrooms = np.clip(np.round((areas - 150) / 550), 1, 6).astype(int)
    bathrooms = np.clip(bedrooms + rng.integers(-1, 1, size=n), 1, 5)
    floors = np.clip(rng.integers(1, 4, size=n) * (property_types != "Apartment").astype(int) +
                     rng.integers(1, 3, size=n) * (property_types == "Apartment").astype(int), 1, 3)
    parking = np.clip(rng.binomial(2, 0.45, size=n) + (property_types == "Villa").astype(int), 0, 3)
    property_age = rng.integers(0, 46, size=n)

    rate = np.array([CITY_RATE_PER_SQFT[c] for c in locations], dtype=float)
    premium = np.array([TYPE_PREMIUM[t] for t in property_types], dtype=float)
    age_factor = np.clip(1 - 0.008 * property_age, 0.62, None)
    new_build_bonus = np.where(property_age <= 2, 1.03, 1.0)
    noise = rng.lognormal(mean=0.0, sigma=0.09, size=n)  # ~±9 % market noise

    price = (areas * rate * premium * age_factor * new_build_bonus
             + bedrooms * 120_000
             + bathrooms * 90_000
             + floors * 110_000
             + parking * 180_000) * noise
    price = np.round(price / 10_000) * 10_000  # market prices round to ₹10k

    return pd.DataFrame({
        "area": areas,
        "bedrooms": bedrooms,
        "bathrooms": bathrooms,
        "floors": floors,
        "parking": parking,
        "property_age": property_age,
        "location": locations,
        "property_type": property_types,
        "price": price,
    })


def _inject_quality_issues(df: pd.DataFrame, rng: np.random.Generator) -> pd.DataFrame:
    """Deliberately add realistic data-quality problems for the cleaning stage."""
    df = df.copy()
    n = len(df)

    # ~2 % missing values in amenity/age columns (very common in real listings).
    for col, frac in (("parking", 0.02), ("property_age", 0.02), ("bathrooms", 0.01)):
        idx = rng.choice(n, size=int(n * frac), replace=False)
        df.loc[idx, col] = np.nan

    # ~0.5 % missing categorical values (empty listing field).
    idx = rng.choice(n, size=int(n * 0.005), replace=False)
    df.loc[idx, "location"] = np.nan

    # A handful of invalid numeric entries (fat-fingered listings).
    idx = rng.choice(n, size=8, replace=False)
    df.loc[idx, "area"] = -df.loc[idx, "area"]
    idx = rng.choice(n, size=5, replace=False)
    df.loc[idx, "property_age"] = rng.integers(150, 300, size=5)  # impossible ages
    idx = rng.choice(n, size=4, replace=False)
    df.loc[idx, "price"] = 0  # listings published without a price

    # ~0.6 % exact duplicate rows (re-scraped listings).
    dup_idx = rng.choice(n, size=30, replace=False)
    df = pd.concat([df, df.loc[dup_idx]], ignore_index=True)

    return df.sample(frac=1.0, random_state=RANDOM_SEED).reset_index(drop=True)


def generate(output_path: Path, n_rows: int = N_ROWS) -> pd.DataFrame:
    rng = np.random.default_rng(RANDOM_SEED)
    df = _generate_clean_frame(rng)
    if n_rows != N_ROWS:
        df = df.sample(n=n_rows, random_state=RANDOM_SEED, replace=n_rows > N_ROWS).reset_index(drop=True)
    df = _inject_quality_issues(df, rng)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_path, index=False)
    return df


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate the sample house-price dataset.")
    parser.add_argument("--output", type=Path, default=Path(__file__).resolve().parents[1] / "data" / "house_prices.csv")
    parser.add_argument("--rows", type=int, default=N_ROWS)
    args = parser.parse_args()

    frame = generate(args.output, args.rows)
    print(f"Sample dataset written to {args.output}")
    print(f"Shape: {frame.shape} (data-quality issues intentionally included)")
    print(frame.head())
