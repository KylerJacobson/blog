import React from "react";
import "./Navbar.css";
import { NavLink } from "react-router-dom";

function Navbar() {
    return (
        <div className="navbar">
            <NavLink className="link" to="/">
                Home
            </NavLink>
            <NavLink className="link" to="/about">
                About
            </NavLink>
        </div>
    );
}

export default Navbar;
