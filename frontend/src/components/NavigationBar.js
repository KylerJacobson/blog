import React, { useState } from "react";
import "./NavigationBar.css";
import { Link, useNavigate } from "react-router-dom";
import { Navbar, Nav, Container, Button } from "react-bootstrap";

function NavigationBar() {
    const [loggedIn, setLoggedIn] = useState(false);

    const navigate = useNavigate();

    function handleClick() {
        setLoggedIn(!loggedIn);
        navigate("/createAccount");
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
                        <Button variant="outline-primary" onClick={handleClick}>
                            Log In
                        </Button>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}

export default NavigationBar;
