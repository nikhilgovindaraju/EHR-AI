import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  const location = useLocation();
  const isAuthPage = location.pathname === "/";

  return (
    <nav className="navbar navbar-expand-lg custom-navbar px-4">
      <div className="container-fluid d-flex align-items-center justify-content-between">
        <div className="navbar-brand d-flex align-items-center">
          <img src="/images/EHR-logo.png" alt="logo" className="ehr-logo" />
          <span className="navbar-title">SecureEHR</span>
        </div>

        {!isAuthPage && (
          <div className="navbar-nav ms-auto d-flex flex-row gap-3">
            <Link to="/logs" className="nav-link">Logs</Link>
            <Link to="/add" className="nav-link">Add</Link>
            <Link to="/modify" className="nav-link">Modify</Link>
            <Link to="/" className="nav-link text-danger">Logout</Link>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
