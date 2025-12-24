import React, { useState } from 'react';
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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      setError('Network error. Please try again.');
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

        <h1 className="brand-name">Rescueplex</h1>
        <h2 className="auth-title">Officer Login</h2>
        <p className="auth-subtitle">Welcome back! 👋 Login to get started!</p>

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

          <button type="submit" className="submit-btn" disabled={loading}>
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