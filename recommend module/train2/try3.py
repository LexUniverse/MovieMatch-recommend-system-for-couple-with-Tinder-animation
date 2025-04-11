import pandas as pd
import numpy as np
import joblib
import re

# Загрузите обученную модель
model = joblib.load('nmf_model.pkl')

# Ваши собственные оценки для фильмов из ml-latest-small
# Пример: film_ids — список ID фильмов, ratings — ваши оценки
movies = pd.read_csv('movies.csv')
ratings_data = pd.read_csv('ratings.csv')
film_ids = [117895, 119145, 120466, 122882, 122900, 122902, 122906, 122912, 122916, 122918, 122920, 122924, 122922,
            130634, 131739, 133195, 135288, 136556, 136864, 135536, 113278, 111659, 146309, 3997, 88448, 58826, 110102,
            37731, 55805, 90345]
ratings = [5, 5, 5, 4, 5, 3, 5, 5, 4, 4, 5, 4, 5, 4, 3, 4, 3, 4, 4, 5, 4, 5, 5, 1, 1, 2, 5, 2, 1, 3]


# Извлеките год выпуска из названия фильма
def extract_year(title):
    match = re.search(r'\((\d{4})\)', title)
    if match:
        return int(match.group(1))
    else:
        return None


# Создайте словарь для сопоставления ID фильмов с их названиями, годами выпуска и жанрами
id_to_title = {movie_id: title for movie_id, title in zip(movies['movieId'], movies['title'])}
id_to_year = {movie_id: extract_year(title) for movie_id, title in zip(movies['movieId'], movies['title'])}
id_to_genres = {movie_id: genres for movie_id, genres in zip(movies['movieId'], movies['genres'])}

# Создайте словарь для сопоставления ID фильмов с индексами матрицы
id_to_index = {movie_id: i for i, movie_id in enumerate(movies['movieId'])}

# Создайте словарь для количества оценок каждого фильма
id_to_ratings_count = ratings_data['movieId'].value_counts().to_dict()

# Создайте таблицу жанров
genres_table = [
    ('no filter', -1),
    ('(no genres listed)', 0),
    ('Action', 1),
    ('Adventure', 2),
    ('Animation', 3),
    ('Children', 4),
    ('Comedy', 5),
    ('Crime', 6),
    ('Documentary', 7),
    ('Drama', 8),
    ('Fantasy', 9),
    ('Film-Noir', 10),
    ('Horror', 11),
    ('IMAX', 12),
    ('Musical', 13),
    ('Mystery', 14),
    ('Romance', 15),
    ('Sci-Fi', 16),
    ('Thriller', 17),
    ('War', 18),
    ('Western', 19)
]

# Выведите таблицу жанров
print("Таблица жанров:")
for i, (genre, index) in enumerate(genres_table):
    print(f"{i}: {genre}")

# Выберите жанры (через запятую)
selected_genres = input("Введите номера жанров (через запятую), или -1 для отсутствия фильтра: ")

# Преобразуйте ввод в список номеров жанров
if selected_genres == '-1':
    selected_genres = []
else:
    selected_genres = [int(x) for x in selected_genres.split(',')]

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

# Фильтруйте рекомендации по году выпуска и жанрам
start_year = 2010
end_year = 2020
filtered_recommendations = []
for film_index in recommended_films:
    film_id = movies['movieId'].iloc[film_index]
    if film_id in id_to_year and id_to_year[film_id] is not None and start_year <= id_to_year[film_id] <= end_year:
        if not selected_genres or -1 in selected_genres:
            if film_id not in film_ids:
                filtered_recommendations.append((film_id, id_to_title[film_id]))
        else:
            genres = id_to_genres[film_id].split('|')
            genre_names = [genre_table[0] for genre_table in genres_table if genre_table[1] in selected_genres]
            if any(genre in genres for genre in genre_names) and film_id not in film_ids:
                filtered_recommendations.append((film_id, id_to_title[film_id]))

# Сортируйте рекомендации по популярности (количеству оценок)
if filtered_recommendations:
    filtered_recommendations.sort(key=lambda x: id_to_ratings_count.get(x[0], 0), reverse=True)

# Выведите рекомендации
num_recommendations = 5
if len(filtered_recommendations) < num_recommendations:
    print(
        f"Найдено только {len(filtered_recommendations)} рекомендаций. Дополнительно выводим следующие фильмы того же жанра.")

    # Дополнительно выводим следующие фильмы того же жанра
    additional_films = []
    target_genre = None
    for genre_index in selected_genres:
        if genre_index > 0:
            target_genre = genres_table[genre_index][0]
            break

    if target_genre is None:
        target_genre = 'Drama'  # По умолчанию

    for film_index in recommended_films:
        film_id = movies['movieId'].iloc[film_index]
        if film_id in id_to_genres and target_genre in id_to_genres[film_id].split(
                '|') and film_id not in film_ids and film_id not in [f[0] for f in filtered_recommendations]:
            if film_id in id_to_year and id_to_year[film_id] is not None and start_year <= id_to_year[
                film_id] <= end_year:
                additional_films.append((film_id, id_to_title[film_id]))
                additional_films.sort(key=lambda x: id_to_ratings_count.get(x[0], 0), reverse=True)
            if len(additional_films) >= num_recommendations - len(filtered_recommendations):
                break

    for film_id, title in filtered_recommendations + additional_films[
                                                     :num_recommendations - len(filtered_recommendations)]:
        print(f"ID: {film_id}, Название: {title}")
else:
    for film_id, title in filtered_recommendations[:num_recommendations]:
        print(f"ID: {film_id}, Название: {title}")
