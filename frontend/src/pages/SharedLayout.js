import React,{ useEffect, useContext } from "react";
import { Outlet, useLocation} from "react-router-dom";
import NavigationBar from "../components/NavigationBar";
import Footer from "../components/Footer";
import Container from "react-bootstrap/Container";
import "./Home.css";
import { useAnalytics } from "../utils/analytics";

function SharedLayout() {
    const location = useLocation();
    const { trackPageView } = useAnalytics();
    // Track page views when location changes
    useEffect(() => {
        trackPageView();
    }, [location, trackPageView]);
   
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
