// src/components/Navbar.tsx
import React, { useState, useEffect } from "react";
import { Navbar, Nav, Button, Container } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { signOut } from "firebase/auth";
import { getAuth } from "firebase/auth";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import "./NavBar.css";

const CustomNavbar: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const auth = getAuth();
  const [search, setSearch] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);

  // Fetch user role when currentUser changes
  useEffect(() => {
    const fetchUserRole = async () => {
      if (currentUser) {
        try {
          const userQuery = query(collection(db, 'users'), where('email', '==', currentUser.email));
          const userSnapshot = await getDocs(userQuery);
          if (!userSnapshot.empty) {
            const userData = userSnapshot.docs[0].data();
            setUserRole(userData.role);
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
        }
      } else {
        setUserRole(null);
      }
    };

    fetchUserRole();
  }, [currentUser]);

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
    console.log('NavBar search submitted:', search.trim());
    if (search.trim()) {
      navigate(`/jobs?keywords=${encodeURIComponent(search.trim())}`);
      setSearch("");
    }
  };

  const handleNavClick = (path: string) => {
    console.log('NavBar navigation clicked:', path);
    navigate(path);
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
            <Nav.Link onClick={() => handleNavClick('/')} className="mx-2" style={{ cursor: 'pointer' }}>Home</Nav.Link>
            <Nav.Link onClick={() => handleNavClick('/jobs')} className="mx-2" style={{ cursor: 'pointer' }}>Job Listings</Nav.Link>
            <Nav.Link onClick={() => handleNavClick('/post-job')} className="mx-2" style={{ cursor: 'pointer' }}>Post a Job</Nav.Link>
            <Nav.Link onClick={() => handleNavClick('/about')} className="mx-2" style={{ cursor: 'pointer' }}>About us</Nav.Link>
            <Nav.Link onClick={() => handleNavClick('/contact')} className="mx-2" style={{ cursor: 'pointer' }}>Contact</Nav.Link>
            {currentUser ? (
              <>
                <Nav.Link 
                  onClick={() => handleNavClick(userRole === 'admin' ? '/admin' : '/employer-dashboard')}
                  className="mx-2"
                  style={{ cursor: 'pointer' }}
                >
                  Dashboard
                </Nav.Link>
                <Button variant="outline-danger" onClick={handleLogout} className="ms-3 px-4">Logout</Button>
              </>
            ) : (
              <Button variant="warning" onClick={() => handleNavClick('/auth')} className="ms-3 px-4">Log In</Button>
            )}
          </Nav>
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default CustomNavbar;
