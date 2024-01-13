import React, { useContext } from "react";
import "./NavigationBar.css";
import { Link, useNavigate } from "react-router-dom";
import { Navbar, Nav, Container, Button } from "react-bootstrap";
import { AuthContext } from "../contexts/AuthContext";
import axios from "axios";
import { ROLE } from "../constants/roleConstants";
import linkedInIcon from "../assets/svg/linkedin-svgrepo-com.svg";
import githubIcon from "../assets/svg/github-142-svgrepo-com.svg";
import emailIcon from "../assets/svg/email-svgrepo-com.svg";

function NavigationBar() {
    const { currentUser, setCurrentUser } = useContext(AuthContext);

    const navigate = useNavigate();

    async function handleClick() {
        if (currentUser) {
            try {
                await axios.delete("/api/session", {
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
                        {currentUser && (
                            <Nav.Link as={Link} to={"/manageAccount"}>
                                My Account
                            </Nav.Link>
                        )}
                        {currentUser?.role === ROLE.ADMIN && (
                            <Nav.Link as={Link} to={"/createPost"}>
                                Create Posts
                            </Nav.Link>
                        )}
                        {currentUser?.role === ROLE.ADMIN && (
                            <Nav.Link as={Link} to={"/adminPanel"}>
                                Admin
                            </Nav.Link>
                        )}
                    </Nav>
                    <a href="https://www.linkedin.com/in/kylerjacobson/">
                        <img
                            src={linkedInIcon}
                            width="35"
                            height="35"
                            alt="LinkedIn icon"
                        />
                    </a>
                    <a href="https://github.com/KylerJacobson">
                        <img
                            src={githubIcon}
                            width="35"
                            height="35"
                            alt="Github icon"
                        />
                    </a>
                    <a href="mailto:contact@kylerjacobson.dev">
                        <img
                            src={emailIcon}
                            width="40"
                            height="40"
                            alt="email icon"
                        />
                    </a>
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
