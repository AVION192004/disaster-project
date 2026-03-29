import React from 'react';
import { motion } from 'framer-motion';
import './Features.css';

const featureItems = [
  // ... (keep featureItems as is)
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
  },
};

const Features = () => {
  return (
    <section className="features-section" aria-labelledby="features-heading">
      <div className="features-inner">

        {/* Section header */}
        <motion.header 
          className="features-header"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="features-eyebrow">Platform Capabilities</span>
          <h2 id="features-heading" className="features-title">
            Comprehensive{' '}
            <span className="features-title__accent text-glow">Disaster Management</span>
          </h2>
          <p className="features-subtitle">
            AI-powered analysis, real-time coordination, and multi-agency tooling —
            designed to the operational standards of government emergency response.
          </p>
        </motion.header>

        {/* Features grid */}
        <motion.div 
          className="features-grid" 
          role="list"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {featureItems.map(({ id, icon, tag, title, description }) => (
            <FeatureCard
              key={id}
              icon={icon}
              tag={tag}
              title={title}
              description={description}
            />
          ))}
        </motion.div>

        {/* Bottom compliance strip */}
        <motion.div 
          className="features-compliance glass" 
          aria-label="Compliance certifications"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <ComplianceBadge label="Secure Authentication" />
          <span className="features-compliance__divider" aria-hidden="true" />
          <ComplianceBadge label="Encrypted Data Transmission (HTTPS)" />
          <span className="features-compliance__divider" aria-hidden="true" />
          <ComplianceBadge label="Role-Based Access Control" />
          <span className="features-compliance__divider" aria-hidden="true" />
          <ComplianceBadge label="Cloud Deployment Ready" />
          <span className="features-compliance__divider" aria-hidden="true" />
          <ComplianceBadge label="AI-Powered Decision Support" />
        </motion.div>

      </div>
    </section>
  );
};

/* ── Sub-components ───────────────────────────────────────── */

const FeatureCard = ({ icon, tag, title, description }) => (
  <motion.article 
    className="feat-card glass-card tilt-3d" 
    role="listitem"
    variants={itemVariants}
    whileHover={{ y: -10, rotateX: 5, rotateY: 5, transition: { duration: 0.2 } }}
  >
    <div className="feat-card__header">
      <div className="feat-card__icon text-glow" aria-hidden="true">{icon}</div>
      <span className="feat-card__tag glass">{tag}</span>
    </div>
    <h3 className="feat-card__title">{title}</h3>
    <p className="feat-card__description">{description}</p>
  </motion.article>
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