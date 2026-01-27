import React from 'react';
import './Features.css';

const Features = () => {
  return (
    <section className="features-section-container">
      <div className="features-content-wrapper">
        {/* Section Header */}
        <div className="features-header">
          <h2 className="features-main-title">
            Comprehensive <span className="features-title-highlight">Disaster Management</span>
          </h2>
          <p className="features-main-description">
            Our platform combines AI-powered analysis with real-time coordination to help communities
            respond to disasters effectively.
          </p>
        </div>

        {/* Features Grid */}
        <div className="features-grid-container">
          <FeatureCard
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            }
            title="Damage Assessment"
            description="AI-powered image analysis to assess damage severity and affected areas instantly."
          />

          <FeatureCard
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            }
            title="Smart Allocation"
            description="DQN-based resource allocation ensures optimal distribution of rescue resources."
          />

          <FeatureCard
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            }
            title="Real-time Mapping"
            description="Interactive maps showing disaster locations, severity, and rescue operations."
          />

          <FeatureCard
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            }
            title="Officer Coordination"
            description="Seamless coordination between rescue officers with real-time notifications."
          />

          <FeatureCard
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3v18h18"/>
                <path d="m19 9-5 5-4-4-3 3"/>
              </svg>
            }
            title="Analytics Dashboard"
            description="Comprehensive analytics to track response times and resource utilization."
          />

          <FeatureCard
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            }
            title="Instant Alerts"
            description="Push notifications to officers based on proximity to disaster locations."
          />
        </div>
      </div>
    </section>
  );
};

// Feature Card Component
const FeatureCard = ({ icon, title, description }) => {
  return (
    <div className="feature-detail-card">
      <div className="feature-detail-icon-wrapper">
        <div className="feature-detail-icon">{icon}</div>
      </div>
      <h3 className="feature-detail-title">{title}</h3>
      <p className="feature-detail-description">{description}</p>
    </div>
  );
};

export default Features;