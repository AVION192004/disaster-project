// Save this as: frontend/src/pages/AdminDisaster.jsx

import React, { useState } from 'react';
import './AdminPanel.css';

const AdminDisaster = () => {
  const [formData, setFormData] = useState({
    disaster_type: '',
    severity: 'medium',
    latitude: '',
    longitude: '',
    location_name: '',
    description: '',
    image_url: '',
    damage_assessment: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const disasterTypes = [
    'Earthquake',
    'Flood',
    'Cyclone',
    'Tsunami',
    'Landslide',
    'Fire',
    'Hurricane',
    'Tornado',
    'Drought',
    'Volcanic Eruption',
    'Other'
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
          setMessage({ type: 'error', text: 'Unable to get your location' });
        }
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('http://localhost:5000/api/disaster/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          source: 'manual'
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: `✅ Disaster alert created! ${data.notified_officers_count} officers notified.`
        });
        
        // Reset form
        setFormData({
          disaster_type: '',
          severity: 'medium',
          latitude: '',
          longitude: '',
          location_name: '',
          description: '',
          image_url: '',
          damage_assessment: ''
        });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create alert' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleNewsSubmit = async () => {
    const newsData = {
      title: prompt('Enter news title:'),
      description: prompt('Enter news description:'),
      disaster_type: formData.disaster_type,
      location: formData.location_name,
      source: 'Admin'
    };

    if (!newsData.title) return;

    try {
      const response = await fetch('http://localhost:5000/api/news/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newsData)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: '✅ News added successfully!' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to add news' });
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-card">
        <h1 className="admin-title">🚨 Create Disaster Alert</h1>
        <p className="admin-subtitle">
          Manually report a disaster to notify nearby rescue officers
        </p>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-row">
            <div className="form-group">
              <label>Disaster Type*</label>
              <select
                name="disaster_type"
                value={formData.disaster_type}
                onChange={handleChange}
                required
              >
                <option value="">Select disaster type</option>
                {disasterTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Severity*</label>
              <select
                name="severity"
                value={formData.severity}
                onChange={handleChange}
                required
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Location Name*</label>
            <input
              type="text"
              name="location_name"
              value={formData.location_name}
              onChange={handleChange}
              placeholder="e.g., Kottayam, Kerala"
              required
            />
          </div>

          <div className="form-row">
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

          <div className="form-group">
            <label>Description*</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the disaster situation..."
              rows="4"
              required
            />
          </div>

          <div className="form-group">
            <label>Image URL (optional)</label>
            <input
              type="url"
              name="image_url"
              value={formData.image_url}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="form-group">
            <label>Damage Assessment (optional)</label>
            <textarea
              name="damage_assessment"
              value={formData.damage_assessment}
              onChange={handleChange}
              placeholder="Details about damage severity, affected areas, casualties, etc."
              rows="3"
            />
          </div>

          <div className="button-group">
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? '🔄 Creating Alert...' : '🚨 Create Disaster Alert'}
            </button>

            <button
              type="button"
              onClick={handleNewsSubmit}
              className="news-btn"
            >
              📰 Add to News Feed
            </button>
          </div>
        </form>

        <div className="info-box">
          <h3>ℹ️ How it works:</h3>
          <ul>
            <li>Officers within 100km radius will be notified</li>
            <li>Notifications appear in real-time on officer dashboards</li>
            <li>Officers can see distance from their location</li>
            <li>You can also add this to the news feed</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminDisaster;