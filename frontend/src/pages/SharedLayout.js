import React from "react";
import { Outlet } from "react-router-dom";
import NavigationBar from "../components/NavigationBar";
import Footer from "../components/Footer";
import Container from "react-bootstrap/Container";
import "./Home.css";

function SharedLayout() {
    return (
        <Container>
            <NavigationBar />
            <div className="main">
                <Outlet />
            </div>
            <Footer />
        </Container>
    );
}

export default SharedLayout;
