import React from "react";
import { Link } from "react-router-dom";

import "./404.css"
interface IProps {}
const NotFound: React.FC<IProps> = () => {
  return (
    <div className="container">
        <div className="centered">
      <p>Похоже такой страницы нет?! Что же делать?</p>
      <Link to="/" className={"btn-back"}>Вернуться на главную</Link>
        </div>
    </div>
  );
};

export default NotFound;
