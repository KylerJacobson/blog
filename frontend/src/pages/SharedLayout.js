import React,{ useEffect } from "react";
import { Outlet, useLocation} from "react-router-dom";
import NavigationBar from "../components/NavigationBar";
import Footer from "../components/Footer";
import Container from "react-bootstrap/Container";
import "./Home.css";
import { trackPageView } from "../utils/analytics";

function SharedLayout() {
    const location = useLocation();
    // Track page views when location changes
    useEffect(() => {
        trackPageView();
    }, [location]); // This will re-run whenever the URL path changes
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
