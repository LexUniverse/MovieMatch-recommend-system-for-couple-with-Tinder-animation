# Веб-сервис для подбора фильмов на основе совместных предпочтений


# Установка

```
git clone https://github.com/LexUniverse/testRepos/tree/show
cd vk-auth-react-nestjs
```

# Подготовка

Отредактируйте файл .env в backend изменив 
```
DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_DATABASE=
```
на ваши данные для подключения к бд, а также 
```
CLIENT_ID=
CLIENT_SECRET=
```
на ваши данные для аутентификации через vk

в папке frontend отредактируйте .env файл
```
REACT_APP_CLIENT_ID
```
на данные для аутентификации через vk

В приожении vk нужно будет подключить redirect на localhost, иначе ничего работать не будет

Также в модуле poster_service в файле image_proxy.py
измените на ваши, посольку эти уже устарели 
```
proxies = {
    'http': 'socks5h://ghVYjj:S4c68F@191.102.181.63:9434',  # Прокси SOCKS5 для HTTP
    'https': 'socks5h://ghVYjj:S4c68F@191.102.181.63:9434'  # Прокси SOCKS5 для HTTPS
}
```

# Запуск

## Запуск черезе MakeFile

```bash
$ vk-auth-react-nestjs: make
```

## Backend

```bash
$ vk-auth-react-nestjs: cd backend
$ vk-auth-react-nestjs/backend: docker-compose up -d
$ vk-auth-react-nestjs/backend: yarn
$ vk-auth-react-nestjs/backend: yarn dev
```

## Frontend

```bash
$ vk-auth-react-nestjs: cd frontend
$ vk-auth-react-nestjs/frontend: yarn
$ vk-auth-react-nestjs/frontend: yarn dev
```


## roomRTservice

```bash
$ vk-auth-react-nestjs: cd roomRTservice
$ vk-auth-react-nestjs/roomRTservice: yarn
$ vk-auth-react-nestjs/roomRTservice: yarn start
```

## recommend

```bash
$ vk-auth-react-nestjs: cd recommend
$ vk-auth-react-nestjs/recommend: uvicorn app:app --reload
```

## poster_service

```bash
$ vk-auth-react-nestjs: cd poster_service
$ vk-auth-react-nestjs/poster_service: python image_proxy.py
```

# Настройка

Для работы необходимо:

1. Создать приложение во Вконтакте
2. Отредактировать файлы .env в папке frontend и backend

```bash
frontend/.env: REACT_APP_CLIENT_ID -- ID приложения
backend/.env: CLIENT_ID -- ID приложения
backend/.env: CLIENT_SECRET -- Защищённый ключ
```
