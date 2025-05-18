import csv
import psycopg2
from datetime import datetime

DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'dbname': 'test',
    'user': 'postgres',
    'password': 'Aleks12345'
}

CSV_FILE = 'movies_with_russian_title.csv'


def connect_db():
    return psycopg2.connect(**DB_CONFIG)


def get_genre_id_map(cur):
    cur.execute("SELECT id, name FROM genres;")
    return {name.strip(): gid for gid, name in cur.fetchall()}


def film_exists(cur, film_id):
    cur.execute("SELECT 1 FROM films WHERE id = %s;", (film_id,))
    return cur.fetchone() is not None


def insert_film(cur, film):
    cur.execute("""
        INSERT INTO films (id, created, updated, title, year, russian_title)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (film['id'], film['created'], film['updated'], film['title'], film['year'], film['russian_title']))


def get_existing_film_genres(cur, film_id):
    cur.execute("""
        SELECT "genresId" FROM films_genres_genres WHERE "filmsId" = %s;
    """, (film_id,))
    return {gid for (gid,) in cur.fetchall()}


def insert_film_genre_link(cur, film_id, genre_id):
    cur.execute("""
        INSERT INTO films_genres_genres ("filmsId", "genresId")
        VALUES (%s, %s)
        ON CONFLICT DO NOTHING
    """, (film_id, genre_id))


def main():
    with connect_db() as conn:
        with conn.cursor() as cur:
            genre_map = get_genre_id_map(cur)

            with open(CSV_FILE, newline='', encoding='utf-8') as csvfile:
                reader = csv.DictReader(csvfile)
                for row in reader:
                    film_id = int(row['movieId'])
                    title = row['title']
                    year = int(row['year'])
                    russian_title = row['russian_title']
                    genres = row['genres'].split('|') if row['genres'] else []
                    now = datetime.utcnow()

                    try:
                        cur.execute("SAVEPOINT film_savepoint;")

                        # Фильм
                        if not film_exists(cur, film_id):
                            insert_film(cur, {
                                'id': film_id,
                                'created': now,
                                'updated': now,
                                'title': title,
                                'year': year,
                                'russian_title': russian_title
                            })
                            print(f"✅ Добавлен фильм: {title}")
                        else:
                            print(f"ℹ️ Уже есть фильм: {title}")

                        # Жанры
                        existing_links = get_existing_film_genres(cur, film_id)
                        for genre_name in genres:
                            genre_name_clean = genre_name.strip()
                            genre_id = genre_map.get(genre_name_clean)
                            if not genre_id:
                                print(f"⚠️ Жанр не найден: {genre_name_clean}")
                                continue
                            if genre_id not in existing_links:
                                insert_film_genre_link(cur, film_id, genre_id)
                                print(f"  ➕ Добавлена связь: {title} → {genre_name_clean}")

                        cur.execute("RELEASE SAVEPOINT film_savepoint;")

                    except Exception as e:
                        cur.execute("ROLLBACK TO SAVEPOINT film_savepoint;")
                        print(f"❌ Ошибка при обработке {row}: {e}")

            conn.commit()
            print("🎉 Обработка завершена.")


if __name__ == "__main__":
    main()
