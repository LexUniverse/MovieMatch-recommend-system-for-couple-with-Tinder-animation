import requests

# Прокси настройки
proxies = {
    'http': 'socks5h://ghVYjj:S4c68F@191.102.181.63:9434',  # Прокси SOCKS5 для HTTP
    'https': 'socks5h://ghVYjj:S4c68F@191.102.181.63:9434'  # Прокси SOCKS5 для HTTPS
}

# Ваш TMDb API ключ (замените на свой ключ)
TMDB_API_KEY = 'ac0b4de8fa111eeac7ec97ce28627ed4'

# Пример TMDb Movie ID
movie_id = 550  # Fight Club

# URL запроса к TMDb API
url = f'https://api.themoviedb.org/3/movie/{movie_id}?api_key={TMDB_API_KEY}'

try:
    # Запрос к TMDb API для получения данных о фильме
    response = requests.get(url, proxies=proxies, timeout=10)
    response.raise_for_status()  # Проверка на ошибки HTTP
    movie_data = response.json()

    # Извлечение пути к постеру из данных
    poster_path = movie_data.get('poster_path')

    # Если постер найден, формируем полный URL
    if poster_path:
        poster_url = f'https://image.tmdb.org/t/p/w500{poster_path}'
        print(f"Ссылка на постер: {poster_url}")
    else:
        print("Постер не найден.")
except requests.exceptions.RequestException as e:
    print(f"Ошибка при запросе: {e}")
