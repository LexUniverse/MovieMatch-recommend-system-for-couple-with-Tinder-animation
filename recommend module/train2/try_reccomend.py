import pandas as pd
import numpy as np
import joblib
import re

# Загрузите обученную модель
model = joblib.load('nmf_model.pkl')

# Ваши собственные оценки для фильмов из ml-latest-small
# Пример: film_ids — список ID фильмов, ratings — ваши оценки
movies = pd.read_csv('movies.csv')
film_ids = [ 119145, 120466, 122882, 122900, 122902, 122906, 122912, 122916, 122918, 122920, 122924, 122922, 130634, 131739, 133195, 135288, 136556, 136864, 135536, 113278, 111659, 146309, 3997, 88448, 58826, 110102, 37731, 55805, 90345]
ratings = [ 5, 5, 4, 5, 3, 5, 5, 4, 4, 5, 4, 5, 4, 3, 4, 3, 4, 4, 5, 4, 5, 5, 1, 1, 2, 5, 2, 1, 3]

# Извлеките год выпуска из названия фильма
def extract_year(title):
    match = re.search(r'\((\d{4})\)', title)
    if match:
        return int(match.group(1))
    else:
        return None

# Создайте словарь для сопоставления ID фильмов с их названиями и годами выпуска
id_to_title = {movie_id: title for movie_id, title in zip(movies['movieId'], movies['title'])}
id_to_year = {movie_id: extract_year(title) for movie_id, title in zip(movies['movieId'], movies['title'])}

# Создайте словарь для сопоставления ID фильмов с индексами матрицы
id_to_index = {movie_id: i for i, movie_id in enumerate(movies['movieId'])}

# Создайте матрицу с вашими оценками
n_films = model.components_.shape[1]  # Общее количество фильмов в модели
user_matrix = np.zeros((1, n_films))  # Матрица для одного пользователя

# Присвойте оценки в матрицу
for i, film_id in enumerate(film_ids):
    if film_id in id_to_index:
        user_matrix[0, id_to_index[film_id]] = ratings[i]  # Присвойте оценки в матрицу
    else:
        print(f"Фильм с ID {film_id} не найден в датасете.")

# Получите эмбеддинги для себя как пользователя
user_features = model.transform(user_matrix)

# Предсказайте рейтинги для всех фильмов
predicted_ratings = np.dot(user_features, model.components_)

# Рекомендации — фильмы с высокими предсказанными рейтингами
recommended_films = np.argsort(-predicted_ratings[0])[:100]  # Топ-100 рекомендаций

# Фильтруйте рекомендации по году выпуска и исключите уже оцениванные фильмы
filtered_recommendations = []
for film_index in recommended_films:
    film_id = movies['movieId'].iloc[film_index]
    if film_id in id_to_year and id_to_year[film_id] is not None and id_to_year[film_id] >= 2010 and film_id not in film_ids:
        filtered_recommendations.append((film_id, id_to_title[film_id]))

# Выведите рекомендации
for film_id, title in filtered_recommendations[:10]:  # Топ-10 рекомендаций
    print(f"ID: {film_id}, Название: {title}")
