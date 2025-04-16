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
