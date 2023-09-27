import React, { useContext } from "react";
import "./NavigationBar.css";
import { Link, useNavigate } from "react-router-dom";
import { Navbar, Nav, Container, Button } from "react-bootstrap";
import { AuthContext } from "../contexts/AuthContext";
import axios from "axios";

function NavigationBar() {
    const { currentUser, setCurrentUser } = useContext(AuthContext);

    const navigate = useNavigate();

    async function handleClick() {
        if (currentUser) {
            try {
                await axios.post("/api/logout", {
                    withCredentials: true,
                });
                setCurrentUser(null);
                navigate("/");
            } catch (error) {
                console.error("Error during logout:", error);
            }
        } else {
            navigate("/createAccount");
        }
    }

    return (
        <Navbar expand="lg" className="bg-body-tertiary">
            <Container>
                <Navbar.Brand as={Link} to={"/"}>
                    kylerjacobson.dev
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse className="justify-content-end">
                    <Nav className="me-auto">
                        <Nav.Link as={Link} to={"/"}>
                            Home
                        </Nav.Link>
                        <Nav.Link as={Link} to={"/about"}>
                            About
                        </Nav.Link>
                        {currentUser?.role === 1 && (
                            <Nav.Link as={Link} to={"/createPost"}>
                                Create Posts
                            </Nav.Link>
                        )}
                    </Nav>

                    <Nav className="justify-content-end">
                        {!currentUser && (
                            <Button
                                variant="outline-primary"
                                onClick={handleClick}
                            >
                                Log In
                            </Button>
                        )}
                        {currentUser && (
                            <Button
                                variant="outline-danger"
                                onClick={handleClick}
                            >
                                Log out
                            </Button>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}

export default NavigationBar;
