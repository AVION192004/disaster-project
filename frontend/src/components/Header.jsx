import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Shield, AlertTriangle, Bell, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  
  { to: '/officer/dashboard', label: 'Dashboard'        },
];

export default function Header() {
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const isActive = (path) => location.pathname === path;

  return (
    <header className={`hdr${scrolled ? ' hdr--scrolled' : ''}`}>
      <div className="hdr__inner">

        {/* Logo */}
        <motion.div 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link to="/" className="hdr__logo" aria-label="RescueVision Home">
            <div className="hdr__logo-icon">
              <img src="/logo.png" alt="RescueVision Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <span className="hdr__logo-text text-glow">RescueVision</span>
          </Link>
        </motion.div>

        {/* Desktop Nav */}
        <nav className="hdr__nav" aria-label="Primary navigation">
          <ul className="hdr__nav-list" role="list">
            {navItems.map(({ to, label }) => (
              <li key={to}>
                <motion.div whileHover={{ y: -2 }} whileTap={{ y: 0 }}>
                  <Link
                    to={to}
                    className={`hdr__nav-link${isActive(to) ? ' hdr__nav-link--active' : ''}`}
                  >
                    {label}
                  </Link>
                </motion.div>
              </li>
            ))}
          </ul>
        </nav>

        {/* Actions */}
        <div className="hdr__actions">
          <NotificationBell />

          <Link to="/sos" className="hdr__sos btn-3d" aria-label="Emergency SOS" style={{ animation: 'none' }}>
            <AlertTriangle size={14} />
            SOS
          </Link>

          <Link to="/officer/login" className="hdr__btn hdr__btn--ghost glass">
            Sign In
          </Link>
          <Link to="/officer/register" className="hdr__btn hdr__btn--primary btn-3d">
            Sign Up
          </Link>
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
      <AnimatePresence>
        {menuOpen && (
          <motion.div 
            className="hdr__mobile-menu glass" 
            role="dialog" 
            aria-label="Mobile navigation"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
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
              </ul>
              <div className="hdr__mobile-actions">
                <Link to="/sos" className="hdr__sos hdr__sos--full btn-3d">
                  <AlertTriangle size={14} /> 🆘 SOS Emergency
                </Link>
                <Link to="/officer/login"    className="hdr__btn hdr__btn--ghost hdr__btn--full glass">Sign In</Link>
                <Link to="/officer/register" className="hdr__btn hdr__btn--primary hdr__btn--full btn-3d">Sign Up</Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}