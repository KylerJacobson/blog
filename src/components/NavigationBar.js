import React, { useState } from "react";
import "./NavigationBar.css";
import { Link } from "react-router-dom";
import { Navbar, Nav, Container, Button } from "react-bootstrap";

function NavigationBar() {
    const [loggedIn, setLoggedIn] = useState(false);

    function handleClick() {
        setLoggedIn(!loggedIn);
    }

    return (
        <Navbar expand="lg" className="bg-body-tertiary">
            <Container>
                <Navbar.Brand href="/">kylerjacobson.dev</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse className="justify-content-end">
                    <Nav className="me-auto">
                        <Nav.Link as={Link} to={"/"}>
                            Home
                        </Nav.Link>
                        <Nav.Link as={Link} to={"/about"}>
                            About
                        </Nav.Link>
                    </Nav>
                    <Nav className="justify-content-end">
                        <Nav.Link as={Link} to={"/createAccount"}>
                            {loggedIn ? "Logged in" : "Please Log in"}{" "}
                        </Nav.Link>
                        <Button variant="outline-primary" onClick={handleClick}>
                            Login
                        </Button>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}

export default NavigationBar;
