// src/components/Navbar.tsx
import React, { useState } from "react";
import { Navbar, Nav, Button, Container } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { signOut } from "firebase/auth";
import { getAuth } from "firebase/auth";
import "./NavBar.css";

const CustomNavbar: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const auth = getAuth();
  const [search, setSearch] = useState("");

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/jobs?keywords=${encodeURIComponent(search.trim())}`);
      setSearch("");
    }
  };

  return (
    <Navbar
      expand="lg"
      className="py-3 shadow-sm custom-navbar"
      style={{ position: "sticky", top: 0, zIndex: 5000, background: "rgba(255,0,0,0.2)" }}
    >
      <Container>
        <Navbar.Brand as={Link} to="/" className="fw-bold">
          <span style={{ color: "orangered" }}>Autum</span>
          <span style={{ color: "darkgreen" }}>hire</span>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="navbar-nav" />
        <Navbar.Collapse id="navbar-nav">
          <div className="d-flex align-items-center w-100">
            <form className="d-flex me-3 flex-grow-1" onSubmit={handleSearchSubmit} style={{ maxWidth: 250 }}>
              <input
                className="form-control me-2"
                type="search"
                placeholder="Search jobs..."
                aria-label="Search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ minWidth: 0 }}
              />
              <Button variant="outline-success" type="submit">Search</Button>
            </form>
          <Nav className="ms-auto align-items-center">
            <Nav.Link as={Link} to="/" className="mx-2">Home</Nav.Link>
            <Nav.Link as={Link} to="/jobs" className="mx-2">Job Listings</Nav.Link>
            <Nav.Link as={Link} to="/post-job" className="mx-2">Post a Job</Nav.Link>
            <Nav.Link as={Link} to="/about" className="mx-2">About us</Nav.Link>
            <Nav.Link as={Link} to="/contact" className="mx-2">Contact</Nav.Link>
            {currentUser ? (
              <>
                <Nav.Link as={Link} to="/employer-dashboard" className="mx-2">Dashboard</Nav.Link>
                <Button variant="outline-danger" onClick={handleLogout} className="ms-3 px-4">Logout</Button>
              </>
            ) : (
              <Link to="/login" className="text-decoration-none">
                <Button variant="warning" className="ms-3 px-4">Log In</Button>
              </Link>
            )}
          </Nav>
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default CustomNavbar;
