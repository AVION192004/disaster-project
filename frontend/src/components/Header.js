import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';

function Header() {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { to: '/', label: 'Home' },
    { to: '/features', label: 'Features' },
    { to: '/first-aid', label: 'First Aid' },
    { to: '/dashboard', label: 'Dashboard' },
  ];

  return (
<<<<<<< HEAD
    <header className={`header${scrolled ? ' header--scrolled' : ''}`}>
      <div className="header__inner">

        {/* Logo */}
        <div className="header__logo">
          <Link to="/" className="header__logo-link" aria-label="RescueVision Home">
            <span className="header__logo-mark">RV</span>
            <span className="header__logo-text">RescueVision</span>
          </Link>
        </div>

        {/* Primary Navigation */}
        <nav className="header__nav" aria-label="Primary navigation">
          <ul className="header__nav-list" role="list">
            {navItems.map(({ to, label }) => (
              <li key={to} className="header__nav-item">
                <Link
                  to={to}
                  className={`header__nav-link${location.pathname === to ? ' header__nav-link--active' : ''}`}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Auth Actions */}
        <div className="header__actions">
          <Link to="/officer/login" className="header__action-link" aria-label="Sign in to your account">
            <button className="btn btn--ghost" type="button">Sign In</button>
          </Link>
          <Link to="/officer/register" className="header__action-link" aria-label="Create a new account">
            <button className="btn btn--primary" type="button">Sign Up</button>
          </Link>
        </div>

=======
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
>>>>>>> 8ed909f5ac1fced7537fb562c4e1559febc8345c
      </div>
    </header>
  );
}

export default Header;