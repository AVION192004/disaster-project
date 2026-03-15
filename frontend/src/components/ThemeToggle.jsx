import React, { useState, useEffect } from 'react';

function getRoot() {
  return document.getElementById('root') || document.body;
}

function injectMediaFix() {
  if (document.getElementById('__tm_fix__')) return;
  const s = document.createElement('style');
  s.id = '__tm_fix__';
  s.innerHTML = `
    #root.lm img, #root.lm video, #root.lm canvas,
    #root.lm iframe, #root.lm .leaflet-container,
    #root.lm [class*="leaflet"] {
      filter: invert(1) hue-rotate(180deg) !important;
    }
    #root { transition: filter 0.4s ease; }
  `;
  document.head.appendChild(s);
}

function applyTheme(dark) {
  const root = getRoot();
  if (dark) {
    root.style.filter = '';
    root.classList.remove('lm');
  } else {
    // saturate(4) + brightness(1.2) restores vibrancy of reds/purples/oranges
    // that get darkened by invert(1) hue-rotate(180deg)
    root.style.filter = 'invert(1) hue-rotate(180deg) saturate(4) brightness(1.2)';
    root.classList.add('lm');
  }
}

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    injectMediaFix();
    const saved = localStorage.getItem('site-theme');
    const dark = saved ? saved === 'dark'
      : !window.matchMedia('(prefers-color-scheme: light)').matches;
    setIsDark(dark);
    applyTheme(dark);
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    applyTheme(next);
    localStorage.setItem('site-theme', next ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        zIndex: 2147483647,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 18px',
        background: '#1a2236',
        border: '1px solid #3b82f6',
        borderRadius: '50px',
        color: '#e2e8f0',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: '700',
        fontFamily: 'system-ui, sans-serif',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        userSelect: 'none',
        outline: 'none',
      }}
    >
      <span style={{ fontSize: '16px' }}>{isDark ? '☀️' : '🌙'}</span>
      {isDark ? 'Light' : 'Dark'}
    </button>
  );
}
