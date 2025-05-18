import pandas as pd

# Загружаем данные
ratings = pd.read_csv('ratings.csv')
movies = pd.read_csv('movies_with_russian_title.csv')

# Считаем количество оценок (популярность)
popularity = ratings.groupby('movieId').size().reset_index(name='num_ratings')

# Объединяем с метаданными фильмов
movies_popular = pd.merge(movies, popularity, on='movieId', how='inner')

# Фильтруем фильмы с хотя бы 10 оценками (можно изменить порог)
movies_popular = movies_popular[movies_popular['num_ratings'] >= 10]

# Сортируем по убыванию популярности
movies_popular = movies_popular.sort_values(by='num_ratings', ascending=False)

# Сохраняем нужные поля
movies_popular[['movieId', 'title', 'russian_title', 'genres', 'year', 'num_ratings']].to_csv('popular_movies.csv', index=False)

print("✅ Файл popular_movies.csv успешно сохранён.")
