import requests
import pandas as pd
import json
import os
import time
from tqdm import tqdm
from concurrent.futures import ThreadPoolExecutor, as_completed

# TMDb API Keys (замени на свои ключи)
TMDB_API_KEYS = ["ac0b4de8fa111eeac7ec97ce28627ed4", "9f81e2a078b09eefd55e3618c30ee8b1"]
PROGRESS_FILE = "progress.json"  # Файл для сохранения прогресса
DATA_FILE = "movies_with_russian_title.csv"  # Файл для сохранения результатов


def load_progress():
    """Загружает прогресс из файла."""
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE, "r") as f:
            return json.load(f)
    else:
        return {"last_processed_movieId": 0}


def save_progress(last_processed_movieId):
    """Сохраняет прогресс в файл."""
    with open(PROGRESS_FILE, "w") as f:
        json.dump({"last_processed_movieId": last_processed_movieId}, f)


def get_movie_translation(tmdb_id, api_key):
    """Получает русское название фильма по tmdbId."""
    url = f"https://api.themoviedb.org/3/movie/{tmdb_id}/translations?api_key={api_key}"
    try:
        response = requests.get(url)
        response.raise_for_status()  # Проверка на ошибку HTTP-запроса
        data = response.json()
        for translation in data.get('translations', []):
            if translation['iso_639_1'] == 'ru':  # Проверяем, есть ли русский перевод
                return translation['data']['title']
    except requests.exceptions.RequestException as e:
        print(f"Ошибка при запросе перевода для фильма {tmdb_id}: {e}")
    return None


def fetch_translation_for_movie(tmdb_id):
    """Функция для получения перевода фильма, используя несколько API ключей"""
    for api_key in TMDB_API_KEYS:
        russian_title = get_movie_translation(tmdb_id, api_key)
        if russian_title:
            return russian_title
    return None


# Чтение данных из movies.csv и links.csv
movies_df = pd.read_csv('movies.csv')  # Содержит информацию о фильмах
links_df = pd.read_csv('links.csv')  # Содержит информацию о TMDb и IMDb ID

# Объединяем данные по movieId
movies_df = pd.merge(movies_df, links_df[['movieId', 'tmdbId']], on='movieId', how='left')

# Загружаем прогресс
progress = load_progress()
last_processed_movieId = progress["last_processed_movieId"]

# Список для хранения новых данных
all_movie_data = []

# Обработка фильмов, начиная с последнего обработанного
with ThreadPoolExecutor(max_workers=5) as executor:  # 5 потоков
    futures = []
    for index, row in tqdm(movies_df.iterrows(), total=movies_df.shape[0], desc="Обработка фильмов",
                           initial=last_processed_movieId):
        movieId = row['movieId']

        if movieId <= last_processed_movieId:  # Пропускаем уже обработанные фильмы
            continue

        # Отправляем асинхронный запрос на получение русского названия фильма
        tmdb_id = row['tmdbId']
        futures.append(executor.submit(fetch_translation_for_movie, tmdb_id,))

        # Добавляем обработку каждого фильма в список
        if len(futures) % 5 == 0:
            for future in as_completed(futures):
                russian_title = future.result()
                russian_title = russian_title if russian_title else row['title']

                movie_data = {
                    'movieId': movieId,
                    'title': row['title'],
                    'genres': row['genres'],
                    'year': row['year'],
                    'russian_title': russian_title
                }
                all_movie_data.append(movie_data)

            # Сохранение прогресса через каждые 5 фильмов
            save_progress(movieId)
            # Создание DataFrame и запись в CSV
            df = pd.DataFrame(all_movie_data)
            df.to_csv(DATA_FILE, index=False, encoding='utf-8')
            print(f"Прогресс сохранен до фильма {movieId}.")
            time.sleep(1)  # Пауза между запросами, чтобы избежать перегрузки

    # Запись оставшихся данных в CSV, если цикл завершен
    for future in as_completed(futures):
        russian_title = future.result()
        russian_title = russian_title if russian_title else row['title']

        movie_data = {
            'movieId': movieId,
            'title': row['title'],
            'genres': row['genres'],
            'year': row['year'],
            'russian_title': russian_title
        }
        all_movie_data.append(movie_data)

    if all_movie_data:
        df = pd.DataFrame(all_movie_data)
        df.to_csv(DATA_FILE, index=False, encoding='utf-8')
        print("Обработка завершена и данные сохранены.")
