import pandas as pd
import re

# Загрузка данных
ratings = pd.read_csv('ratings.csv')
movies = pd.read_csv('movies.csv')

# Извлеките год выпуска из названия фильма
def extract_year(title):
    match = re.search(r'\((\d{4})\)', title)
    if match:
        return int(match.group(1))
    else:
        return None

# Добавьте год выпуска в данные о фильмах
movies['year'] = movies['title'].apply(extract_year)

# Сохраните обновленные данные
movies.to_csv('movies_with_year.csv', index=False)

# Создание матрицы рейтингов
ratings_matrix = ratings.pivot(index='userId', columns='movieId', values='rating')

# Рассчитайте среднюю оценку для каждого фильма
movie_means = ratings.groupby('movieId')['rating'].mean()

# Замените NaN на среднюю оценку для каждого фильма
ratings_matrix = ratings_matrix.fillna(movie_means)

# Сохраните обработанную матрицу
ratings_matrix.to_csv('processed_ratings_matrix.csv', index=True)
