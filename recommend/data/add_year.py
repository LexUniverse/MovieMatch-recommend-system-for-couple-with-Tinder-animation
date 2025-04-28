import re
import pandas as pd

# Загрузка данных
ratings = pd.read_csv('ratings.csv')
movies = pd.read_csv('movies.csv')

# Извлеките год выпуска из названия фильма
def extract_year(title):
    match = re.search(r'\((\d{4})\)', title)
    if match:
        return int(match.group(1))
    else:
        return 0

# Добавьте год выпуска в данные о фильмах
movies['year'] = movies['title'].apply(extract_year)
# Сохраните обновленные данные
movies.to_csv('movies_with_year.csv', index=False)
