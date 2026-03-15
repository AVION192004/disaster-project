import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

const OfficerLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [retryCount, setRetryCount] = useState(0);

  // Check if backend is running
  useEffect(() => {
    checkBackendHealth();
  }, []);

  const checkBackendHealth = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/health', {
        method: 'GET',
        timeout: 5000
      });
      if (response.ok) {
        setBackendStatus('online');
        setError('');
      } else {
        setBackendStatus('offline');
      }
    } catch (err) {
      setBackendStatus('offline');
      if (retryCount < 2) {
        // Retry twice with 3-second delay
        setTimeout(() => {
          setRetryCount(retryCount + 1);
          checkBackendHealth();
        }, 3000);
      }
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (backendStatus === 'offline') {
      setError('❌ Backend server is not running. Please start the backend with: python backend/api.py');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/officer/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('officer_token', data.token);
        localStorage.setItem('officer_data', JSON.stringify(data.officer));
        navigate('/officer/dashboard');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('❌ Network error. Backend is not running on http://localhost:5000\n\nPlease run: python backend/api.py');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← Back
        </button>

        <h1 className="brand-name">Rescuevision</h1>
        <h2 className="auth-title">Officer Login</h2>
        <p className="auth-subtitle">Welcome back! 👋 Login to get started!</p>

        {/* Backend Status Indicator */}
        <div style={{
          padding: '10px',
          marginBottom: '15px',
          borderRadius: '5px',
          backgroundColor: backendStatus === 'online' ? '#d4edda' : '#f8d7da',
          color: backendStatus === 'online' ? '#155724' : '#721c24',
          textAlign: 'center',
          fontSize: '14px'
        }}>
          {backendStatus === 'checking' && '⏳ Checking backend...'}
          {backendStatus === 'online' && '✅ Backend is online'}
          {backendStatus === 'offline' && '❌ Backend is offline - Start with: python backend/api.py'}
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email*</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label>Password*</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Min. 8 characters"
              required
            />
          </div>

          <div className="forgot-password">
            <span onClick={() => alert('Contact admin to reset password')}>
              Forgot Password?
            </span>
          </div>

          <button 
            type="submit" 
            className="submit-btn" 
            disabled={loading || backendStatus === 'offline'}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <p className="auth-footer">
            Not registered yet?{' '}
            <span onClick={() => navigate('/officer/register')} className="link">
              Create an Account
            </span>
          </p>
        </form>

        <div className="demo-credentials">
          <p>
            <strong>Demo Login:</strong>
          </p>
          <p>Email: officer1@rescue.com</p>
          <p>Password: rescue123</p>
        </div>
      </div>
    </div>
  );
};

export default OfficerLogin;