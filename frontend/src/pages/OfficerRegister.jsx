import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

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
      const response = await fetch('http://localhost:5000/api/officer/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        alert('Registration successful! Please login.');
        navigate('/officer/login');
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString()
          });
        },
        (error) => {
          alert('Unable to get your location');
        }
      );
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← Back
        </button>
        
        <h1 className="brand-name">Rescueplex</h1>
        <h2 className="auth-title">Officer Registration</h2>
        <p className="auth-subtitle">Join our rescue team! 🚒 Register to get started</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Full Name*</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
            />
          </div>

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
              minLength="8"
              required
            />
          </div>

          <div className="form-group">
            <label>Phone Number*</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter phone number"
              required
            />
          </div>

          <div className="form-group">
            <label>Office Name*</label>
            <input
              type="text"
              name="office_name"
              value={formData.office_name}
              onChange={handleChange}
              placeholder="e.g., Central Rescue Station"
              required
            />
          </div>

          <div className="form-group">
            <label>Office Address*</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter office address"
              rows="2"
              required
            />
          </div>

          <div className="location-group">
            <div className="form-group">
              <label>Latitude*</label>
              <input
                type="number"
                step="any"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                placeholder="9.5916"
                required
              />
            </div>

            <div className="form-group">
              <label>Longitude*</label>
              <input
                type="number"
                step="any"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                placeholder="76.5222"
                required
              />
            </div>
          </div>

          <button
            type="button"
            onClick={getCurrentLocation}
            className="location-btn"
          >
            📍 Use Current Location
          </button>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>

          <p className="auth-footer">
            Already have an account?{' '}
            <span onClick={() => navigate('/officer/login')} className="link">
              Login here
            </span>
          </p>
        </form>
      </div>
    </div>
  );
};

export default OfficerRegister;