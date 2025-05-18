// LayoutDefault.tsx
import React, { useState } from "react";
import { observer } from "mobx-react";
import { useHistory } from "react-router-dom";
import "./layout.css";
import { useStores } from "stores/useStores";
import { RequestState } from "types/RequestState";
import VKShutter from "components/VKShutter/VKShutter";
import VKButton from "../VKButton";
import UserPreferencesModal from "../modal/userPrefs/UserPreferencesModal";

const PRIVATE_ROUTES = ["/user"];

const LayoutDefault: React.FC = observer((props) => {
  const { user, state, getProfile, logout } = useStores()["UserStore"];
  const history = useHistory();
  const [isShutterOpen, setIsShutterOpen] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);

  React.useEffect(() => {
    const token = sessionStorage.getItem("token");

    if (PRIVATE_ROUTES.includes(history.location.pathname) && !token) {
      history.push("/");
      return;
    }

    if (!user && state !== RequestState.LOADING && token) {
      getProfile().catch(() => {
        logout();
        history.push("/");
      });
    }
  }, [user, state, getProfile, logout, history]);

  const handleOpenShutter = () => {
    setIsShutterOpen(true);
  };

  const handleCloseShutter = () => {
    setIsShutterOpen(false);
  };

  return (
      <div>
        <div className="links-container">
          <a className="name" href="#top">
            MovieMatch
          </a>
          {user ? (
              <div className="link-item" onClick={handleOpenShutter}>
                Мой профиль
              </div>
          ) : (
              <VKButton />
          )}
        </div>

        {props.children}


        {user && (
            <>
              <VKShutter
                  isOpen={isShutterOpen}
                  onClose={handleCloseShutter}
                  user={user}
                  onLogout={() => {
                    logout();
                    setIsShutterOpen(false);
                    history.push("/");
                  }}
                  onOpenPreferences={() => {
                    setShowPreferencesModal(true);
                    setIsShutterOpen(false);
                  }}
              />

              {showPreferencesModal && (
                  <UserPreferencesModal
                      userId={user.id}
                      onClose={() => setShowPreferencesModal(false)}
                  />
              )}
            </>
        )}

      </div>
  );
});

export default LayoutDefault;
