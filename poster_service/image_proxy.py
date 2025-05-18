import requests
from flask import Flask, send_file, request
from io import BytesIO
import pandas as pd

app = Flask(__name__)

# Настроим прокси для SOCKS5
proxies = {
    'http': 'socks5h://ghVYjj:S4c68F@191.102.181.63:9434',  # Прокси SOCKS5 для HTTP
    'https': 'socks5h://ghVYjj:S4c68F@191.102.181.63:9434'  # Прокси SOCKS5 для HTTPS
}

TMDB_API_KEY = 'ac0b4de8fa111eeac7ec97ce28627ed4'  # Замените на ваш реальный API ключ

# Чтение links.csv для поиска tmdbId по movieId
links_df = pd.read_csv("links.csv")  # links.csv должен содержать столбцы "movieId" и "tmdbId"

def get_tmdb_id(movie_id: int) -> int:
    """Получить tmdbId для фильма по movieId из links.csv"""
    row = links_df[links_df['movieId'] == movie_id]
    if not row.empty:
        return row['tmdbId'].values[0]
    return None

@app.route('/get_movie_poster/<int:movie_id>', methods=['GET'])
def get_movie_poster(movie_id):
    """Получить постер фильма по его ID из MovieLens"""
    tmdb_id = get_tmdb_id(movie_id)
    if not tmdb_id:
        return f"tmdbId для movieId {movie_id} не найден.", 404

    # Ссылка на API TMDb для получения информации о фильме
    tmdb_url = f'https://api.themoviedb.org/3/movie/{tmdb_id}?api_key={TMDB_API_KEY}'

    try:
        # Делаем запрос к TMDb для получения данных о фильме
        response = requests.get(tmdb_url, proxies=proxies, timeout=10)
        response.raise_for_status()  # Проверка на ошибки HTTP

        movie_data = response.json()

        # Получаем путь к постеру
        poster_path = movie_data.get('poster_path')

        if not poster_path:
            return "Постер не найден.", 404

        # Формируем URL для постера
        poster_url = f'https://image.tmdb.org/t/p/w500{poster_path}'

        # Запрашиваем изображение с использованием прокси
        poster_response = requests.get(poster_url, proxies=proxies, stream=True)
        poster_response.raise_for_status()  # Проверка на ошибки HTTP

        # Отправляем изображение обратно пользователю
        return send_file(BytesIO(poster_response.content), mimetype='image/jpeg')

    except requests.exceptions.RequestException as e:
        # Обработка ошибок
        return f"Ошибка при получении постера: {e}", 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
