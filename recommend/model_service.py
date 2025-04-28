import numpy as np
import pandas as pd
import json
from rectools.models import load_model
from rectools import Columns
import os

class RecommenderService:
    def __init__(self, model_path: str, movies_csv: str, mappings_dir: str):
        # Загрузка модели
        self.model = load_model(model_path)

        # Загрузка фильмов
        self.movies = pd.read_csv(movies_csv)

        # Загрузка маппингов
        self.idmap_ext2int = self.load_json(os.path.join(mappings_dir, "idmap_ext2int.json"))
        self.idmap_int2ext = self.load_json(os.path.join(mappings_dir, "idmap_int2ext.json"))
        self.movieid2title = self.load_json(os.path.join(mappings_dir, "movieid2title.json"))
        self.movieid2year = self.load_json(os.path.join(mappings_dir, "movieid2year.json"))
        self.item_embeddings = np.load(os.path.join(mappings_dir, "item_embeddings.npy"))

        # Создаём индексы для быстрого поиска
        self.id_to_index = {movie_id: i for i, movie_id in enumerate(self.movies['movieId'])}
        self.index_to_id = {i: movie_id for movie_id, i in self.id_to_index.items()}

    def load_json(self, filepath: str):
        with open(filepath, "r") as f:
            return json.load(f)

    def recommend(self, preferences: list[dict], min_year: int = 2010, top_k: int = 10) -> list[dict]:
        # Получаем количество фильмов
        n_films = self.item_embeddings.shape[1]
        user_matrix = np.zeros((1, n_films))

        # Заполняем вектор предпочтений пользователя
        for pref in preferences:
            film_id = pref.get("film_id")
            rating = pref.get("rating")
            index = self.id_to_index.get(film_id)

            if index is not None:
                user_matrix[0, index] = rating

        if not np.any(user_matrix):
            return []

        # Получаем скор для каждого фильма
        scores = self.item_embeddings.dot(user_matrix.T).flatten()

        # Сортируем фильмы по убыванию
        sorted_indices = np.argsort(-scores)

        recommendations = []
        for idx in sorted_indices:
            film_id = self.index_to_id[idx]
            if any(f["film_id"] == film_id for f in preferences):
                continue

            year = self.movieid2year.get(str(film_id))
            if year is not None and year >= min_year:
                recommendations.append({
                    "film_id": film_id,
                    "title_en": self.movieid2title.get(str(film_id)),
                    "title_ru": self.movies.loc[self.movies['movieId'] == film_id, 'russian_title'].values[0],  # Получаем русское название
                    "genres": self.movies.loc[self.movies['movieId'] == film_id, 'genres'].values[0],
                    "year": year,
                    "predicted_rating": round(scores[idx], 3)
                })
            if len(recommendations) >= top_k:
                break

        return recommendations

    def recommend_for_two_users(self, preferences1: list[dict], preferences2: list[dict], min_year: int = 2010, top_k: int = 20) -> list[dict]:
        n_films = self.item_embeddings.shape[1]
        user_matrix = np.zeros((2, n_films))

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

        # Получаем скоры
        scores = self.item_embeddings.dot(user_matrix.T)

        # Сортируем рекомендации
        recommendations = []
        rated_films = set([pref["film_id"] for pref in preferences1] + [pref["film_id"] for pref in preferences2])

        for user_idx, prefs in enumerate([preferences1, preferences2]):
            sorted_indices = np.argsort(-scores[user_idx])
            for idx in sorted_indices:
                film_id = self.index_to_id[idx]
                if film_id in rated_films:
                    continue
                year = self.movieid2year.get(str(film_id))
                if year is None or year < min_year:
                    continue
                rating = scores[user_idx, idx]
                recommendations.append({
                    "film_id": film_id,
                    "title_en": self.movieid2title.get(str(film_id)),
                    "title_ru": self.movies.loc[self.movies['movieId'] == film_id, 'russian_title'].values[0],
                    "genres": self.movies.loc[self.movies['movieId'] == film_id, 'genres'].values[0],
                    "year": year,
                    "predicted_rating": round(rating, 3)
                })

        recommendations = sorted(recommendations, key=lambda x: x["predicted_rating"], reverse=True)

        return recommendations[:top_k]
