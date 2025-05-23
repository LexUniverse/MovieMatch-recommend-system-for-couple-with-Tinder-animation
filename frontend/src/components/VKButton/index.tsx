import React from "react";
import { withRouter, RouteComponentProps } from "react-router-dom";
import queryString from "query-string";
import "./vkbtn.css";
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

  const cbLink = `${host}`;

  const handleRedirect = () => {
    //console.log("[VKButton] Redirecting to VK OAuth with redirect_uri:", cbLink);
    window.location.href = `https://oauth.vk.com/authorize?client_id=${process.env.REACT_APP_CLIENT_ID}&display=popup&redirect_uri=${cbLink}&scope=email&response_type=code&v=5.120&state=4194308`;
  };

  React.useEffect(() => {
    const handleLogin = (code: string) => {
      //console.log("VKButton code:", code); // ← лог

      UserStore.loginVk(code)
        .then(() => {
          props.history.push("/");
        })
        .catch(() => setIsError(true));
    };

    let queryObj = queryString.parse(props.location.search);



    if (!isEmptyObj(queryObj) && queryObj["code"]) handleLogin(queryObj.code);
  }, [props.location.search, isError, cbLink, props.history]);

  return (
    <div>
      <button className={"vk-button"} onClick={handleRedirect}>
        Войти с VK
      </button>
      {isError && <p style={{ color: "red" }}>Ошибка входа через ВК</p>}
    </div>
  );
};

export default withRouter(VKButton);
