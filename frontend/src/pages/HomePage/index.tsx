import React from "react";
import { observer } from "mobx-react";

import "./home.css"
import { useStores } from "stores/useStores";
import { IUser } from "stores/UserStore";

import LayoutDefault from "components/LayoutDefault";

const HomePage = observer(() => {
  const user: IUser = useStores()["UserStore"].user;

  return (
    <LayoutDefault>
        <div className="container">
            <div className="centered">
      <h1>Home Page</h1>
      {user && <p>О привет, {user.name}</p>}
            </div>
        </div>
    </LayoutDefault>
  );
});

export default HomePage;
