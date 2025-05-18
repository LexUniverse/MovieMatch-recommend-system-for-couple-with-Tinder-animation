import axios from 'axios';

const instance = axios.create({
    baseURL: '/', // если ты используешь proxy, оставь /
    withCredentials: true, // если нужно передавать куки
});

// Лог всех запросов
instance.interceptors.request.use((config) => {
    console.log('➡️ [REQUEST]', config.method?.toUpperCase(), config.url, config);
    return config;
}, (error) => {
    console.error('❌ [REQUEST ERROR]', error);
    return Promise.reject(error);
});

// Лог всех ответов
instance.interceptors.response.use((response) => {
    console.log('✅ [RESPONSE]', response.config.url, response);
    return response;
}, (error) => {
    console.error('❌ [RESPONSE ERROR]', error.config?.url, error.response || error);
    return Promise.reject(error);
});

export default instance;
