import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./Home.css";

function SharedLayout() {
    return (
        <div className="container">
            <Navbar />
            <div className="main">
                <Outlet />
            </div>
            <Footer />
        </div>
    );
}

export default SharedLayout;
