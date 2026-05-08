import React from 'react';
import { motion } from 'framer-motion';
import './Features.css';

const featureItems = [
  {
    id: 1,
    icon: '🛰️',
    tag: 'AI Core',
    title: 'EfficientNet-B0 Classification',
    description: 'Ground-level image classification into No Damage, Major Damage, or Destroyed using a transfer-learned EfficientNet-B0 model trained on 4,373 real disaster images.'
  },
  {
    id: 2,
    icon: '🤖',
    tag: 'Reinforcement Learning',
    title: 'DQN Resource Allocation',
    description: 'A Deep Q-Network agent optimally dispatches personnel, vehicles, and equipment by cross-referencing damage severity with available inventory in real time.'
  },
  {
    id: 3,
    icon: '📡',
    tag: 'Real-Time',
    title: 'Live Incident Tracking',
    description: 'WebSocket-powered live feed of incoming disaster reports, status changes, and officer updates — all visible on an interactive map with custom severity markers.'
  },
  {
    id: 4,
    icon: '🗺️',
    tag: 'Geospatial',
    title: 'Shelter Finder & Routing',
    description: 'Haversine-based nearest-shelter calculation with Leaflet map integration, geocoding, and turn-by-turn routing to guide displaced civilians to safety.'
  },
  {
    id: 5,
    icon: '💬',
    tag: 'AI Assistant',
    title: 'Relief Bot (Groq LLaMA)',
    description: 'A context-aware AI chatbot powered by Groq LLaMA-3.3-70B providing emergency guidance, mental health support, and location-aware shelter recommendations.'
  },
  {
    id: 6,
    icon: '🚨',
    tag: 'Alerting',
    title: 'Multi-Channel Alerts',
    description: 'Instant Telegram push notifications and in-app broadcast alerts inform all active officers the moment a new disaster is reported or a status changes.'
  },
  {
    id: 7,
    icon: '🔐',
    tag: 'Security',
    title: 'JWT Officer Authentication',
    description: 'Role-based access control with JWT tokens, bcrypt password hashing, and a dedicated officer registration / login flow to keep the command interface secure.'
  },
  {
    id: 8,
    icon: '📊',
    tag: 'Analytics',
    title: 'Command Dashboard & Exports',
    description: 'A full officer command dashboard with severity trends, resolution rate analytics, advanced filtering, and one-click CSV / JSON report exports.'
  },
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