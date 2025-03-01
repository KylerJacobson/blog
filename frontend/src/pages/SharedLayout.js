import React,{ useEffect, useContext } from "react";
import { Outlet, useLocation} from "react-router-dom";
import NavigationBar from "../components/NavigationBar";
import Footer from "../components/Footer";
import Container from "react-bootstrap/Container";
import "./Home.css";
import { useAnalytics } from "../utils/analytics";
import { AuthContext } from "../contexts/AuthContext";

function SharedLayout() {
    const location = useLocation();
    const { currentUser } = useContext(AuthContext);
    const { trackPageView } = useAnalytics();
    // Track page views when location changes, but include currentUser in dependencies
    useEffect(() => {
        // Only track pageviews if currentUser has been loaded (could be null for logged out users)
        if (currentUser !== undefined) {
            trackPageView();
        }
    }, [location, trackPageView, currentUser]);
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
