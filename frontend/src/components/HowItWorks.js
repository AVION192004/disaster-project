import React from "react";
import "./HowItWorks.css";

function HowItWorks() {
  return (
    <section className="how-it-works">
      <h2>How It Works</h2>

      <div className="steps">
        <div className="step">
          <span>1</span>
          <h4>Image Upload</h4>
          <p>User uploads a disaster-affected image.</p>
        </div>

        <div className="step">
          <span>2</span>
          <h4>Damage Segmentation</h4>
          <p>
            Attention U-Net segments damaged regions from the image.
          </p>
        </div>

        <div className="step">
          <span>3</span>
          <h4>Severity Classification</h4>
          <p>
            FCNN classifies damage into severity levels.
          </p>
        </div>

        <div className="step">
          <span>4</span>
          <h4>Resource Estimation</h4>
          <p>
            System predicts required emergency resources.
          </p>
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
