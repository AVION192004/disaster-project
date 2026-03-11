import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';
import NotificationBell from './NotificationBell'; // ✅ Added

function Header() {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { to: '/',                   label: 'Home'              },
    { to: '/report-disaster',    label: 'Report Disaster'   },
    { to: '/damage-assessment',  label: 'Damage Assessment' },
    { to: '/features',           label: 'Features'          },
    { to: '/first-aid',          label: 'First Aid'         },
    { to: '/shelters',           label: 'Shelters'          },
    { to: '/disaster-news', label: 'Disaster News' },
    { to: '/officer/dashboard',  label: 'Dashboard'         }
  ];

  return (
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

          {/* ✅ Notification Bell — added before SOS */}
          <NotificationBell />

          <Link
            to="/sos"
            className="btn btn--emergency header__action-link--sos"
            aria-label="Emergency SOS"
          >
            🆘 SOS
          </Link>

          

          <Link to="/officer/login" className="header__action-link">
            <button className="btn btn--ghost" type="button">
              Sign In
            </button>
          </Link>

          <Link to="/officer/register" className="header__action-link">
            <button className="btn btn--primary" type="button">
              Sign Up
            </button>
          </Link>
        

        </div>

      </div>
    </header>
  );
}

export default Header;