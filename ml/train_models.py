from __future__ import annotations

import json
from pathlib import Path

import joblib
import pandas as pd

from recommender import HybridRecommendationModel


ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
GENERATED_DIR = ROOT / "generated"
ARTIFACTS_DIR = ROOT / "artifacts"


def precision_at_k(model: HybridRecommendationModel, interactions_df: pd.DataFrame, k: int = 5) -> float:
    precision_scores = []
    purchases = interactions_df[interactions_df["action_type"] == "purchase"]

    for user_id in purchases["user_id"].unique():
        user_purchases = purchases[purchases["user_id"] == user_id]["product_id"].tolist()
        if not user_purchases:
            continue

        holdout = user_purchases[-1]
        train_interactions = interactions_df[
            ~(
                (interactions_df["user_id"] == user_id)
                & (interactions_df["product_id"] == holdout)
            )
        ]
        candidate = HybridRecommendationModel(alpha=model.alpha).fit(model.products_df, train_interactions)
        recommendations = candidate.recommend_for_user(user_id, top_n=k)["product_id"].tolist()
        precision_scores.append(1.0 / k if holdout in recommendations else 0.0)

    if not precision_scores:
        return 0.0
    return round(sum(precision_scores) / len(precision_scores), 4)


def train() -> None:
    products_path = GENERATED_DIR / "products.csv"
    interactions_path = GENERATED_DIR / "interactions.csv"
    source = "live-generated"

    if not products_path.exists() or not interactions_path.exists():
        products_path = DATA_DIR / "products.csv"
        interactions_path = DATA_DIR / "interactions.csv"
        source = "seed-data"

    products_df = pd.read_csv(products_path)
    interactions_df = pd.read_csv(interactions_path)

    if products_df.empty or interactions_df.empty:
        products_df = pd.read_csv(DATA_DIR / "products.csv")
        interactions_df = pd.read_csv(DATA_DIR / "interactions.csv")
        source = "seed-data"

    model = HybridRecommendationModel(alpha=0.7).fit(products_df, interactions_df)
    ARTIFACTS_DIR.mkdir(exist_ok=True)

    joblib.dump(model, ARTIFACTS_DIR / "hybrid_recommender.joblib")

    sample_user = "U101"
    sample_product = "P003"
    metrics = {
        "products": int(len(products_df)),
        "interactions": int(len(interactions_df)),
        "users": int(interactions_df["user_id"].nunique()),
        "source": source,
        "precision_at_5": precision_at_k(model, interactions_df, k=5),
        "sample_user": sample_user,
        "sample_user_recommendations": model.recommend_for_user(sample_user, top_n=5).to_dict(orient="records"),
        "sample_related_products": model.related_products(sample_product, top_n=5).to_dict(orient="records"),
    }

    with open(ARTIFACTS_DIR / "metrics.json", "w", encoding="utf-8") as file:
        json.dump(metrics, file, indent=2)

    print("Collaborative Filtering model trained")
    print("Content-Based Filtering model trained")
    print("Hybrid Recommendation model trained")
    print(f"Artifacts saved to: {ARTIFACTS_DIR}")
    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    train()
