import React, { useState } from 'react';
import './ReportDisaster.css';

const ReportDisaster = () => {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: '',
    severity: 'Medium',
    reporter_name: '',
    reporter_phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/disaster/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`✅ Disaster reported successfully! Report ID: ${data.report_id}`);
        setFormData({
          name: '',
          location: '',
          description: '',
          severity: 'Medium',
          reporter_name: '',
          reporter_phone: ''
        });
        setTimeout(() => setMessage(''), 5000);
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (err) {
      console.error('Report error:', err);
      setMessage('❌ Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="report-disaster">
      <div className="report-container">
        <h2>🚨 Report a Disaster</h2>
        <p className="report-subtitle">Help us respond faster by reporting disasters in your area</p>

        {message && (
          <div className={`report-message ${message.includes('✅') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="report-form">
          <div className="form-row">
            <div className="form-group">
              <label>Disaster Type*</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Flood, Earthquake, Landslide"
                required
              />
            </div>

            <div className="form-group">
              <label>Location*</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., Kottayam, Kerala"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the situation..."
              rows="4"
            ></textarea>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Severity Level*</label>
              <select
                name="severity"
                value={formData.severity}
                onChange={handleChange}
                required
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div className="form-group">
              <label>Your Name</label>
              <input
                type="text"
                name="reporter_name"
                value={formData.reporter_name}
                onChange={handleChange}
                placeholder="Your name (optional)"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Your Phone Number</label>
            <input
              type="tel"
              name="reporter_phone"
              value={formData.reporter_phone}
              onChange={handleChange}
              placeholder="Your phone number (optional)"
            />
          </div>

          <button type="submit" className="report-btn" disabled={loading}>
            {loading ? 'Reporting...' : '🚨 Report Disaster'}
          </button>
        </form>
      </div>
    </section>
  );
};

export default ReportDisaster;