import pandas as pd

# Загрузка данных
ratings = pd.read_csv('ratings.csv')

# Создание матрицы рейтингов
ratings_matrix = ratings.pivot(index='userId', columns='movieId', values='rating')

# Рассчитайте среднюю оценку для каждого фильма
movie_means = ratings.groupby('movieId')['rating'].mean()

# Замените NaN на среднюю оценку для каждого фильма
for movie_id in ratings_matrix.columns:
    ratings_matrix[movie_id] = ratings_matrix[movie_id].fillna(movie_means[movie_id])

# Сохраните матрицу в файл
ratings_matrix.to_csv('processed_ratings_matrix.csv', index=True)

# Создание DataFrame для тренировки
train_data = ratings.copy()

# Сохраните тренировочные данные в файл
train_data.to_csv('train_data.csv', index=False)
