import React from 'react';
import { Link } from 'react-router-dom'; // Import Link for navigation
import './Header.css';

function Header() {
  return (
    <header className="header">
      <div className="logo">Rescueplex.</div>
      <nav className="nav-links">
        <Link to="/" className="nav-link">Home</Link> {/* Home route */}
        <Link to="/features" className="nav-link">Features</Link> {/* Features route */}
        <Link to="/dashboard" className="nav-link">Dashboard</Link> {/* Placeholder for Dashboard */}
      </nav>
      <Link to="/signup">
        <button className="sign-up">Sign Up</button> {/* Sign Up button navigates to /signup */}
      </Link>
    </header>
  );
}

export default Header;
