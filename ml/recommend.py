from __future__ import annotations

import argparse
import json
from pathlib import Path

import joblib
import pandas as pd


ROOT = Path(__file__).resolve().parent
ARTIFACT_PATH = ROOT / "artifacts" / "hybrid_recommender.joblib"


def load_model():
    if not ARTIFACT_PATH.exists():
        raise FileNotFoundError(f"Missing trained model artifact: {ARTIFACT_PATH}")
    return joblib.load(ARTIFACT_PATH)


def recommend_related(model, product_id: str, top_n: int) -> list[dict]:
    frame = model.related_products(product_id, top_n=top_n)
    return frame.to_dict(orient="records")


def recommend_for_history(model, product_ids: list[str], top_n: int) -> list[dict]:
    history = pd.DataFrame(
        [{"product_id": product_id, "rating": max(1, len(product_ids) - index)} for index, product_id in enumerate(product_ids)]
    )
    frame = model.content_based.recommend_for_user(history, top_n=top_n)
    return frame.to_dict(orient="records")


def recommend_for_user(model, user_id: str, top_n: int) -> list[dict]:
    frame = model.recommend_for_user(user_id, top_n=top_n)
    return frame.to_dict(orient="records")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["related", "history", "user"], required=True)
    parser.add_argument("--product-id")
    parser.add_argument("--product-ids")
    parser.add_argument("--user-id")
    parser.add_argument("--top-n", type=int, default=6)
    args = parser.parse_args()

    model = load_model()

    if args.mode == "related":
        result = recommend_related(model, args.product_id, args.top_n)
    elif args.mode == "history":
        ids = [item for item in (args.product_ids or "").split(",") if item]
        result = recommend_for_history(model, ids, args.top_n)
    else:
        result = recommend_for_user(model, args.user_id, args.top_n)

    print(json.dumps(result))


if __name__ == "__main__":
    main()

