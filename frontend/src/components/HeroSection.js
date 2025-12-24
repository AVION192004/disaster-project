import React from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation
import './HeroSection.css';
import heroImage from '../assets/images/hero-image.jpg'; // Import the image

function HeroSection() {
  const navigate = useNavigate(); // Hook for navigation

  return (
    <section className="hero">
      <div className="hero-content">
        <h1>Empowering Communities Through Effective Disaster Response</h1>
        <p>
          At Rescueplex, we harness cutting-edge technology to assess disaster
          damage swiftly and accurately. Join us in making a difference by utilizing
          our platform to ensure timely resource allocation.
        </p>
        <div className="hero-buttons">
          <button className="get-started" onClick={() => navigate('/officer/login')}
>
            Get Started
          </button>
          <button className="learn-more" onClick={() => navigate('/features')}>
            Learn More
          </button>
        </div>
      </div>
      <div className="hero-image">
        <img src={heroImage} alt="Disaster Recovery" />
      </div>
    </section>
  );
}

export default HeroSection;
