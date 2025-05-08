// src/components/Navbar.tsx
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg bg-white border-bottom px-4 py-2">
      <div className="container-fluid">
        <Link to="/" className="navbar-brand fw-bold">
          <span className="text-danger">Autum</span><span className="text-success">hire</span>
        </Link>
        <div className="collapse navbar-collapse justify-content-end">
          <ul className="navbar-nav">
            <li className="nav-item">
              <Link to="/jobs" className="nav-link fw-semibold">Job Listings</Link>
            </li>
            <li className="nav-item">
              <Link to="/post-job" className="nav-link fw-semibold">Post a Job</Link>
            </li>
            <li className="nav-item">
              <Link to="/about" className="nav-link fw-semibold">About us</Link>
            </li>
            <li className="nav-item">
              <Link to="/login" className="btn btn-warning fw-semibold ms-3">Log In</Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
