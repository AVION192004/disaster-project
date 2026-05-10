import React, { useState, useEffect, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { Float, Stars, OrbitControls } from '@react-three/drei';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, Mail, Lock, User, Phone, MapPin, 
  Building2, Navigation, ArrowLeft, Loader, 
  CheckCircle2, AlertTriangle, UserPlus
} from 'lucide-react';
import './Auth.css';

// Animated background sphere for Security/Auth (Matches Login)
function AuthSphere() {
  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh>
        <sphereGeometry args={[3, 50, 50]} />
        <meshStandardMaterial
          color="#10b981" // Green theme for registration/new accounts
          wireframe
          transparent
          opacity={0.1}
        />
      </mesh>
    </Float>
  );
}

const OfficerRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    office_name: '',
    latitude: '',
    longitude: '',
    address: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    checkBackendHealth();
  }, []);

  const checkBackendHealth = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/health');
      if (response.ok) {
        setBackendStatus('online');
      } else {
        setBackendStatus('offline');
      }
    } catch {
      setBackendStatus('offline');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData({
          ...formData,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6)
        });
        setIsLocating(false);
      },
      (error) => {
        alert('Unable to get your location. Please enter manually.');
        setIsLocating(false);
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (backendStatus === 'offline') {
      setError('❌ Connection failed. Secure terminal offline.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/officer/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        // Show success and redirect
        alert('✅ Registration successful! Access permissions granted.');
        navigate('/officer/login');
      } else {
        setError(data.error || 'Protocol violation: Registration failed.');
      }
    } catch (err) {
      setError('❌ Comms failure. Check network connectivity.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth3d">
      
      {/* 3D Scene Layer */}
      <div className="auth3d__canvas">
        <Canvas camera={{ position: [0, 0, 8] }}>
          <Suspense fallback={null}>
            <ambientLight intensity={1} />
            <Stars radius={100} depth={50} count={3000} factor={4} />
            <AuthSphere />
            <OrbitControls enableZoom={false} />
          </Suspense>
        </Canvas>
      </div>

      {/* Back Navigation */}
      <motion.button 
        className="auth3d__back" 
        onClick={() => navigate('/')}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <ArrowLeft size={18} />
        <span>Exit Terminal</span>
      </motion.button>

      {/* Main Auth Module */}
      <motion.div 
        className="auth3d__card"
        style={{ maxWidth: '600px' }} // Wider for registration fields
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="auth3d__header">
          <ShieldCheck size={48} color="#10b981" style={{ marginBottom: '1.5rem' }} />
          <span className="auth3d__brand">RescueVision Network</span>
          <h1 className="auth3d__title">Register Officer</h1>
          <p className="auth3d__subtitle">New personnel authorization</p>
        </div>

        {/* Status Indicator */}
        <div className={`auth3d__status ${backendStatus === 'online' ? 'auth3d__status--online' : 'auth3d__status--offline'}`}>
          {backendStatus === 'checking' && <><Loader size={14} className="report3d__spinner" /> Initializing Sync...</>}
          {backendStatus === 'online' && <><CheckCircle2 size={14} /> Encryption Online</>}
          {backendStatus === 'offline' && <><AlertTriangle size={14} /> Terminal Offline</>}
        </div>

        {error && (
          <motion.div 
            style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '16px', color: '#fca5a5', fontSize: '0.85rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem' }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <AlertTriangle size={18} />
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="auth3d__form">
          {/* Two Column Layout for Profile Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="auth3d__field">
              <label className="auth3d__label">Full Name</label>
              <div className="auth3d__input-group">
                <User className="auth3d__input-icon" size={20} />
                <input 
                  type="text" 
                  name="name"
                  className="auth3d__input"
                  placeholder="Officer Name"
                  value={formData.name}
                  onChange={handleChange}
                  required 
                />
              </div>
            </div>

            <div className="auth3d__field">
              <label className="auth3d__label">Email Address</label>
              <div className="auth3d__input-group">
                <Mail className="auth3d__input-icon" size={20} />
                <input 
                  type="email" 
                  name="email"
                  className="auth3d__input"
                  placeholder="officer@rescue.com"
                  value={formData.email}
                  onChange={handleChange}
                  required 
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="auth3d__field">
              <label className="auth3d__label">Access Code (Password)</label>
              <div className="auth3d__input-group">
                <Lock className="auth3d__input-icon" size={20} />
                <input 
                  type="password" 
                  name="password"
                  className="auth3d__input"
                  placeholder="Min. 8 characters"
                  value={formData.password}
                  onChange={handleChange}
                  minLength="8"
                  required 
                />
              </div>
            </div>

            <div className="auth3d__field">
              <label className="auth3d__label">Direct Phone</label>
              <div className="auth3d__input-group">
                <Phone className="auth3d__input-icon" size={20} />
                <input 
                  type="tel" 
                  name="phone"
                  className="auth3d__input"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={handleChange}
                  required 
                />
              </div>
            </div>
          </div>

          <div className="auth3d__field">
            <label className="auth3d__label">Assigned Office / Station</label>
            <div className="auth3d__input-group">
              <Building2 className="auth3d__input-icon" size={20} />
              <input 
                type="text" 
                name="office_name"
                className="auth3d__input"
                placeholder="e.g., Central Disaster Response Hub"
                value={formData.office_name}
                onChange={handleChange}
                required 
              />
            </div>
          </div>

          <div className="auth3d__field">
            <label className="auth3d__label">Geographic Coordinates (GPS)</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.75rem', alignItems: 'center' }}>
              <div className="auth3d__input-group">
                <Navigation className="auth3d__input-icon" size={18} />
                <input 
                  type="number" 
                  step="any"
                  name="latitude"
                  className="auth3d__input"
                  placeholder="Lat"
                  value={formData.latitude}
                  onChange={handleChange}
                  required 
                />
              </div>
              <div className="auth3d__input-group">
                <Navigation className="auth3d__input-icon" size={18} />
                <input 
                  type="number" 
                  step="any"
                  name="longitude"
                  className="auth3d__input"
                  placeholder="Lon"
                  value={formData.longitude}
                  onChange={handleChange}
                  required 
                />
              </div>
              <button 
                type="button" 
                onClick={getCurrentLocation}
                style={{ 
                  background: 'rgba(59, 130, 246, 0.1)', 
                  border: '1px solid #3b82f6', 
                  borderRadius: '12px', 
                  padding: '12px',
                  color: '#3b82f6',
                  cursor: 'pointer'
                }}
                disabled={isLocating}
              >
                {isLocating ? <Loader size={18} className="report3d__spinner" /> : <MapPin size={18} />}
              </button>
            </div>
          </div>

          <div className="auth3d__field">
            <label className="auth3d__label">Full Postal Address</label>
            <textarea 
              name="address"
              className="auth3d__input"
              style={{ minHeight: '80px', resize: 'none', paddingLeft: '1rem' }}
              placeholder="Enter station mailing address"
              value={formData.address}
              onChange={handleChange}
              required 
            />
          </div>

          <button 
            type="submit" 
            className="auth3d__submit"
            style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)' }}
            disabled={loading || backendStatus === 'offline'}
          >
            {loading ? <Loader className="report3d__spinner" size={24} /> : <UserPlus size={24} />}
            {loading ? 'REGISTERING...' : 'REGISTER TERMINAL'}
          </button>
        </form>

        <p className="auth3d__footer">
          Already authorized?{' '}
          <span 
            className="auth3d__link"
            style={{ color: '#10b981' }}
            onClick={() => navigate('/officer/login')}
          >
            Login Here
          </span>
        </p>
      </motion.div>
    </div>
  );
};

export default OfficerRegister;