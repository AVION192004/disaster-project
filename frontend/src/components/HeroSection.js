import React from 'react';
import './HeroSection.css';

const HeroSection = () => {
  return (
    <div className="hero-container">

      {/* ── Hero Main ─────────────────────────────────────── */}
      <section className="hero-main-section" aria-labelledby="hero-heading">
        <div className="hero-layout">

          {/* Left column — copy */}
          <div className="hero-copy">

            <div className="hero-badge" aria-label="Platform type">
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

            <h1 id="hero-heading" className="hero-title">
              Empowering Communities Through{' '}
              <span className="hero-title__accent">Effective Disaster Response</span>
            </h1>

            <p className="hero-description">
              RescueVision harnesses satellite imagery, AI triage, and real-time
              coordination to assess disaster damage swiftly and allocate resources
              where they matter most.
            </p>

            <div className="hero-actions">
              <button className="hero-btn hero-btn--primary" type="button">
                Get Started
              </button>
              <button className="hero-btn hero-btn--secondary" type="button">
                Learn More
              </button>
            </div>

            {/* Trust line */}
            <p className="hero-trust">
              Trusted by emergency management agencies across&nbsp;
              <strong>12&nbsp;states</strong>
            </p>

          </div>

          {/* Right column — dashboard preview panel */}
          <div className="hero-panel" aria-label="Platform dashboard preview">
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
                  description="Smart dispatch based on severity scoring"
                  metric="87% efficiency"
                />
                <PanelCard
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                    </svg>
                  }
                  title="AI Assessment"
                  description="Damage scoring from satellite imagery"
                  metric="±4.2% accuracy"
                />
                <PanelCard
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                  }
                  title="Officer Network"
                  description="Coordinate rescue officers across regions"
                  metric="312 officers online"
                />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Statistics Bar ────────────────────────────────── */}
      <section className="stats-bar" aria-label="Platform statistics">
        <div className="stats-bar__inner">
          <StatItem number="500+" label="Disasters Managed" />
          <span className="stats-bar__divider" aria-hidden="true" />
          <StatItem number="10,000+" label="Lives Protected" />
          <span className="stats-bar__divider" aria-hidden="true" />
          <StatItem number="50+" label="Rescue Teams" />
          <span className="stats-bar__divider" aria-hidden="true" />
          <StatItem number="99.9%" label="Platform Uptime" />
        </div>
      </section>

    </div>
  );
};

/* ── Sub-components ───────────────────────────────────────── */

const StatusPill = ({ color, label }) => (
  <span className={`status-pill status-pill--${color}`}>
    <span className="status-pill__dot" aria-hidden="true" />
    {label}
  </span>
);

const PanelCard = ({ icon, title, description, metric }) => (
  <div className="panel-card">
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
    <span className="stat-item__number">{number}</span>
    <span className="stat-item__label">{label}</span>
  </div>
);

export default HeroSection;