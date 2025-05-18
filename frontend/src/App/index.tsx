import React from "react";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import './App.css';


import NotFound from "pages/404";
import HomePage from "pages/HomePage";

interface IProps {}

const App: React.FC<IProps> = () => {
  return (
    <BrowserRouter>
      <Switch>
        <Route path="/" exact component={HomePage} />
        <Route component={NotFound} />
      </Switch>
    </BrowserRouter>
  );
};

export default App;
