import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Float, Stars, OrbitControls } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Droplets, Activity, Flame, Wind, Tornado, Mountain, 
  ChevronDown, CheckCircle2, ShieldAlert, Heart, ClipboardList,
  Cross, Syringe, Thermometer, User, PhoneCall, Info
} from 'lucide-react';
import './FirstAid.css';

// Animated background sphere for Guidance
function GuidanceSphere() {
  return (
    <Float speed={1.2} rotationIntensity={0.25} floatIntensity={0.25}>
      <mesh>
        <sphereGeometry args={[3.5, 64, 64]} />
        <meshStandardMaterial
          color="#3b82f6"
          wireframe
          transparent
          opacity={0.1}
        />
      </mesh>
    </Float>
  );
}

const FirstAid = () => {
  const [selectedDisaster, setSelectedDisaster] = useState('earthquake');
  const [expandedSection, setExpandedSection] = useState('during');

  const disasters = {
    earthquake: {
      icon: <Activity size={24} />,
      title: 'Earthquake Relief',
      before: [
        'Secure heavy furniture and appliances to walls',
        'Identify safe spots in each room (under sturdy tables, against interior walls)',
        'Practice earthquake drills with family members',
        'Prepare an emergency kit with supplies for at least 72 hours',
        'Know how to turn off gas, water, and electricity'
      ],
      during: [
        'Indoors: Drop, Cover, and Hold under a sturdy object. Stay away from windows.',
        'Outdoors: Move to an open area away from buildings, trees, and power lines.',
        'In a Vehicle: Stop safely away from bridges and buildings. Stay inside.'
      ],
      after: [
        'Check yourself and others for injuries',
        'Inspect your home for damage',
        'Be prepared for aftershocks',
        'Listen to local news for emergency information',
        'Use stairs instead of elevators'
      ]
    },
    flood: {
      icon: <Droplets size={24} />,
      title: 'Flood Guidance',
      before: [
        'Know your area\'s flood risk and evacuation routes',
        'Prepare an emergency kit with waterproof containers',
        'Move valuable items to higher floors',
        'Install check valves in building sewer traps',
        'Consider flood insurance for your property'
      ],
      during: [
        'Move to higher ground immediately',
        'Avoid walking or driving through flood waters',
        'If trapped in a building, go to the highest level',
        'Do not touch electrical equipment if wet',
        'Listen to emergency broadcasts'
      ],
      after: [
        'Return home only when authorities say it\'s safe',
        'Avoid floodwater as it may be contaminated',
        'Document damage with photos for insurance',
        'Clean and disinfect everything that got wet',
        'Check for structural damage before entering buildings'
      ]
    },
    hurricane: {
      icon: <Wind size={24} />,
      title: 'Hurricane Response',
      before: [
        'Know your evacuation zone and routes',
        'Stock up on non-perishable food and water',
        'Secure outdoor furniture and objects',
        'Board up windows with plywood',
        'Fill bathtub and containers with water'
      ],
      during: [
        'Stay indoors away from windows and glass doors',
        'Take refuge in a small interior room or hallway',
        'Close all interior doors and brace external doors',
        'Keep curtains and blinds closed',
        'Do not go outside during the eye of the storm'
      ],
      after: [
        'Wait for official all-clear before going outside',
        'Avoid standing water and downed power lines',
        'Use flashlights, not candles',
        'Report utility damage to authorities',
        'Take photos of damage for insurance claims'
      ]
    },
    wildfire: {
      icon: <Flame size={24} />,
      title: 'Wildfire Defense',
      before: [
        'Create a defensible space around your home',
        'Use fire-resistant materials for roof and exterior',
        'Keep gutters clean and free of debris',
        'Plan evacuation routes with multiple exits',
        'Prepare emergency supplies in your vehicle'
      ],
      during: [
        'Evacuate immediately if ordered',
        'Close all windows and doors',
        'Turn on lights to increase visibility',
        'Move combustible items away from walls',
        'If trapped, call 911 and stay in a cleared area'
      ],
      after: [
        'Return home only when authorities permit',
        'Check for hot spots and sparks',
        'Wet down debris to prevent dust',
        'Watch for ash pits and mark them',
        'Document damage for insurance'
      ]
    },
    tornado: {
      icon: <Tornado size={24} />,
      title: 'Tornado Safety',
      before: [
        'Identify a safe room (basement or interior room on lowest floor)',
        'Prepare emergency supplies in your safe room',
        'Practice tornado drills regularly',
        'Monitor weather forecasts during severe weather',
        'Know the difference between watch and warning'
      ],
      during: [
        'Go to your safe room immediately',
        'Get under a sturdy table and cover your head',
        'Stay away from windows, doors, and outside walls',
        'In a vehicle: get out and find a low-lying area',
        'Mobile home: evacuate and find shelter'
      ],
      after: [
        'Check for injuries and provide first aid',
        'Stay out of damaged buildings',
        'Watch for broken glass and downed power lines',
        'Use battery-powered lights, not candles',
        'Listen to emergency broadcasts'
      ]
    },
    tsunami: {
      icon: <Mountain size={24} />,
      title: 'Tsunami Protocol',
      before: [
        'Know if you live in a tsunami hazard zone',
        'Learn the signs of a tsunami (ground shaking, ocean receding)',
        'Plan evacuation routes to higher ground',
        'Prepare an emergency kit for quick evacuation',
        'Practice evacuation drills'
      ],
      during: [
        'If you feel strong shaking, immediately move to higher ground',
        'Do not wait for official warning',
        'Move inland and to higher ground quickly',
        'If at sea, stay there until all-clear is given',
        'Do not return to the coast for many hours'
      ],
      after: [
        'Stay away from the coast until all-clear',
        'Be aware of multiple waves',
        'Do not enter damaged buildings',
        'Avoid debris in the water',
        'Listen to authorities for instructions'
      ]
    }
  };

  const firstAidSupplies = [
    { icon: <ShieldAlert size={20} />, name: 'Bandages and gauze' },
    { icon: <Droplets size={20} />, name: 'Antiseptic wipes' },
    { icon: <ClipboardList size={20} />, name: 'Adhesive tape' },
    { icon: <Heart size={20} />, name: 'Pain relievers' },
    { icon: <ClipboardList size={20} />, name: 'Scissors and tweezers' },
    { icon: <Thermometer size={20} />, name: 'Thermometer' },
    { icon: <User size={20} />, name: 'Medical gloves' },
    { icon: <PhoneCall size={20} />, name: 'Emergency list' }
  ];

  const containers = [
    { key: 'before', label: 'Before Disaster' },
    { key: 'during', label: 'During Disaster' },
    { key: 'after', label: 'After Disaster' }
  ];

  return (
    <div className="fa3d">
      
      {/* 3D Canvas Background */}
      <div className="fa3d__canvas">
        <Canvas camera={{ position: [0, 0, 8] }}>
          <Suspense fallback={null}>
            <ambientLight intensity={1} />
            <directionalLight position={[10, 10, 10]} intensity={1} />
            <Stars radius={100} depth={50} count={5000} factor={4} />
            <GuidanceSphere />
            <OrbitControls enableZoom={false} enablePan={false} />
          </Suspense>
        </Canvas>
      </div>

      <div className="fa3d__layout">
        <motion.div 
          className="fa3d__header"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1>Emergency Guidance</h1>
        </motion.div>

        {/* Disaster Type Selector */}
        <div className="fa3d__selector">
          {Object.entries(disasters).map(([key, data]) => (
            <button
              key={key}
              className={`fa3d__btn ${selectedDisaster === key ? 'active' : ''}`}
              onClick={() => setSelectedDisaster(key)}
            >
              {data.icon}
              <span style={{textTransform: 'capitalize'}}>{key}</span>
            </button>
          ))}
        </div>

        <div className="fa3d__grid">
          
          {/* Main Instructions Card */}
          <motion.div 
            className="fa3d__main-card"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="fa3d__type-display">
              <div className="fa3d__type-icon">
                {disasters[selectedDisaster].icon}
              </div>
              <div className="fa3d__type-info">
                <h2>{disasters[selectedDisaster].title}</h2>
                <div style={{ height: '4px', width: '60px', background: '#3b82f6', borderRadius: '100px', marginTop: '0.5rem' }}></div>
              </div>
            </div>

            <div className="fa3d__accordion">
              {containers.map((section) => (
                <div key={section.key} className="fa3d__acc-item">
                  <button
                    className={`fa3d__acc-header ${expandedSection === section.key ? 'active' : ''}`}
                    onClick={() => setExpandedSection(expandedSection === section.key ? null : section.key)}
                  >
                    <span>{section.label}</span>
                    <motion.div
                      animate={{ rotate: expandedSection === section.key ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChevronDown size={24} />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {expandedSection === section.key && (
                      <motion.div
                        className="fa3d__acc-content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                      >
                        {disasters[selectedDisaster][section.key].map((item, idx) => (
                          <motion.div 
                            key={idx} 
                            className="fa3d__list-item"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                          >
                            <CheckCircle2 size={20} className="fa3d__check" />
                            <span>{item}</span>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Sidebar Supplies Card */}
          <div className="fa3d__sidebar">
            <motion.div 
              className="fa3d__side-card"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="fa3d__side-title">Recovery Essentials</h3>
              <div className="fa3d__supplies">
                {firstAidSupplies.map((supply, index) => (
                  <motion.div 
                    key={index} 
                    className="fa3d__supply-item"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div style={{ color: '#3b82f6' }}>{supply.icon}</div>
                    <span className="fa3d__supply-name">{supply.name}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div 
              className="fa3d__side-card"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px dashed rgba(59, 130, 246, 0.2)' }}
            >
              <h3 className="fa3d__side-title" style={{ color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Info size={20} /> Urgent Tip
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6 }}>
                Always prioritize your own safety before attempting to help others.
                Wait for official 'all-clear' signals from local authorities.
              </p>
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default FirstAid;