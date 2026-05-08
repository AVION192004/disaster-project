import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, AlertTriangle } from 'lucide-react';
import './Header.css';
import NotificationBell from './NotificationBell';

const navItems = [
  { to: '/',                  label: 'Home'             },
  { to: '/report-disaster',   label: 'Report Disaster'  },
  { to: '/damage-assessment', label: 'Damage Assessment'},
  { to: '/features',          label: 'Features'         },
  { to: '/first-aid',         label: 'First Aid'        },
  { to: '/shelters',          label: 'Shelters'         },
  { to: '/disaster-news',     label: 'Disaster News'    },
  { to: '/relief-bot',        label: 'Relief Bot'       },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const location = useLocation();

  const isLoggedIn = !!localStorage.getItem('token');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  useEffect(() => {
    const saved = localStorage.getItem('site-theme');
    const dark = saved ? saved === 'dark'
      : !window.matchMedia('(prefers-color-scheme: light)').matches;
    setIsDark(dark);
  }, []);

  const isActive = (path) => location.pathname === path;

  const handleSignOut = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    const root = document.getElementById('root') || document.body;
    if (next) {
      root.style.filter = '';
      root.classList.remove('lm');
    } else {
      root.style.filter = 'invert(1) hue-rotate(180deg)';
      root.classList.add('lm');
    }
    localStorage.setItem('site-theme', next ? 'dark' : 'light');
  };

  return (
    <header className={`hdr${scrolled ? ' hdr--scrolled' : ''}`}>
      <div className="hdr__inner">

        {/* Logo */}
        <Link to="/" className="hdr__logo" aria-label="RescueVision Home">
          <div className="hdr__logo-icon">
            <img src="/logo.png" alt="RescueVision Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <span className="hdr__logo-text">RescueVision</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hdr__nav" aria-label="Primary navigation">
          <ul className="hdr__nav-list" role="list">
            {navItems.map(({ to, label }) => (
              <li key={to}>
                <Link
                  to={to}
                  className={`hdr__nav-link${isActive(to) ? ' hdr__nav-link--active' : ''}`}
                >
                  {label}
                </Link>
              </li>
            ))}
            {isLoggedIn && (
              <li>
                <Link
                  to="/officer/dashboard"
                  className={`hdr__nav-link${isActive('/officer/dashboard') ? ' hdr__nav-link--active' : ''}`}
                >
                  Dashboard
                </Link>
              </li>
            )}
          </ul>
        </nav>

        {/* Actions */}
        <div className="hdr__actions">
          <NotificationBell />

          <Link to="/sos" className="hdr__sos" aria-label="Emergency SOS">
            <AlertTriangle size={14} />
            SOS
          </Link>

          {isLoggedIn ? (
            <button className="hdr__btn hdr__btn--ghost" onClick={handleSignOut}>
              Sign Out
            </button>
          ) : (
            <>
              <Link to="/officer/login" className="hdr__btn hdr__btn--ghost">Sign In</Link>
              <Link to="/officer/register" className="hdr__btn hdr__btn--primary">Sign Up</Link>
            </>
          )}
        </div>

        {/* Hamburger */}
        <button
          className="hdr__hamburger"
          onClick={() => setMenuOpen(prev => !prev)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="hdr__mobile-menu" role="dialog" aria-label="Mobile navigation">
          <nav>
            <ul className="hdr__mobile-list" role="list">
              {navItems.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className={`hdr__mobile-link${isActive(to) ? ' hdr__mobile-link--active' : ''}`}
                  >
                    {label}
                  </Link>
                </li>
              ))}
              {isLoggedIn && (
                <li>
                  <Link
                    to="/officer/dashboard"
                    className={`hdr__mobile-link${isActive('/officer/dashboard') ? ' hdr__mobile-link--active' : ''}`}
                  >
                    Dashboard
                  </Link>
                </li>
              )}
            </ul>
            <div className="hdr__mobile-actions">
              <Link to="/sos" className="hdr__sos hdr__sos--full">
                <AlertTriangle size={14} /> 🆘 SOS Emergency
              </Link>

              {/* Theme Toggle inside mobile menu */}
              <button
                onClick={toggleTheme}
                className="hdr__btn hdr__btn--ghost hdr__btn--full"
                style={{ gap: '8px' }}
              >
                <span style={{ fontSize: '16px' }}>{isDark ? '☀️' : '🌙'}</span>
                {isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              </button>

              {isLoggedIn ? (
                <button className="hdr__btn hdr__btn--ghost hdr__btn--full" onClick={handleSignOut}>
                  Sign Out
                </button>
              ) : (
                <>
                  <Link to="/officer/login" className="hdr__btn hdr__btn--ghost hdr__btn--full">Sign In</Link>
                  <Link to="/officer/register" className="hdr__btn hdr__btn--primary hdr__btn--full">Sign Up</Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}