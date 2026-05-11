import React from "react";
import NavItem from "./NavItem";

const MainNav = () => {
  return (
    <nav className="main-nav h-41 flex items-center justify-between pl-16 pr-40 py-6">
      <div></div>

      <div className="flex gap-6">
        <NavItem to="/">Home</NavItem>
        <NavItem to="/ueber-uns">Der BSCV</NavItem>
        <NavItem to="/renntermine">Renntermine</NavItem>
        <NavItem to="/vereine">Vereine</NavItem>
        <NavItem to="/galerie">Fotos & Videos</NavItem>
        <NavItem to="/meisterschaften">Meisterschaften</NavItem>
      </div>
    </nav>
  );
};

export default MainNav;
