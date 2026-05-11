import React from "react";
import { Link } from "react-router-dom";

const MainNavigation = () => {
  return (
    <nav className="main-nav">
      <Link to="/">
        <span>Home</span>
      </Link>
      <Link to="/vereine">
        <span>Vereine</span>
      </Link>
    </nav>
  );
};

export default MainNavigation;
