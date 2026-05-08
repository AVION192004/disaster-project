import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ThreeScene from './ThreeScene';
import './HeroSection.css';

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <div className="hero-container" style={{ position: 'relative', overflow: 'hidden' }}>
      <ThreeScene />
      
      {/* ── Hero Main ─────────────────────────────────────── */}
      <section className="hero-main-section" aria-labelledby="hero-heading" style={{ position: 'relative', zIndex: 1 }}>
        <div className="hero-layout">

          {/* Left column — copy */}
          <motion.div 
            className="hero-copy"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >

            <div className="hero-badge glass" aria-label="Platform type">
              <span className="hero-badge__dot" aria-hidden="true" />
              <svg
                className="hero-badge__icon"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>AI-Powered Disaster Response</span>
            </div>

            <h1 id="hero-heading" className="hero-title text-glow">
              Empowering Communities Through{' '}
              <span className="hero-title__accent">Effective Disaster Response</span>
            </h1>

            <p className="hero-description">
              RescueVision uses ground-level image classification, AI triage, and
              real-time coordination to assess building damage swiftly and allocate
              rescue resources where they matter most.
            </p>

            <div className="hero-actions">
              <button
                className="hero-btn hero-btn--primary btn-3d"
                type="button"
                onClick={() => navigate('/damage-assessment')}
              >
                Run Assessment
              </button>
              <button
                className="hero-btn hero-btn--secondary glass"
                type="button"
                onClick={() => navigate('/features')}
              >
                Learn More
              </button>
            </div>

            {/* Trust line */}
            <p className="hero-trust">
              Built with&nbsp;<strong>EfficientNet-B0</strong>&nbsp;·&nbsp;
              <strong>98%+</strong>&nbsp;validation accuracy
            </p>

          </motion.div>

          {/* Right column — dashboard preview panel */}
          <motion.div 
            className="hero-panel glass-card tilt-3d" 
            aria-label="Platform dashboard preview"
            initial={{ opacity: 0, y: 50, rotateX: 10 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="hero-panel__topbar">
              <span className="hero-panel__dot hero-panel__dot--red" />
              <span className="hero-panel__dot hero-panel__dot--amber" />
              <span className="hero-panel__dot hero-panel__dot--green" />
              <span className="hero-panel__topbar-label">RescueVision — Live Operations</span>
            </div>

            <div className="hero-panel__body">
              {/* Status strip */}
              <div className="hero-panel__status-row">
                <StatusPill color="green" label="Systems Operational" />
                <StatusPill color="amber" label="3 Active Incidents" />
                <StatusPill color="red"   label="1 Critical Zone" />
              </div>

              {/* Feature cards inside panel */}
              <div className="hero-panel__cards">
                <PanelCard
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                  }
                  title="Real-time Tracking"
                  description="Track disaster locations and rescue operations live"
                  metric="24 zones active"
                />
                <PanelCard
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  }
                  title="Resource Allocation"
                  description="DQN-based smart dispatch by damage severity"
                  metric="3 damage levels"
                />
                <PanelCard
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                    </svg>
                  }
                  title="AI Assessment"
                  description="EfficientNet-B0 ground-level damage classification"
                  metric="98%+ accuracy"
                />
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* ── Statistics Bar ────────────────────────────────── */}
      <section className="stats-bar glass" aria-label="Platform statistics" style={{ position: 'relative', zIndex: 1 }}>
        <div className="stats-bar__inner">
          <StatItem number="3"     label="Damage Classes" />
          <span className="stats-bar__divider" aria-hidden="true" />
          <StatItem number="4,373" label="Training Images" />
          <span className="stats-bar__divider" aria-hidden="true" />
          <StatItem number="98%+"  label="Val Accuracy" />
          <span className="stats-bar__divider" aria-hidden="true" />
          <StatItem number="<2s"   label="Inference Time" />
        </div>
      </section>

    </div>
  );
};

/* ── Sub-components ───────────────────────────────────────── */

const StatusPill = ({ color, label }) => (
  <span className={`status-pill status-pill--${color} glass`}>
    <span className="status-pill__dot" aria-hidden="true" />
    {label}
  </span>
);

const PanelCard = ({ icon, title, description, metric }) => (
  <div className="panel-card glass" style={{ border: 'none', background: 'rgba(255,255,255,0.05)' }}>
    <div className="panel-card__icon">{icon}</div>
    <div className="panel-card__body">
      <h3 className="panel-card__title">{title}</h3>
      <p className="panel-card__desc">{description}</p>
    </div>
    <span className="panel-card__metric">{metric}</span>
  </div>
);

const StatItem = ({ number, label }) => (
  <div className="stat-item">
    <span className="stat-item__number text-glow">{number}</span>
    <span className="stat-item__label">{label}</span>
  </div>
);

export default HeroSection;