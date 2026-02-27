import React from 'react';
import './Features.css';

const featureItems = [
  {
    id: 'damage-assessment',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    tag: 'AI-Powered',
    title: 'Damage Assessment',
    description:
      'Satellite imagery analysis quantifies damage severity and affected area extent within minutes of a reported incident.',
  },
  {
    id: 'smart-allocation',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
    ),
    tag: 'DQN Engine',
    title: 'Smart Allocation',
    description:
      'Deep Q-Network routing optimises distribution of rescue personnel, vehicles, and supplies based on real-time severity scores.',
  },
  {
    id: 'realtime-mapping',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    ),
    tag: 'Live',
    title: 'Real-time Mapping',
    description:
      'Interactive geospatial layers display incident zones, severity gradients, and active rescue operations updated every 30 seconds.',
  },
  {
    id: 'officer-coordination',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    tag: 'Multi-Agency',
    title: 'Officer Coordination',
    description:
      'Unified command view enables seamless communication between field officers, dispatch, and agency leadership across jurisdictions.',
  },
  {
    id: 'analytics-dashboard',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M3 3v18h18"/>
        <path d="m19 9-5 5-4-4-3 3"/>
      </svg>
    ),
    tag: 'Reporting',
    title: 'Analytics Dashboard',
    description:
      'Track response times, resource utilisation rates, and incident resolution metrics with exportable reports for compliance audits.',
  },
  {
    id: 'instant-alerts',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    ),
    tag: 'Push Alerts',
    title: 'Instant Alerts',
    description:
      'Geo-fenced push notifications route to the nearest available officers automatically when new incidents are confirmed.',
  },
];

const Features = () => {
  return (
    <section className="features-section" aria-labelledby="features-heading">
      <div className="features-inner">

        {/* Section header */}
        <header className="features-header">
          <span className="features-eyebrow">Platform Capabilities</span>
          <h2 id="features-heading" className="features-title">
            Comprehensive{' '}
            <span className="features-title__accent">Disaster Management</span>
          </h2>
          <p className="features-subtitle">
            AI-powered analysis, real-time coordination, and multi-agency tooling —
            designed to the operational standards of government emergency response.
          </p>
        </header>

        {/* Features grid */}
        <div className="features-grid" role="list">
          {featureItems.map(({ id, icon, tag, title, description }) => (
            <FeatureCard
              key={id}
              icon={icon}
              tag={tag}
              title={title}
              description={description}
            />
          ))}
        </div>

        {/* Bottom compliance strip */}
        <div className="features-compliance" aria-label="Compliance certifications">
          <ComplianceBadge label="SOC 2 Type II" />
          <span className="features-compliance__divider" aria-hidden="true" />
          <ComplianceBadge label="FedRAMP Ready" />
          <span className="features-compliance__divider" aria-hidden="true" />
          <ComplianceBadge label="GDPR Compliant" />
          <span className="features-compliance__divider" aria-hidden="true" />
          <ComplianceBadge label="256-bit Encryption" />
          <span className="features-compliance__divider" aria-hidden="true" />
          <ComplianceBadge label="99.9% Uptime SLA" />
        </div>

      </div>
    </section>
  );
};

/* ── Sub-components ───────────────────────────────────────── */

const FeatureCard = ({ icon, tag, title, description }) => (
  <article className="feat-card" role="listitem">
    <div className="feat-card__header">
      <div className="feat-card__icon" aria-hidden="true">{icon}</div>
      <span className="feat-card__tag">{tag}</span>
    </div>
    <h3 className="feat-card__title">{title}</h3>
    <p className="feat-card__description">{description}</p>
  </article>
);

const ComplianceBadge = ({ label }) => (
  <span className="compliance-badge">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
    {label}
  </span>
);

export default Features;