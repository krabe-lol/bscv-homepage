import React from "react";
import { Link } from "react-router-dom";

interface NavItemProps {
  to: string;
  children: React.ReactNode;
}

const NavItem = ({ to, children }: NavItemProps) => {
  return (
    <Link to={to} className="underline decoration-red-800 decoration-4 underline-offset-4 font-grotesk text-lg">
      <span>{children}</span>
    </Link>
  );
};

export default NavItem;
