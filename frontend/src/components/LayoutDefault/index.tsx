import React, { useState } from "react";
import { observer } from "mobx-react";
import { Link, useHistory } from "react-router-dom";
import "./layout.css";
import { useStores } from "stores/useStores";
import { RequestState } from "types/RequestState";
import VKShutter from "components/VKShutter/VKShutter"; // Импортируем VKShutter

const PRIVATE_ROUTES = ["/user"];

const LayoutDefault: React.FC = observer((props) => {
  const { user, state, getProfile, logout } = useStores()["UserStore"];
  let history = useHistory();

  const [isShutterOpen, setIsShutterOpen] = useState(false); // Состояние для управления открытием шторки

  React.useEffect(() => {
    const token = sessionStorage.getItem("token");

    if (PRIVATE_ROUTES.includes(history.location.pathname) && !token)
      return history.push("/signin");

    if (!user && state !== RequestState.LOADING && token) {
      getProfile().catch(() => {
        history.push("/signin");
        logout();
      });
    }
  }, [user, state, getProfile, logout, history]);

  // Функция для открытия шторки
  const handleOpenShutter = () => {
    setIsShutterOpen(false); // Сначала закрываем шторку
    setTimeout(() => {
      setIsShutterOpen(true); // Затем открываем заново
    }, 100); // Немного подождем, чтобы гарантировать перерисовку
  };

  return (
      <div>
        <div className="links-container">
          <Link to="/" className="link-item">
            Главная
          </Link>
          {user ? (
              <Link to="/user" className="link-item">
                Мой профиль
              </Link>
          ) : (
              <Link to="/signin" className="link-item">
                Войти
              </Link>
          )}
        </div>

        <div className="content-container">
          {props.children}

          {/* Кнопка для открытия шторки */}
          <div className="open-shutter-button" onClick={handleOpenShutter}>
            Открыть шторку
          </div>

          {/* Шторка с компонентом VKShutter */}
          {isShutterOpen && (
              <div className="shutter-container">
                <VKShutter />
              </div>
          )}
        </div>
      </div>
  );
});

export default LayoutDefault;
