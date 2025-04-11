import pandas as pd

# Загрузите датасет MovieLens
movies = pd.read_csv('movies.csv')

# Извлеките жанры и создайте набор уникальных жанров
genres_set = set()
for genres in movies['genres']:
    genres_list = genres.split('|')
    genres_set.update(genres_list)

# Выведите список уникальных жанров
unique_genres = sorted(list(genres_set))
print("Список уникальных жанров:")
for genre in unique_genres:
    print(genre)
