import React from 'react';
import HeroSection from './HeroSection';
import Features from './Features';
import HowItWorks from './HowItWorks';

/**
 * Home3D — The 3D-enhanced home page.
 * Composes the existing HeroSection (which already includes ThreeScene),
 * Features, and HowItWorks sections into a single route component.
 */
const Home3D = () => {
  return (
    <div style={{ backgroundColor: '#0D1117', minHeight: '100vh' }}>
      <HeroSection />
      <Features />
      <HowItWorks />
    </div>
  );
};

export default Home3D;
