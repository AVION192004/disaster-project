import React from "react";
import "./HowItWorks.css";

const steps = [
  {
    id: 1,
    tag: "Ingestion",
    title: "Image Upload",
    description:
      "Field officers upload ground-level or smartphone imagery of the affected area directly through the platform for immediate AI analysis.",
    detail: "Supports JPEG, PNG, WEBP — up to 10 MB",
  },
  {
    id: 2,
    tag: "Classification",
    title: "AI Damage Classification",
    description:
      "An EfficientNet-B0 deep learning model classifies the uploaded image into one of three damage levels — No Damage, Major Damage, or Destroyed — using transfer learning trained on real disaster imagery.",
    detail: "Avg. processing time: under 2 seconds",
  },
  {
    id: 3,
    tag: "Assessment",
    title: "Confidence Scoring",
    description:
      "The model returns a confidence percentage alongside the predicted damage label, giving officers a clear measure of prediction reliability before acting on the result.",
    detail: "98%+ validation accuracy on test dataset",
  },
  {
    id: 4,
    tag: "Dispatch",
    title: "Resource Allocation",
    description:
      "The DQN-based allocation engine cross-references the damage severity with available inventory to generate a ranked dispatch recommendation for personnel, vehicles, and supplies.",
    detail: "Recommendations generated in under 2 seconds",
  },
];

function HowItWorks() {
  return (
    <section className="hiw-section" aria-labelledby="hiw-heading">
      <div className="hiw-inner">

        {/* Header */}
        <header className="hiw-header">
          <span className="hiw-eyebrow">Operational Workflow</span>
          <h2 id="hiw-heading" className="hiw-title">
            How It <span className="hiw-title__accent">Works</span>
          </h2>
          <p className="hiw-subtitle">
            From image upload to field dispatch — the entire assessment
            pipeline runs in under 15 seconds.
          </p>
        </header>

        {/* Steps */}
        <ol className="hiw-steps" aria-label="Process steps">
          {steps.map(({ id, tag, title, description, detail }, index) => (
            <li key={id} className="hiw-step">

              {/* Connector line (not rendered on last step) */}
              {index < steps.length - 1 && (
                <span className="hiw-step__connector" aria-hidden="true" />
              )}

              {/* Step number */}
              <div className="hiw-step__number" aria-label={`Step ${id}`}>
                <span aria-hidden="true">{id}</span>
              </div>

              {/* Content */}
              <div className="hiw-step__content">
                <span className="hiw-step__tag">{tag}</span>
                <h3 className="hiw-step__title">{title}</h3>
                <p className="hiw-step__description">{description}</p>
                <span className="hiw-step__detail">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {detail}
                </span>
              </div>

            </li>
          ))}
        </ol>

        {/* Bottom CTA strip */}
        <div className="hiw-cta-strip">
          <p className="hiw-cta-strip__text">
            Ready to see the pipeline in action?
          </p>
          <a href="/damage-assessment">
            <button className="hiw-cta-btn" type="button">
              Try Damage Assessment
            </button>
          </a>
        </div>

      </div>
    </section>
  );
}

export default HowItWorks;