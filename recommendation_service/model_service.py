import numpy as np
import pandas as pd
import joblib
import re

class RecommenderService:
    def __init__(self, model_path: str, movies_csv: str):
        self.model = joblib.load(model_path)
        self.movies = pd.read_csv(movies_csv)

        self.id_to_title = {row.movieId: row.title for row in self.movies.itertuples()}
        self.id_to_year = {row.movieId: self.extract_year(row.title) for row in self.movies.itertuples()}
        self.id_to_index = {movie_id: i for i, movie_id in enumerate(self.movies['movieId'])}
        self.index_to_id = {i: movie_id for movie_id, i in self.id_to_index.items()}

    def extract_year(self, title: str):
        match = re.search(r'\((\d{4})\)', title)
        return int(match.group(1)) if match else None

    def recommend(self, preferences: list[dict], min_year: int = 2010, top_k: int = 10) -> list[dict]:
        n_films = self.model.components_.shape[1]
        user_matrix = np.zeros((1, n_films))

        for pref in preferences:
            film_id = pref.get("film_id")
            rating = pref.get("rating")
            index = self.id_to_index.get(film_id)

            if index is not None:
                user_matrix[0, index] = rating

        if not np.any(user_matrix):
            return []

        user_features = self.model.transform(user_matrix)
        predicted_ratings = np.dot(user_features, self.model.components_)[0]
        sorted_indices = np.argsort(-predicted_ratings)

        recommendations = []
        for idx in sorted_indices:
            film_id = self.index_to_id[idx]
            if any(f["film_id"] == film_id for f in preferences):
                continue

            year = self.id_to_year.get(film_id)
            if year is not None and year >= min_year:
                recommendations.append({
                    "film_id": film_id,
                    "title": self.id_to_title.get(film_id),
                    "year": year,
                    "predicted_rating": round(predicted_ratings[idx], 3)
                })
            if len(recommendations) >= top_k:
                break

        return recommendations

    def recommend_for_two_users(self, preferences1: list[dict], preferences2: list[dict], min_year: int = 2010, top_k: int = 20) -> list[dict]:
        n_films = self.model.components_.shape[1]
        user_matrix = np.zeros((2, n_films))

        # Заполняем матрицы рейтингов для обоих пользователей
        for pref in preferences1:
            film_id = pref.get("film_id")
            rating = pref.get("rating")
            index = self.id_to_index.get(film_id)
            if index is not None:
                user_matrix[0, index] = rating

        for pref in preferences2:
            film_id = pref.get("film_id")
            rating = pref.get("rating")
            index = self.id_to_index.get(film_id)
            if index is not None:
                user_matrix[1, index] = rating

        if not np.any(user_matrix):
            return []

        user_features = self.model.transform(user_matrix)
        predicted_ratings = np.dot(user_features, self.model.components_)

        rated_films = set([pref["film_id"] for pref in preferences1] + [pref["film_id"] for pref in preferences2])

        # Собираем рекомендации с учётом минимального рейтинга
        all_recs = {}

        for user_idx, prefs in enumerate([preferences1, preferences2]):
            sorted_indices = np.argsort(-predicted_ratings[user_idx])
            for idx in sorted_indices:
                film_id = self.index_to_id[idx]
                if film_id in rated_films:
                    continue
                year = self.id_to_year.get(film_id)
                if year is None or year < min_year:
                    continue
                rating = predicted_ratings[user_idx, idx]
                if film_id not in all_recs:
                    all_recs[film_id] = {
                        "title": self.id_to_title.get(film_id),
                        "ratings": [0.0, 0.0]
                    }
                all_recs[film_id]["ratings"][user_idx] = rating

        # Формируем итоговый список с суммой, средним и минимальным рейтингом
        final_list = []
        for film_id, info in all_recs.items():
            r1, r2 = info["ratings"]
            # Пропускаем фильмы, которые не предсказаны хотя бы одному пользователю
            if r1 == 0.0 or r2 == 0.0:
                continue
            sum_rating = r1 + r2
            avg_rating = sum_rating / 2
            min_rating = min(r1, r2)
            final_list.append({
                "film_id": film_id,
                "title": info["title"],
                "sum_rating": round(sum_rating, 4),
                "avg_rating": round(avg_rating, 4),
                "min_rating": round(min_rating, 4),
                "rating_user1": round(r1, 4),
                "rating_user2": round(r2, 4)
            })

        # Сортируем по минимальному рейтингу (по убыванию)
        final_list = sorted(final_list, key=lambda x: x["min_rating"], reverse=True)

        # Ограничиваем топ-K
        return final_list[:top_k]
