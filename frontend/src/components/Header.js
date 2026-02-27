import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

function Header() {
  return (
    <header className="header">
      <div className="logo">
        <Link to="/" className="logo-link">RescueVision.</Link>
      </div>
      <nav className="nav-links">
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/report-disaster" className="nav-link">Report Disaster</Link> {/* ADD THIS */}
        <Link to="/features" className="nav-link">Features</Link>
        <Link to="/first-aid" className="nav-link">First Aid</Link>
        <Link to="/dashboard" className="nav-link">Dashboard</Link>
      </nav>
      <div className="header-actions">
        <Link to="/officer/login" className="sign-in-link">
          <button className="sign-in">Sign In</button>
        </Link>
        <Link to="/officer/register" className="sign-up-link">
          <button className="sign-up">Sign Up</button>
        </Link>
      </div>
    </header>
  );
}

export default Header;