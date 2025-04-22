import pandas as pd
import numpy as np
import joblib
import re

# Загрузка модели и данных
model = joblib.load('nmf_model.pkl')
movies = pd.read_csv('movies.csv')

film_ids_1 = [119145, 120466, 122882, 122900, 122902, 122906, 122912, 122916, 122918, 122920, 122924, 122922, 130634, 131739, 133195, 135288, 136556, 136864, 135536, 113278, 111659, 146309, 3997, 88448]
ratings_1 = [5, 5, 4, 5, 3, 5, 5, 4, 4, 5, 4, 5, 4, 3, 4, 3, 4, 4, 5, 4, 5, 5, 1, 1]

film_ids_2 = [119145, 120466, 122882, 122900, 58826, 110102, 37731, 55805, 90345]
ratings_2 = [5, 5, 4, 5, 2, 5, 2, 1, 3]

def extract_year(title):
    match = re.search(r'\((\d{4})\)', title)
    return int(match.group(1)) if match else None

id_to_title = {movie_id: title for movie_id, title in zip(movies['movieId'], movies['title'])}
id_to_year = {movie_id: extract_year(title) for movie_id, title in zip(movies['movieId'], movies['title'])}
id_to_index = {movie_id: i for i, movie_id in enumerate(movies['movieId'])}

n_films = model.components_.shape[1]

user_matrix = np.zeros((2, n_films))

for i, film_id in enumerate(film_ids_1):
    if film_id in id_to_index:
        user_matrix[0, id_to_index[film_id]] = ratings_1[i]

for i, film_id in enumerate(film_ids_2):
    if film_id in id_to_index:
        user_matrix[1, id_to_index[film_id]] = ratings_2[i]

user_features = model.transform(user_matrix)
predicted_ratings = np.dot(user_features, model.components_)

rated_films = set(film_ids_1) | set(film_ids_2)

def get_recommendations_for_user(user_idx, film_ids_user, top_n=100):
    recommended_films = np.argsort(-predicted_ratings[user_idx])[:top_n]
    recs = []
    for film_index in recommended_films:
        film_id = movies['movieId'].iloc[film_index]
        if (film_id in id_to_year and id_to_year[film_id] is not None and
            id_to_year[film_id] >= 2010 and film_id not in film_ids_user):
            recs.append((film_id, id_to_title[film_id], predicted_ratings[user_idx, film_index]))
    return recs

# Получаем рекомендации для каждого пользователя
recs_user1 = get_recommendations_for_user(0, film_ids_1)
recs_user2 = get_recommendations_for_user(1, film_ids_2)

# Создаем объединённый профиль — сумма оценок
combined_ratings = user_matrix.sum(axis=0)
combined_user_matrix = combined_ratings.reshape(1, -1)
combined_user_features = model.transform(combined_user_matrix)
combined_predicted_ratings = np.dot(combined_user_features, model.components_)[0]

# Рекомендации для объединённого пользователя
combined_recommended_films = np.argsort(-combined_predicted_ratings)[:200]
combined_recs = []
for film_index in combined_recommended_films:
    film_id = movies['movieId'].iloc[film_index]
    if (film_id in id_to_year and id_to_year[film_id] is not None and
        id_to_year[film_id] >= 2005 and film_id not in rated_films):
        combined_recs.append((film_id, id_to_title[film_id], combined_predicted_ratings[film_index]))

# --- Объединяем три списка рекомендаций в один словарь ---

# Добавляем рекомендации для объединённого профиля в общий список
all_recs = {}

# Функция для добавления рекомендаций в общий список
def add_recs_to_dict(recs, user_key):
    for film_id, title, rating in recs:
        if film_id not in all_recs:
            all_recs[film_id] = {'title': title, 'ratings': {'user1': 0.0, 'user2': 0.0, 'combined': 0.0}}
        all_recs[film_id]['ratings'][user_key] = rating

# Добавляем рекомендации для каждого пользователя и объединённого профиля
add_recs_to_dict(recs_user1, 'user1')
add_recs_to_dict(recs_user2, 'user2')
add_recs_to_dict(combined_recs, 'combined')

# --- Формируем итоговый список, учитывая только рейтинги user1 и user2 ---
final_list = []
for film_id, info in all_recs.items():
    r1 = info['ratings']['user1']
    r2 = info['ratings']['user2']
    combined_rating = r1 + r2  # Сумма рейтингов
    min_rating = min(r1, r2)   # Минимальный рейтинг
    final_list.append((film_id, info['title'], combined_rating, min_rating, r1, r2))

# Сортировка по сумме рейтингов (убывание) — для нахождения фильмов, которые максимально удовлетворяют обоих
sorted_by_sum = sorted(final_list, key=lambda x: x[2], reverse=True)

# Сортировка по минимальному рейтингу (убывание) — для фильмов, которые подходят обоим
sorted_by_min = sorted(final_list, key=lambda x: x[3], reverse=True)

# Фильтрация рекомендаций: оставляем только те фильмы, у которых минимальный рейтинг выше порога
rating_threshold = 0.01  # Порог минимального рейтинга для обоих пользователей
filtered_recs = [rec for rec in sorted_by_min if rec[3] >= rating_threshold]

# Выводим рекомендации
def print_recommendations(title, recs):
    print(f"\n{title}\n{'='*len(title)}")
    header = f"{'ID':<8} {'Название':<50} {'Сумма':>6} {'Мин.':>6} {'Средний':>8} {'Рейт.1':>8} {'Рейт.2':>8}"
    print(header)
    print('-'*len(header))
    for film_id, title, sum_r, min_r, r1, r2 in recs[:20]:
        # Вычисляем средний рейтинг
        avg_rating = (r1 + r2) / 2
        print(f"{film_id:<8} {title[:50]:<50} {sum_r:6.4f} {min_r:6.4f} {avg_rating:8.4f} {r1:8.4f} {r2:8.4f}")

# Выводим итоговые рекомендации
if filtered_recs:
    print_recommendations("Объединённые рекомендации (по минимальному рейтингу)", filtered_recs)
else:
    print("\nНе найдено фильмов, удовлетворяющих минимальному порогу рейтинга.")

if sorted_by_sum:
    print_recommendations("Объединённые рекомендации (по сумме рейтинга)", sorted_by_sum)
else:
    print("\nНе найдено фильмов, удовлетворяющих минимальному порогу рейтинга.")