import numpy as np
import pandas as pd
import json
from rectools.models import load_model
import os

class RecommenderService:
    def __init__(self, model_path: str, movies_csv: str, mappings_dir: str):
        # Загружаем модель и эмбеддинги
        wrapper = load_model(model_path)
        self.item_embeddings = wrapper.model.item_embeddings

        # Загружаем маппинги (ключи и значения — ints)
        with open(os.path.join(mappings_dir, "idmap_ext2int.json"), "r") as f:
            self.idmap_ext2int = {int(k): int(v) for k, v in json.load(f).items()}
        with open(os.path.join(mappings_dir, "idmap_int2ext.json"), "r") as f:
            self.idmap_int2ext = {int(k): int(v) for k, v in json.load(f).items()}
        with open(os.path.join(mappings_dir, "movieid2title.json"), "r") as f:
            self.movieid2title = {int(k): v for k, v in json.load(f).items()}
        with open(os.path.join(mappings_dir, "movieid2year.json"), "r") as f:
            self.movieid2year = {int(k): int(v) for k, v in json.load(f).items()}

        # Загружаем DataFrame фильмов для названий и жанров
        self.movies = pd.read_csv(movies_csv)
        # Убедимся, что movieId в DataFrame — int
        self.movies['movieId'] = self.movies['movieId'].astype(int)

    def recommend(self, preferences: list[dict], min_year: int = 2010, top_k: int = 10) -> list[dict]:
        # Вектор пользователя той же размерности, что эмбеддинги
        emb_dim = self.item_embeddings.shape[1]
        user_vec = np.zeros(emb_dim)

        # Собираем профиль пользователя
        for pref in preferences:
            m_id = pref.get('film_id')
            rating = pref.get('rating', 0)
            internal = self.idmap_ext2int.get(m_id)
            if internal is None:
                print(f"[Warning] movieId {m_id} не найден в маппинге, пропускаем.")
                continue
            user_vec += self.item_embeddings[internal] * rating

        # Если профиль пустой, возвращаем пусто
        if not np.any(user_vec):
            return []
        # Нормализация
        norm = np.linalg.norm(user_vec)
        if norm > 0:
            user_vec /= norm

        # Считаем скоринг
        scores = self.item_embeddings.dot(user_vec)
        # Берём топ 100 кандидатов для фильтрации
        top_n = min(100, scores.shape[0] - 1)
        candidate_idxs = np.argpartition(-scores, top_n)[:top_n]

        # Сортируем по убыванию
        sorted_cand = sorted(candidate_idxs, key=lambda i: -scores[i])

        recs = []
        seen = {pref['film_id'] for pref in preferences}
        for idx in sorted_cand:
            ext_id = self.idmap_int2ext.get(idx)
            if ext_id is None or ext_id in seen:
                continue
            year = self.movieid2year.get(ext_id, 0)
            if year < min_year:
                continue
            # Достаем данные из DataFrame
            row = self.movies[self.movies['movieId'] == ext_id]
            if row.empty:
                continue
            row = row.iloc[0]
            recs.append({
                'film_id': ext_id,
                'title_en': self.movieid2title.get(ext_id),
                'title_ru': row['russian_title'],
                'genres': row['genres'],
                'year': year,
                'predicted_rating': round(float(scores[idx]), 3)
            })
            if len(recs) >= top_k:
                break
        return recs

    def recommend_for_two_users(self, preferences1: list[dict], preferences2: list[dict], min_year: int = 2010, top_k: int = 20) -> list[dict]:
        emb_dim = self.item_embeddings.shape[1]
        u1 = np.zeros(emb_dim)
        u2 = np.zeros(emb_dim)
        for pref in preferences1:
            internal = self.idmap_ext2int.get(pref.get('film_id'))
            if internal is not None:
                u1 += self.item_embeddings[internal] * pref.get('rating', 0)
        for pref in preferences2:
            internal = self.idmap_ext2int.get(pref.get('film_id'))
            if internal is not None:
                u2 += self.item_embeddings[internal] * pref.get('rating', 0)
        # Если один из векторов пуст
        if not np.any(u1) or not np.any(u2):
            return []
        u1 /= np.linalg.norm(u1)
        u2 /= np.linalg.norm(u2)
        s1 = self.item_embeddings.dot(u1)
        s2 = self.item_embeddings.dot(u2)
        combined = (s1 + s2) / 2
        sorted_idx = np.argsort(-combined)
        recs = []
        seen = {p['film_id'] for p in preferences1 + preferences2}
        for idx in sorted_idx:
            ext_id = self.idmap_int2ext.get(idx)
            if ext_id is None or ext_id in seen:
                continue
            year = self.movieid2year.get(ext_id, 0)
            if year < min_year:
                continue
            row = self.movies[self.movies['movieId'] == ext_id]
            if row.empty:
                continue
            row = row.iloc[0]
            recs.append({
                'film_id': ext_id,
                'title_en': self.movieid2title.get(ext_id),
                'title_ru': row['russian_title'],
                'genres': row['genres'],
                'year': year,
                'predicted_rating': round(float(combined[idx]), 3)
            })
            if len(recs) >= top_k:
                break
        return recs