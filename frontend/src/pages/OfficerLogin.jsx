import React, { useState, useEffect, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { Float, Stars, OrbitControls } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, Mail, Lock, LogIn, ArrowLeft, 
  CheckCircle2, AlertTriangle, Loader, Info
} from 'lucide-react';
import './Auth.css';

// Animated background sphere for Security/Auth
function AuthSphere() {
  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh>
        <sphereGeometry args={[3, 50, 50]} />
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

const OfficerLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking');

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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (backendStatus === 'offline') {
      setError('❌ Secure tunnel offline. Activate backend server.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/officer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('officer_token', data.token);
        localStorage.setItem('officer_data', JSON.stringify(data.officer));
        navigate('/officer/dashboard');
      } else {
        setError(data.error || 'Identity verification failed.');
      }
    } catch {
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
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="auth3d__header">
          <ShieldAlert size={48} color="#3b82f6" style={{ marginBottom: '1.5rem' }} />
          <span className="auth3d__brand">RescueVision Terminal</span>
          <h1 className="auth3d__title">Officer Login</h1>
          <p className="auth3d__subtitle">Secure authorization module</p>
        </div>

        {/* Status Indicator */}
        <div className={`auth3d__status ${backendStatus === 'online' ? 'auth3d__status--online' : 'auth3d__status--offline'}`}>
          {backendStatus === 'checking' && <><Loader size={14} className="report3d__spinner" /> Syncing Protocol...</>}
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
          <div className="auth3d__field">
            <label className="auth3d__label">Officer ID (Email)</label>
            <div className="auth3d__input-group">
              <Mail className="auth3d__input-icon" size={20} />
              <input 
                type="email" 
                name="email"
                className="auth3d__input"
                placeholder="id_officer@rescue.com"
                value={formData.email}
                onChange={handleChange}
                required 
              />
            </div>
          </div>

          <div className="auth3d__field">
            <label className="auth3d__label">Access Code (Password)</label>
            <div className="auth3d__input-group">
              <Lock className="auth3d__input-icon" size={20} />
              <input 
                type="password" 
                name="password"
                className="auth3d__input"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required 
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="auth3d__submit"
            disabled={loading || backendStatus === 'offline'}
          >
            {loading ? <Loader className="report3d__spinner" size={24} /> : <LogIn size={24} />}
            {loading ? 'VERIFYING...' : 'AUTHORIZE ACCESS'}
          </button>
        </form>

        <p className="auth3d__footer">
          Unauthorized Access is Monitored.{' '}
          <span 
            className="auth3d__link"
            onClick={() => navigate('/officer/register')}
          >
            Register Terminal
          </span>
        </p>

        {/* Demo Login Information */}
        <div className="auth3d__demo">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#3b82f6' }}>
            <Info size={16} /> <strong>Module Simulation</strong>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0, lineHeight: 1.5 }}>
            ID: officer1@rescue.com<br />
            PASS: rescue123
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default OfficerLogin;