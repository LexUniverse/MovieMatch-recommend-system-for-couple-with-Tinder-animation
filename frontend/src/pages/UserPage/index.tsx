import React from "react";
import { observer, inject } from "mobx-react";
import { RouteComponentProps, withRouter } from "react-router-dom";

import "./user.css"
import LayoutUser from "components/LayoutUser";

import { RequestState } from "types/RequestState";
import UserStore from "stores/UserStore";

interface IProps extends RouteComponentProps {
  UserStore: typeof UserStore;
}

class UserPage extends React.Component<IProps, any> {
  componentDidMount() {
    const token = sessionStorage.getItem("token");
    if (!token) return this.props.history.push("/signin");
  }

  handleLogout = () => {
    UserStore.logout();
    this.props.history.push("/");
  };

  render() {
    const { state, user } = this.props.UserStore;

    if (state === RequestState.ERROR) return <p>Erorr</p>;

    if (state !== RequestState.SUCCESS) {
      return (
        <LayoutUser>
          <p>Loading...</p>
        </LayoutUser>
      );
    }

    return (
      <LayoutUser>
        <div className="container">
        <div className="centered">
          <img
            src={user.avatar_url}
            alt="vk avatar"

          />
          <p>{user.name}</p>
          <p>{user.email}</p>
          <button
            onClick={this.handleLogout}
          >
            Выйти
          </button>
        </div>
        </div>
      </LayoutUser>
    );
  }
}

export default inject("UserStore")(withRouter(observer(UserPage)));
