import React, { useState, useEffect } from 'react';
import { AlertTriangle, Phone, MapPin, User, Clock, Send, CheckCircle, Loader } from 'lucide-react';

export default function SOSEmergency() {
  const [sosActive, setSosActive] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [location, setLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [sosData, setSosData] = useState({
    name: '',
    phone: '',
    emergencyType: '',
    additionalInfo: ''
  });
  const [sosSubmitted, setSosSubmitted] = useState(false);
  const [sosId, setSosId] = useState(null);
  const [error, setError] = useState('');

  // Get user's current location
  const getCurrentLocation = () => {
    setLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
          setLoadingLocation(false);
        },
        (error) => {
          console.error('Location error:', error);
          setError('Unable to get your location. Please enable location services.');
          setLoadingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setError('Geolocation is not supported by your browser');
      setLoadingLocation(false);
    }
  };

  // Auto-get location on component mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Handle SOS button press (hold for 3 seconds)
  const handleSOSPress = () => {
    setCountdown(3);
  };

  const handleSOSRelease = () => {
    setCountdown(null);
  };

  // Countdown timer for SOS activation
  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      activateSOS();
      setCountdown(null);
    }
  }, [countdown]);

  const activateSOS = () => {
    setSosActive(true);
    // Play alarm sound (optional)
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIF2m98OScTgwNUajj8LJkHQU2kNbxz3krBSl+zPLaizsKFF7A6OuoVRQLRp/h8r1sIAUsgs/y2Ik2CBdqvvDjnE4MDVGn4/CyZB0FNo/W8c56KgUqfs7y2Ys7ChRevOjrp1UUC0ae4fK9bSAGLIPP8tiJNggXar3w45xODA1Rp+Pwsm');
      audio.play().catch(e => console.log('Audio play failed:', e));
    } catch (e) {
      console.log('Audio not supported');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSosData(prev => ({ ...prev, [name]: value }));
  };

  const handleSOSSubmit = async () => {
    // Validate required fields
    if (!sosData.name || !sosData.phone || !sosData.emergencyType) {
      setError('Please fill in all required fields');
      return;
    }

    if (!location) {
      setError('Location not available. Please enable location services.');
      return;
    }

    setError('');

    try {
      const response = await fetch('http://127.0.0.1:5000/api/sos/emergency', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: sosData.name,
          phone: sosData.phone,
          emergency_type: sosData.emergencyType,
          additional_info: sosData.additionalInfo,
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          timestamp: new Date().toISOString()
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSosId(data.sos_id);
        setSosSubmitted(true);
        
        // Auto-call emergency services (simulation)
        setTimeout(() => {
          alert('🚨 EMERGENCY ALERT SENT!\n\n✅ Rescue teams notified\n✅ Your location shared\n✅ Help is on the way!');
        }, 1000);
      } else {
        setError(data.error || 'Failed to send SOS');
      }
    } catch (err) {
      console.error('SOS Error:', err);
      setError('Network error. SOS alert may not have been sent.');
    }
  };

  const resetSOS = () => {
    setSosActive(false);
    setSosSubmitted(false);
    setSosId(null);
    setSosData({ name: '', phone: '', emergencyType: '', additionalInfo: '' });
    setError('');
    getCurrentLocation();
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: sosActive 
        ? 'linear-gradient(135deg, #450a0a 0%, #7f1d1d 50%, #450a0a 100%)'
        : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      color: 'white',
      fontFamily: 'Arial, sans-serif',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden'
    },
    flashingBg: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: '#dc2626',
      opacity: sosActive ? 0.3 : 0,
      animation: sosActive ? 'flash 1s infinite' : 'none',
      pointerEvents: 'none',
      zIndex: 0
    },
    content: {
      maxWidth: '800px',
      margin: '0 auto',
      position: 'relative',
      zIndex: 1
    },
    header: {
      textAlign: 'center',
      marginBottom: '2rem'
    },
    title: {
      fontSize: '3rem',
      fontWeight: 'bold',
      marginBottom: '0.5rem',
      textShadow: sosActive ? '0 0 20px #dc2626' : 'none'
    },
    subtitle: {
      fontSize: '1.2rem',
      color: '#d1d5db',
      marginBottom: '1rem'
    },
    locationBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      background: location ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
      border: location ? '1px solid #10b981' : '1px solid #ef4444',
      borderRadius: '1rem',
      padding: '0.5rem 1rem',
      fontSize: '0.875rem',
      marginTop: '1rem'
    },
    sosButtonContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      marginBottom: '3rem'
    },
    sosButton: {
      width: '200px',
      height: '200px',
      borderRadius: '50%',
      background: countdown !== null 
        ? 'linear-gradient(135deg, #dc2626, #7f1d1d)'
        : 'linear-gradient(135deg, #ef4444, #dc2626)',
      border: '8px solid white',
      boxShadow: countdown !== null 
        ? '0 0 60px rgba(220, 38, 38, 0.8), inset 0 0 40px rgba(0,0,0,0.3)'
        : '0 20px 60px rgba(220, 38, 38, 0.4), inset 0 0 20px rgba(0,0,0,0.2)',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.3s',
      transform: countdown !== null ? 'scale(1.1)' : 'scale(1)',
      animation: sosActive ? 'pulse 1s infinite' : 'none',
      userSelect: 'none'
    },
    sosButtonText: {
      fontSize: '3rem',
      fontWeight: 'bold',
      marginBottom: '0.5rem'
    },
    sosButtonSubtext: {
      fontSize: '0.875rem',
      opacity: 0.9
    },
    countdownText: {
      fontSize: '4rem',
      fontWeight: 'bold',
      color: 'white'
    },
    instruction: {
      marginTop: '1rem',
      fontSize: '1rem',
      color: '#d1d5db',
      textAlign: 'center'
    },
    formCard: {
      background: 'rgba(31, 41, 55, 0.6)',
      backdropFilter: 'blur(10px)',
      borderRadius: '1rem',
      padding: '2rem',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      marginBottom: '2rem'
    },
    alertBanner: {
      background: sosActive ? 'rgba(220, 38, 38, 0.3)' : 'rgba(239, 68, 68, 0.2)',
      border: '1px solid #ef4444',
      borderRadius: '0.5rem',
      padding: '1rem',
      marginBottom: '1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      animation: sosActive ? 'shake 0.5s infinite' : 'none'
    },
    errorBanner: {
      background: 'rgba(239, 68, 68, 0.2)',
      border: '1px solid #ef4444',
      borderRadius: '0.5rem',
      padding: '1rem',
      marginBottom: '1rem',
      color: '#fca5a5'
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '1.5rem',
      marginBottom: '1.5rem'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem'
    },
    label: {
      fontSize: '0.875rem',
      fontWeight: '600',
      color: '#e5e7eb'
    },
    required: {
      color: '#f87171'
    },
    input: {
      width: '100%',
      background: '#374151',
      border: '1px solid #4b5563',
      borderRadius: '0.5rem',
      padding: '0.75rem 1rem',
      color: 'white',
      fontSize: '1rem',
      boxSizing: 'border-box'
    },
    textarea: {
      width: '100%',
      background: '#374151',
      border: '1px solid #4b5563',
      borderRadius: '0.5rem',
      padding: '0.75rem 1rem',
      color: 'white',
      fontSize: '1rem',
      minHeight: '100px',
      resize: 'vertical',
      boxSizing: 'border-box'
    },
    emergencyTypes: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '1rem',
      marginBottom: '1.5rem'
    },
    emergencyCard: {
      background: '#374151',
      border: '2px solid transparent',
      borderRadius: '0.75rem',
      padding: '1rem',
      cursor: 'pointer',
      textAlign: 'center',
      transition: 'all 0.2s'
    },
    emergencyCardSelected: {
      background: '#dc2626',
      borderColor: '#ef4444',
      transform: 'scale(1.05)'
    },
    emergencyIcon: {
      fontSize: '2rem',
      marginBottom: '0.5rem'
    },
    emergencyLabel: {
      fontSize: '0.875rem',
      fontWeight: '600'
    },
    actionButtons: {
      display: 'flex',
      gap: '1rem',
      marginTop: '1.5rem'
    },
    submitButton: {
      flex: 1,
      background: 'linear-gradient(to right, #dc2626, #b91c1c)',
      color: 'white',
      padding: '1rem',
      borderRadius: '0.5rem',
      border: 'none',
      fontSize: '1.125rem',
      fontWeight: 'bold',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem'
    },
    cancelButton: {
      background: '#4b5563',
      color: 'white',
      padding: '1rem 2rem',
      borderRadius: '0.5rem',
      border: 'none',
      fontSize: '1.125rem',
      fontWeight: 'bold',
      cursor: 'pointer'
    },
    successModal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    },
    successCard: {
      background: 'linear-gradient(135deg, #065f46, #047857)',
      borderRadius: '1rem',
      padding: '3rem',
      textAlign: 'center',
      maxWidth: '500px',
      width: '90%',
      border: '2px solid #10b981'
    },
    successIcon: {
      margin: '0 auto 1rem'
    },
    successTitle: {
      fontSize: '2rem',
      fontWeight: 'bold',
      marginBottom: '1rem'
    },
    successMessage: {
      fontSize: '1.125rem',
      marginBottom: '1.5rem',
      lineHeight: '1.6'
    },
    sosIdBox: {
      background: 'rgba(0, 0, 0, 0.3)',
      borderRadius: '0.5rem',
      padding: '1rem',
      marginBottom: '1.5rem'
    },
    sosIdLabel: {
      fontSize: '0.875rem',
      color: '#d1fae5',
      marginBottom: '0.25rem'
    },
    sosIdValue: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: '#6ee7b7'
    },
    doneButton: {
      width: '100%',
      background: 'white',
      color: '#065f46',
      padding: '1rem',
      borderRadius: '0.5rem',
      border: 'none',
      fontSize: '1.125rem',
      fontWeight: 'bold',
      cursor: 'pointer'
    }
  };

  const emergencyTypes = [
    { id: 'medical', icon: '🏥', label: 'Medical Emergency' },
    { id: 'fire', icon: '🔥', label: 'Fire' },
    { id: 'accident', icon: '🚗', label: 'Accident' },
    { id: 'violence', icon: '⚠️', label: 'Violence/Threat' },
    { id: 'natural', icon: '🌪️', label: 'Natural Disaster' },
    { id: 'other', icon: '🆘', label: 'Other Emergency' }
  ];

  // Success Modal
  if (sosSubmitted) {
    return (
      <div style={styles.successModal}>
        <div style={styles.successCard}>
          <CheckCircle size={80} style={styles.successIcon} color="#6ee7b7" />
          <h2 style={styles.successTitle}>🚨 SOS ALERT SENT!</h2>
          <p style={styles.successMessage}>
            Your emergency alert has been received.<br />
            Rescue teams have been notified and are on their way to your location.
          </p>
          <div style={styles.sosIdBox}>
            <p style={styles.sosIdLabel}>Emergency ID</p>
            <p style={styles.sosIdValue}>SOS-{sosId}</p>
          </div>
          <div style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#d1fae5' }}>
            <p>✅ Location: {location?.latitude.toFixed(4)}, {location?.longitude.toFixed(4)}</p>
            <p>✅ Emergency services notified</p>
            <p>✅ Stay calm, help is coming</p>
          </div>
          <button onClick={resetSOS} style={styles.doneButton}>
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes flash {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.4; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
      `}</style>

      <div style={styles.flashingBg} />

      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>🆘 EMERGENCY SOS</h1>
          <p style={styles.subtitle}>
            {sosActive ? '⚠️ EMERGENCY MODE ACTIVE' : 'Get immediate help in case of emergency'}
          </p>
          
          <div style={styles.locationBadge}>
            {loadingLocation ? (
              <>
                <Loader size={16} className="spinning" />
                <span>Getting your location...</span>
              </>
            ) : location ? (
              <>
                <MapPin size={16} />
                <span>Location: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</span>
              </>
            ) : (
              <>
                <AlertTriangle size={16} />
                <span>Location unavailable</span>
              </>
            )}
          </div>
        </div>

        {!sosActive ? (
          <>
            <div style={styles.sosButtonContainer}>
              <div
                style={styles.sosButton}
                onMouseDown={handleSOSPress}
                onMouseUp={handleSOSRelease}
                onMouseLeave={handleSOSRelease}
                onTouchStart={handleSOSPress}
                onTouchEnd={handleSOSRelease}
              >
                {countdown !== null ? (
                  <div style={styles.countdownText}>{countdown}</div>
                ) : (
                  <>
                    <div style={styles.sosButtonText}>SOS</div>
                    <div style={styles.sosButtonSubtext}>HOLD FOR 3s</div>
                  </>
                )}
              </div>
              <p style={styles.instruction}>
                {countdown !== null 
                  ? '⏱️ Keep holding...' 
                  : '🔴 Press and hold the SOS button for 3 seconds to activate emergency alert'}
              </p>
            </div>

            <div style={styles.formCard}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Quick Emergency Info</h3>
              <p style={{ color: '#d1d5db', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Fill this in now so rescue teams can help you faster
              </p>

              {error && (
                <div style={styles.errorBanner}>
                  <AlertTriangle size={20} />
                  {error}
                </div>
              )}

              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Your Name <span style={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={sosData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your name"
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Phone Number <span style={styles.required}>*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={sosData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Emergency Type <span style={styles.required}>*</span>
                </label>
                <div style={styles.emergencyTypes}>
                  {emergencyTypes.map((type) => (
                    <div
                      key={type.id}
                      onClick={() => setSosData(prev => ({ ...prev, emergencyType: type.id }))}
                      style={{
                        ...styles.emergencyCard,
                        ...(sosData.emergencyType === type.id ? styles.emergencyCardSelected : {})
                      }}
                    >
                      <div style={styles.emergencyIcon}>{type.icon}</div>
                      <div style={styles.emergencyLabel}>{type.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Additional Information</label>
                <textarea
                  name="additionalInfo"
                  value={sosData.additionalInfo}
                  onChange={handleInputChange}
                  placeholder="Describe your situation, injuries, number of people affected..."
                  style={styles.textarea}
                />
              </div>
            </div>
          </>
        ) : (
          <div style={styles.formCard}>
            <div style={styles.alertBanner}>
              <AlertTriangle size={32} />
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                  🚨 EMERGENCY ACTIVATED
                </h3>
                <p>Fill in the details below and send alert to rescue teams</p>
              </div>
            </div>

            {error && (
              <div style={styles.errorBanner}>
                {error}
              </div>
            )}

            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Your Name <span style={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={sosData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your name"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Phone Number <span style={styles.required}>*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={sosData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter phone number"
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Emergency Type <span style={styles.required}>*</span>
              </label>
              <div style={styles.emergencyTypes}>
                {emergencyTypes.map((type) => (
                  <div
                    key={type.id}
                    onClick={() => setSosData(prev => ({ ...prev, emergencyType: type.id }))}
                    style={{
                      ...styles.emergencyCard,
                      ...(sosData.emergencyType === type.id ? styles.emergencyCardSelected : {})
                    }}
                  >
                    <div style={styles.emergencyIcon}>{type.icon}</div>
                    <div style={styles.emergencyLabel}>{type.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Additional Information</label>
              <textarea
                name="additionalInfo"
                value={sosData.additionalInfo}
                onChange={handleInputChange}
                placeholder="Describe your situation, injuries, number of people affected..."
                style={styles.textarea}
              />
            </div>

            <div style={styles.actionButtons}>
              <button onClick={handleSOSSubmit} style={styles.submitButton}>
                <Send size={20} />
                SEND EMERGENCY ALERT
              </button>
              <button onClick={resetSOS} style={styles.cancelButton}>
                Cancel
              </button>
            </div>
          </div>
        )}

        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid #ef4444',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          marginTop: '2rem'
        }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={20} />
            Important Information
          </h3>
          <ul style={{ color: '#d1d5db', fontSize: '0.875rem', lineHeight: '1.8', paddingLeft: '1.5rem' }}>
            <li>Hold the SOS button for 3 seconds to activate emergency mode</li>
            <li>Your exact location will be automatically shared with rescue teams</li>
            <li>Keep your phone on and charged</li>
            <li>Stay in a safe location if possible</li>
            <li>For immediate life-threatening emergencies, call 911 directly</li>
          </ul>
        </div>
      </div>
    </div>
  );
}