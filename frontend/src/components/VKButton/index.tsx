import React from "react";
import { withRouter, RouteComponentProps } from "react-router-dom";
import queryString from "query-string";

import { isEmptyObj } from "helpers/isEmptyObj";
import UserStore from "stores/UserStore";

import vk from "./img/VK_Blue_Logo.svg";


interface IProps extends RouteComponentProps {}

const VKButton: React.FC<IProps> = (props) => {
  const [isError, setIsError] = React.useState(false);

  const host =
    process.env.REACT_APP_MODE === "production"
      ? process.env.REACT_APP_HOST_PROD
      : process.env.REACT_APP_HOST_LOCAL;

  const cbLink = `${host}/signin`;

  const handleRedirect = () => {
    window.location.href = `https://oauth.vk.com/authorize?client_id=${process.env.REACT_APP_CLIENT_ID}&display=popup&redirect_uri=${cbLink}&scope=email&response_type=code&v=5.120&state=4194308`;
  };

  React.useEffect(() => {
    const handleLogin = (code: string) => {
      UserStore.loginVk(code)
        .then(() => {
          props.history.push("/user");
        })
        .catch(() => setIsError(true));
    };

    let queryObj = queryString.parse(props.location.search);

    if (isError) window.location.href = cbLink;

    if (!isEmptyObj(queryObj) && queryObj["code"]) handleLogin(queryObj.code);
  }, [props.location.search, isError, cbLink, props.history]);

  return (
    <div>
      <button onClick={handleRedirect}>
        <img
          src={vk}
          alt="vk logo"
        />
        Войти через Вконтакте
      </button>
      {isError && <p style={{ color: "red" }}>Ошибка входа через ВК</p>}
    </div>
  );
};

export default withRouter(VKButton);
