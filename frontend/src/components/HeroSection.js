import React from 'react';
import './HeroSection.css';

const HeroSection = () => {
  return (
    <div className="hero-container">
      {/* Hero Section */}
      <section className="hero-main-section">
        <div className="hero-content-wrapper">
          <div className="ai-powered-badge">
            <svg 
              className="badge-icon" 
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span>AI-Powered Disaster Response</span>
          </div>
          
          <h1 className="hero-main-title">
            Empowering Communities Through{' '}
            <span className="hero-title-highlight">
              Effective Disaster Response
            </span>
          </h1>
          
          <p className="hero-main-description">
            At Rescuevision, we harness cutting-edge technology to assess disaster
            damage swiftly and accurately. Join us in making a difference by
            utilizing our platform to ensure timely resource allocation.
          </p>
          
          <div className="hero-action-buttons">
            <button className="btn btn-get-started">Get Started</button>
            <button className="btn btn-learn-more">Learn More</button>
          </div>
        </div>
        
        {/* Feature Cards Grid */}
        <div className="feature-cards-grid">
          <FeatureCard
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            }
            title="Real-time Tracking"
            description="Track disaster locations and rescue operations in real-time"
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
            title="Resource Allocation"
            description="Smart allocation of rescue resources based on severity"
          />
          
          <FeatureCard
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            }
            title="AI Assessment"
            description="AI-powered damage assessment from satellite imagery"
          />
          
          <FeatureCard
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            }
            title="Officer Network"
            description="Coordinate with rescue officers across regions"
          />
        </div>
      </section>
      
      {/* Statistics Section */}
      <section className="statistics-section">
        <StatCard number="500+" label="Disasters Managed" />
        <StatCard number="10K+" label="Lives Protected" />
        <StatCard number="50+" label="Rescue Teams" />
      </section>
    </div>
  );
};

// Feature Card Component
const FeatureCard = ({ icon, title, description }) => {
  return (
    <div className="feature-card-item">
      <div className="feature-card-icon">{icon}</div>
      <h3 className="feature-card-title">{title}</h3>
      <p className="feature-card-description">{description}</p>
    </div>
  );
};

// Statistics Card Component
const StatCard = ({ number, label }) => {
  return (
    <div className="stat-card-item">
      <h2 className="stat-card-number">{number}</h2>
      <p className="stat-card-label">{label}</p>
    </div>
  );
};

export default HeroSection;