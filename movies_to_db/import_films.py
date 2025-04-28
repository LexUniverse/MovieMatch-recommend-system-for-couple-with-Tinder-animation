import csv
import psycopg2
import os

# 💾 Настройки подключения к БД — замени на свои!
DB_USER = 'postgres'
DB_PASSWORD = 'Aleks12345'
DB_HOST = 'localhost'
DB_PORT = '5432'
DB_NAME = 'test'

CSV_FILE = os.path.join(os.path.dirname(__file__), 'films.csv')

def main():
    # Подключение к БД
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )
    cursor = conn.cursor()

    # Словарь для жанров
    genre_dict = {}

    with open(CSV_FILE, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        films = []
        for row in reader:
            movie_id = int(row['movieId'])
            title = row['title']
            year = int(float(row['year'])) if row['year'] else None
            genres = row['genres'].split('|') if row['genres'] else []

            films.append({
                'movie_id': movie_id,
                'title': title,
                'year': year,
                'genres': genres
            })

            for genre in genres:
                if genre and genre not in genre_dict:
                    genre_dict[genre] = None  # позже получим ID

    # Вставляем жанры в таблицу genres
    for genre_name in genre_dict:
        cursor.execute(
            "INSERT INTO genres (name) VALUES (%s) ON CONFLICT (name) DO NOTHING RETURNING id;",
            (genre_name,)
        )
        result = cursor.fetchone()
        if result:
            genre_dict[genre_name] = result[0]
        else:
            # если жанр уже был, получаем его id
            cursor.execute("SELECT id FROM genres WHERE name = %s;", (genre_name,))
            genre_dict[genre_name] = cursor.fetchone()[0]

    # Вставляем фильмы в таблицу films
    for film in films:
        cursor.execute(
            "INSERT INTO films (id, title, year) VALUES (%s, %s, %s) ON CONFLICT (id) DO NOTHING RETURNING id;",
            (film['movie_id'], film['title'], film['year'])
        )
        result = cursor.fetchone()
        if result:
            film_id = result[0]
        else:
            film_id = film['movie_id']

        for genre in film['genres']:
            genre_id = genre_dict.get(genre)
            if genre_id:
                cursor.execute(
                    "INSERT INTO films_genres_genres (filmsid, genresid) VALUES (%s, %s) ON CONFLICT DO NOTHING;",
                    (film_id, genre_id)
                )

    conn.commit()
    cursor.close()
    conn.close()
    print("✅ Импорт фильмов завершен успешно.")

if __name__ == '__main__':
    main()
