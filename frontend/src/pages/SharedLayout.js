import React from "react";
import { Outlet } from "react-router-dom";
import NavigationBar from "../components/NavigationBar";
import Footer from "../components/Footer";
import Container from "react-bootstrap/Container";
import "./Home.css";

function SharedLayout() {
    return (
        <div className="d-flex flex-column min-vh-100">
            <Container className="mb-auto">
                <NavigationBar />
                <div className="main">
                    <Outlet />
                </div>
            </Container>

            <Footer />
        </div>
    );
}
export default SharedLayout;
