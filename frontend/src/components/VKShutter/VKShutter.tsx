import React, { useEffect } from 'react';

const VKShutter: React.FC = () => {
    useEffect(() => {
        // Создаем тег <script> для подключения SDK
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@vkid/sdk@<3.0.0/dist-sdk/umd/index.js';
        script.async = true;
        document.body.appendChild(script);

        // Когда скрипт загружен, инициализируем SDK
        script.onload = () => {
            if ('VKIDSDK' in window) {
                const VKID = window.VKIDSDK;

                VKID.Config.init({
                    app: 52854807,
                    redirectUrl: 'http://localhost',
                    responseMode: VKID.ConfigResponseMode.Callback,
                    source: VKID.ConfigSource.LOWCODE,
                    scope: '', // Заполните нужными доступами
                });

                const floatingOneTap = new VKID.FloatingOneTap();

                floatingOneTap
                    .render({
                        scheme: 'dark',
                        indent: {
                            right: 32,
                            top: 66,
                            bottom: 10,
                        },
                        appName: 'Movie Match',
                        oauthList: ['ok_ru', 'mail_ru'],
                        showAlternativeLogin: true,
                    })
                    .on(VKID.WidgetEvents.ERROR, vkidOnError)
                    .on(VKID.FloatingOneTapInternalEvents.LOGIN_SUCCESS, function (payload) {
                        const code = payload.code;
                        const deviceId = payload.device_id;

                        VKID.Auth.exchangeCode(code, deviceId)
                            .then(vkidOnSuccess)
                            .catch(vkidOnError);
                    });
            }

            // Функция успешного входа
            function vkidOnSuccess(data: any) {
                console.log('Успешный вход:', data);
                // Закрытие шторки после успешного входа
                const floatingOneTap = window.VKIDSDK?.FloatingOneTap;
                if (floatingOneTap) floatingOneTap.close();
            }

            // Функция обработки ошибок
            function vkidOnError(error: any) {
                console.error('Ошибка авторизации:', error);
                // Можете обработать ошибку
            }
        };

        // Очистка скрипта при размонтировании компонента
        return () => {
            document.body.removeChild(script);
        };
    }, []); // Пустой массив зависимостей, чтобы запускался один раз

    return <div></div>;
};

export default VKShutter;
