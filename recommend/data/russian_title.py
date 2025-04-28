import requests
import pandas as pd
import json
import os
import time
from tqdm import tqdm
from concurrent.futures import ThreadPoolExecutor, as_completed
import itertools

TMDB_API_KEYS = ["ac0b4de8fa111eeac7ec97ce28627ed4", "9f81e2a078b09eefd55e3618c30ee8b1"]
api_key_cycle = itertools.cycle(TMDB_API_KEYS)

PROXIES = {
    'http': 'socks5h://ghVYjj:S4c68F@191.102.181.63:9434',
    'https': 'socks5h://ghVYjj:S4c68F@191.102.181.63:9434'
}

PROGRESS_FILE = "progress.json"
INPUT_FILE = "movies_with_year.csv"
OUTPUT_FILE = "movies_with_russian_title.csv"
SAVE_EVERY = 60
BATCH_SIZE = 30

def load_progress():
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE, "r") as f:
            return json.load(f)
    else:
        return {"last_processed_movieId": 0}

def save_progress(last_processed_movieId):
    with open(PROGRESS_FILE, "w") as f:
        json.dump({"last_processed_movieId": last_processed_movieId}, f)

def get_movie_translation(tmdb_id, api_key):
    url = f"https://api.themoviedb.org/3/movie/{tmdb_id}/translations?api_key={api_key}"
    try:
        response = requests.get(url, proxies=PROXIES, timeout=10)
        response.raise_for_status()
        data = response.json()
        for translation in data.get('translations', []):
            if translation['iso_639_1'] == 'ru':
                return translation['data']['title']
    except requests.exceptions.RequestException:
        pass
    return None

def fetch_translation_for_movie(tmdb_id):
    for _ in range(len(TMDB_API_KEYS)):
        api_key = next(api_key_cycle)
        russian_title = get_movie_translation(tmdb_id, api_key)
        if russian_title:
            return russian_title
    return None

# Загружаем данные
movies_df = pd.read_csv(INPUT_FILE)
links_df = pd.read_csv('links.csv')
movies_df = pd.merge(movies_df, links_df[['movieId', 'tmdbId']], on='movieId', how='left')

# Загружаем прогресс
progress = load_progress()
last_processed_movieId = progress["last_processed_movieId"]

# Загружаем уже обработанные movieId
if os.path.exists(OUTPUT_FILE):
    processed_df = pd.read_csv(OUTPUT_FILE)
    processed_movieIds = set(processed_df['movieId'])
else:
    processed_movieIds = set()

counter_since_last_save = 0
pending_results = []

with ThreadPoolExecutor(max_workers=5) as executor:
    futures = {}

    with tqdm(total=movies_df.shape[0], desc="Обработка фильмов", initial=len(processed_movieIds)) as pbar:
        for index, row in movies_df.iterrows():
            movieId = row['movieId']
            if movieId in processed_movieIds:
                continue

            tmdb_id = row['tmdbId']
            futures[executor.submit(fetch_translation_for_movie, tmdb_id)] = row

            if len(futures) >= BATCH_SIZE:
                batch_results = []
                for future in as_completed(futures):
                    row = futures[future]
                    russian_title = future.result()
                    russian_title = russian_title if russian_title else row['title']

                    batch_results.append({
                        'movieId': row['movieId'],
                        'title': row['title'],
                        'genres': row['genres'],
                        'year': row['year'],
                        'russian_title': russian_title
                    })
                    processed_movieIds.add(row['movieId'])
                    counter_since_last_save += 1
                    pbar.update(1)

                # Сортируем пачку перед записью
                df_batch = pd.DataFrame(batch_results)
                df_batch = df_batch.sort_values(by="movieId")

                # Дописываем без перезаписи
                header = not os.path.exists(OUTPUT_FILE)
                df_batch.to_csv(OUTPUT_FILE, mode='a', index=False, header=header, encoding='utf-8')

                # Сохраняем прогресс
                last_movie_in_batch = max(row['movieId'] for row in batch_results)
                save_progress(last_movie_in_batch)
                print(f"💾 Прогресс сохранен до movieId={last_movie_in_batch}")

                futures = {}

# Финальная очистка (если что-то осталось в очереди)
if futures:
    batch_results = []
    for future in as_completed(futures):
        row = futures[future]
        russian_title = future.result()
        russian_title = russian_title if russian_title else row['title']

        batch_results.append({
            'movieId': row['movieId'],
            'title': row['title'],
            'genres': row['genres'],
            'year': row['year'],
            'russian_title': russian_title
        })
        processed_movieIds.add(row['movieId'])
        pbar.update(1)

    df_batch = pd.DataFrame(batch_results)
    df_batch = df_batch.sort_values(by="movieId")
    header = not os.path.exists(OUTPUT_FILE)
    df_batch.to_csv(OUTPUT_FILE, mode='a', index=False, header=header, encoding='utf-8')

    last_movie_in_batch = max(row['movieId'] for row in batch_results)
    save_progress(last_movie_in_batch)
    print(f"💾 Финальный прогресс сохранен до movieId={last_movie_in_batch}")

print("🎉 Обработка полностью завершена!")
