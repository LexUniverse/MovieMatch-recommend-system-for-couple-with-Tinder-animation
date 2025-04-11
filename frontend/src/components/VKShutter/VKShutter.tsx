import React, { useEffect } from 'react';

const VKShutter: React.FC = () => {
    // Функции для обработки успеха и ошибки
    const vkidOnSuccess = (data: any) => {
        console.log('Login success:', data);
    };

    const vkidOnError = (error: any) => {
        console.error('Login error:', error);
    };

    useEffect(() => {
        // Создаем скрипт и добавляем его в DOM
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@vkid/sdk@<3.0.0/dist-sdk/umd/index.js';
        script.async = true;

        script.onload = () => {
            // Проверяем наличие VKIDSDK
            if ('VKIDSDK' in window) {
                const VKID = window.VKIDSDK;

                VKID.Config.init({
                    app: 52854807,
                    redirectUrl: 'http://localhost',
                    responseMode: VKID.ConfigResponseMode.Callback,
                    source: VKID.ConfigSource.LOWCODE,
                    scope: '', // Заполните нужными доступами по необходимости
                });

                const floatingOneTap = new VKID.FloatingOneTap();

                floatingOneTap.render({
                    scheme: 'dark',
                    indent: {
                        right: 10,
                        top: 40,
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
        };

        document.body.appendChild(script); // Добавляем скрипт в DOM

        return () => {
            document.body.removeChild(script); // Убираем скрипт при размонтировании компонента
        };
    }, []); // Эта зависимость остается пустой, так как скрипт должен загрузиться только один раз

    return null;
};

export default VKShutter;
