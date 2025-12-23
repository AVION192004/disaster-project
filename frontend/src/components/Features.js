import React from "react";
import "./Features.css";
import { FaCameraRetro, FaTools } from "react-icons/fa"; // Icons for features

function Features() {
  return (
    <section className="features">
      <div className="features-heading">
        <h2>Features of Rescueplex</h2>
        <p>
          Explore the key functionalities of Rescueplex that empower disaster
          response and recovery with advanced technology.
        </p>
      </div>
      <div className="features-container">
        <div className="feature-card">
          <div className="feature-icon">
            <FaCameraRetro />
          </div>
          <h3>Post-Disaster Damage Assessment</h3>
          <p>
            Upload post-disaster images, and our AI-powered Attention U-Net
            model analyzes the severity of the damage to assist in recovery
            planning.
          </p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">
            <FaTools />
          </div>
          <h3>Resource Allocation</h3>
          <p>
            Allocate the necessary resources based on the damage severity to
            accelerate building recovery and reconstruction efforts.
          </p>
        </div>
      </div>
    </section>
  );
}

export default Features;
