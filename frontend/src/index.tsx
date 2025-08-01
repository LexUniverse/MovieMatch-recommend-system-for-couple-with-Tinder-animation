import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "mobx-react";

import './index.css';
import * as serviceWorker from "./serviceWorker";

import App from "App";

import UserStore from "stores/UserStore";


ReactDOM.render(
  <Provider UserStore={UserStore}>
    <App />
  </Provider>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
