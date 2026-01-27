import React, { useState } from 'react';
import './FirstAid.css';

const FirstAid = () => {
  const [selectedDisaster, setSelectedDisaster] = useState('earthquake');
  const [expandedSection, setExpandedSection] = useState('during');

  const disasters = {
    earthquake: {
      icon: '🌍',
      name: 'Earthquake',
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
      icon: '🌊',
      name: 'Flood',
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
      icon: '🌀',
      name: 'Hurricane',
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
      icon: '🔥',
      name: 'Wildfire',
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
      icon: '🌪️',
      name: 'Tornado',
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
      icon: '🌊',
      name: 'Tsunami',
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
    { icon: '🩹', name: 'Bandages and gauze' },
    { icon: '🧼', name: 'Antiseptic wipes' },
    { icon: '📌', name: 'Adhesive tape' },
    { icon: '💊', name: 'Pain relievers' },
    { icon: '✂️', name: 'Scissors and tweezers' },
    { icon: '🌡️', name: 'Thermometer' },
    { icon: '🧤', name: 'Medical gloves' },
    { icon: '📱', name: 'Emergency contact list' }
  ];

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="first-aid-container">
      <div className="first-aid-content">
        {/* Disaster Selection */}
        <div className="disaster-selector">
          <h2 className="disaster-selector-title">Select Disaster Type</h2>
          <div className="disaster-buttons">
            {Object.keys(disasters).map((key) => (
              <button
                key={key}
                className={`disaster-button ${selectedDisaster === key ? 'active' : ''}`}
                onClick={() => setSelectedDisaster(key)}
              >
                <span className="disaster-icon">{disasters[key].icon}</span>
                <span className="disaster-name">{disasters[key].name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="first-aid-main">
          {/* Left Side - Disaster Instructions */}
          <div className="disaster-instructions">
            <div className="aid-header">
              <h1 className="aid-title">Aid</h1>
              <div className="aid-underline"></div>
            </div>

            <div className="disaster-type-header">
              <span className="disaster-type-icon">{disasters[selectedDisaster].icon}</span>
              <h2 className="disaster-type-name">{disasters[selectedDisaster].name}</h2>
            </div>

            <div className="accordion-sections">
              {/* Before Section */}
              <div className="accordion-item">
                <button
                  className={`accordion-header ${expandedSection === 'before' ? 'active' : ''}`}
                  onClick={() => toggleSection('before')}
                >
                  <span className="accordion-icon">
                    {expandedSection === 'before' ? '▼' : '▶'}
                  </span>
                  Before
                </button>
                {expandedSection === 'before' && (
                  <div className="accordion-content">
                    {disasters[selectedDisaster].before.map((item, index) => (
                      <div key={index} className="instruction-item">
                        <span className="check-icon">✓</span>
                        <p>{item}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* During Section */}
              <div className="accordion-item">
                <button
                  className={`accordion-header ${expandedSection === 'during' ? 'active' : ''}`}
                  onClick={() => toggleSection('during')}
                >
                  <span className="accordion-icon">
                    {expandedSection === 'during' ? '▼' : '▶'}
                  </span>
                  During
                </button>
                {expandedSection === 'during' && (
                  <div className="accordion-content">
                    {disasters[selectedDisaster].during.map((item, index) => (
                      <div key={index} className="instruction-item">
                        <span className="check-icon">✓</span>
                        <p>{item}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* After Section */}
              <div className="accordion-item">
                <button
                  className={`accordion-header ${expandedSection === 'after' ? 'active' : ''}`}
                  onClick={() => toggleSection('after')}
                >
                  <span className="accordion-icon">
                    {expandedSection === 'after' ? '▼' : '▶'}
                  </span>
                  After
                </button>
                {expandedSection === 'after' && (
                  <div className="accordion-content">
                    {disasters[selectedDisaster].after.map((item, index) => (
                      <div key={index} className="instruction-item">
                        <span className="check-icon">✓</span>
                        <p>{item}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Side - First Aid Supplies */}
          <div className="first-aid-supplies">
            <h3 className="supplies-title">Essential First Aid Supplies</h3>
            <div className="supplies-list">
              {firstAidSupplies.map((supply, index) => (
                <div key={index} className="supply-item">
                  <span className="supply-icon">{supply.icon}</span>
                  <span className="supply-name">{supply.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirstAid;