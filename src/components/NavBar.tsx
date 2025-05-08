// src/components/Navbar.tsx
import React from "react";
import { Navbar, Nav, Button, Container } from "react-bootstrap";
import { Link } from "react-router-dom";

const CustomNavbar: React.FC = () => {
  return (
    <Navbar bg="light" expand="lg" className="py-3 shadow-sm">
      <Container>
        <Navbar.Brand as={Link} to="/" className="fw-bold">
          <span style={{ color: "orangered" }}>Autum</span>
          <span style={{ color: "darkgreen" }}>hire</span>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="navbar-nav" />
        <Navbar.Collapse id="navbar-nav">
          <Nav className="ms-auto align-items-center">
            <Nav.Link as={Link} to="/jobs" className="mx-2">Job Listings</Nav.Link>
            <Nav.Link as={Link} to="/post-job" className="mx-2">Post a Job</Nav.Link>
            <Nav.Link as={Link} to="/about" className="mx-2">About us</Nav.Link>
            <Link to="/login" className="text-decoration-none">
              <Button variant="warning" className="ms-3 px-4">Log In</Button>
            </Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default CustomNavbar;
