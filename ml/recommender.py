from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List

import numpy as np
import pandas as pd
from scipy.sparse import csr_matrix
from sklearn.decomposition import TruncatedSVD
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def _normalize_scores(scores: np.ndarray) -> np.ndarray:
    if scores.size == 0:
        return scores
    min_score = float(scores.min())
    max_score = float(scores.max())
    if max_score == min_score:
        return np.ones_like(scores) * 0.5
    return (scores - min_score) / (max_score - min_score)


@dataclass
class CollaborativeFilteringModel:
    n_components: int = 8

    def fit(self, interactions_df: pd.DataFrame) -> "CollaborativeFilteringModel":
        grouped = (
            interactions_df.groupby(["user_id", "product_id"], as_index=False)["rating"]
            .max()
        )
        user_item = grouped.pivot(index="user_id", columns="product_id", values="rating").fillna(0.0)
        self.user_ids = user_item.index.tolist()
        self.product_ids = user_item.columns.tolist()
        self.user_item_matrix = user_item
        self.popularity = grouped.groupby("product_id")["rating"].sum().sort_values(ascending=False)

        if len(self.user_ids) < 2 or len(self.product_ids) < 2:
            self.user_factors = None
            self.item_factors = None
            return self

        components = max(1, min(self.n_components, min(user_item.shape) - 1))
        self.svd = TruncatedSVD(n_components=components, random_state=42)
        sparse_matrix = csr_matrix(user_item.values)
        self.user_factors = self.svd.fit_transform(sparse_matrix)
        self.item_factors = self.svd.components_.T
        return self

    def recommend_for_user(self, user_id: str, top_n: int = 6) -> pd.DataFrame:
        if user_id not in getattr(self, "user_ids", []):
            return self._popular(top_n)

        seen = set(
            self.user_item_matrix.loc[user_id][self.user_item_matrix.loc[user_id] > 0].index.tolist()
        )
        if self.user_factors is None or self.item_factors is None:
            return self._popular(top_n, exclude=seen)

        user_index = self.user_ids.index(user_id)
        scores = self.user_factors[user_index] @ self.item_factors.T
        frame = pd.DataFrame({"product_id": self.product_ids, "score": _normalize_scores(scores)})
        frame = frame[~frame["product_id"].isin(seen)].sort_values("score", ascending=False)
        return frame.head(top_n).reset_index(drop=True)

    def _popular(self, top_n: int, exclude: set[str] | None = None) -> pd.DataFrame:
        exclude = exclude or set()
        items = [
            {"product_id": product_id, "score": float(score)}
            for product_id, score in self.popularity.items()
            if product_id not in exclude
        ]
        return pd.DataFrame(items[:top_n])


@dataclass
class ContentBasedFilteringModel:
    max_features: int = 500

    def fit(self, products_df: pd.DataFrame) -> "ContentBasedFilteringModel":
        self.products_df = products_df.copy()
        self.products_df["combined_text"] = (
            self.products_df["name"].fillna("")
            + " "
            + self.products_df["category"].fillna("")
            + " "
            + self.products_df["artisan"].fillna("")
            + " "
            + self.products_df["region"].fillna("")
            + " "
            + self.products_df["material"].fillna("")
            + " "
            + self.products_df["tags"].fillna("")
            + " "
            + self.products_df["description"].fillna("")
        )
        self.product_ids = self.products_df["product_id"].tolist()
        self.vectorizer = TfidfVectorizer(stop_words="english", max_features=self.max_features)
        self.tfidf_matrix = self.vectorizer.fit_transform(self.products_df["combined_text"])
        self.similarity_matrix = cosine_similarity(self.tfidf_matrix)
        return self

    def recommend_similar_items(self, product_id: str, top_n: int = 6) -> pd.DataFrame:
        if product_id not in self.product_ids:
            return pd.DataFrame(columns=["product_id", "score"])

        index = self.product_ids.index(product_id)
        scores = self.similarity_matrix[index]
        pairs = [
            {"product_id": pid, "score": float(score)}
            for pid, score in zip(self.product_ids, scores)
            if pid != product_id
        ]
        frame = pd.DataFrame(pairs).sort_values("score", ascending=False)
        return frame.head(top_n).reset_index(drop=True)

    def recommend_for_user(self, history: pd.DataFrame, top_n: int = 6) -> pd.DataFrame:
        if history.empty:
            return pd.DataFrame(columns=["product_id", "score"])

        seen = set(history["product_id"].tolist())
        aggregate_scores: Dict[str, float] = {}

        for _, row in history.iterrows():
            weight = float(row.get("rating", 1))
            similar = self.recommend_similar_items(row["product_id"], top_n=len(self.product_ids))
            for _, recommendation in similar.iterrows():
                product_id = recommendation["product_id"]
                if product_id in seen:
                    continue
                aggregate_scores[product_id] = aggregate_scores.get(product_id, 0.0) + weight * float(
                    recommendation["score"]
                )

        frame = pd.DataFrame(
            [{"product_id": product_id, "score": score} for product_id, score in aggregate_scores.items()]
        )
        if frame.empty:
            return frame
        frame["score"] = _normalize_scores(frame["score"].to_numpy())
        return frame.sort_values("score", ascending=False).head(top_n).reset_index(drop=True)


@dataclass
class HybridRecommendationModel:
    alpha: float = 0.7

    def fit(self, products_df: pd.DataFrame, interactions_df: pd.DataFrame) -> "HybridRecommendationModel":
        self.products_df = products_df.copy()
        self.interactions_df = interactions_df.copy()
        self.collaborative = CollaborativeFilteringModel().fit(interactions_df)
        self.content_based = ContentBasedFilteringModel().fit(products_df)
        self.popularity = (
            interactions_df.groupby("product_id")["rating"].sum().sort_values(ascending=False).to_dict()
        )
        return self

    def recommend_for_user(self, user_id: str, top_n: int = 6) -> pd.DataFrame:
        user_history = self.interactions_df[self.interactions_df["user_id"] == user_id][["product_id", "rating"]]
        collaborative = self.collaborative.recommend_for_user(user_id, top_n=len(self.products_df))
        content_based = self.content_based.recommend_for_user(user_history, top_n=len(self.products_df))

        merged = pd.DataFrame({"product_id": self.products_df["product_id"]})
        merged = merged.merge(collaborative, on="product_id", how="left").rename(
            columns={"score": "collaborative_score"}
        )
        merged = merged.merge(content_based, on="product_id", how="left").rename(
            columns={"score": "content_score"}
        )
        merged["collaborative_score"] = merged["collaborative_score"].fillna(0.0)
        merged["content_score"] = merged["content_score"].fillna(0.0)
        merged["popularity_score"] = merged["product_id"].map(self.popularity).fillna(0.0)
        merged["popularity_score"] = _normalize_scores(merged["popularity_score"].to_numpy())

        seen = set(user_history["product_id"].tolist())
        merged = merged[~merged["product_id"].isin(seen)].copy()
        merged["score"] = (
            self.alpha * merged["collaborative_score"]
            + (1 - self.alpha) * merged["content_score"]
            + 0.1 * merged["popularity_score"]
        )
        return merged.sort_values("score", ascending=False).head(top_n).reset_index(drop=True)

    def related_products(self, product_id: str, top_n: int = 6) -> pd.DataFrame:
        return self.content_based.recommend_similar_items(product_id, top_n=top_n)

