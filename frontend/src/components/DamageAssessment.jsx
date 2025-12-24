import React, { useState } from 'react';
import { Upload, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import './DamageAssessment.css';

export default function DamageAssessment() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [disasterType, setDisasterType] = useState('');
  const [location, setLocation] = useState('');
  const [isAssessing, setIsAssessing] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
      setResult(null);
    } else {
      alert('Please upload a JPG or PNG image');
    }
  };

  const assessDamage = async () => {
    if (!selectedFile || !disasterType || !location) {
      alert('Please fill in all fields and upload an image');
      return;
    }

    setIsAssessing(true);
    
    // TODO: Replace with your actual API call
    // const formData = new FormData();
    // formData.append('image', selectedFile);
    // formData.append('disasterType', disasterType);
    // formData.append('location', location);
    // const response = await fetch('/api/assess-damage', {
    //   method: 'POST',
    //   body: formData
    // });
    // const data = await response.json();
    
    // Simulate API call
    setTimeout(() => {
      const mockResults = {
        severity: ['Minor', 'Moderate', 'Severe', 'Critical'][Math.floor(Math.random() * 4)],
        damagePercentage: Math.floor(Math.random() * 100),
        affectedArea: Math.floor(Math.random() * 5000) + 500,
        resources: {
          personnel: Math.floor(Math.random() * 50) + 10,
          vehicles: Math.floor(Math.random() * 10) + 2,
          estimatedCost: Math.floor(Math.random() * 500000) + 50000
        }
      };
      
      setResult(mockResults);
      setIsAssessing(false);
    }, 3000);
  };

  const getSeverityColor = (severity) => {
    const colors = {
      'Minor': 'severity-minor',
      'Moderate': 'severity-moderate',
      'Severe': 'severity-severe',
      'Critical': 'severity-critical'
    };
    return colors[severity] || '';
  };

  return (
    <div className="damage-assessment-container">
      <div className="assessment-content">
        <h1 className="assessment-title">Post-Disaster Damage Assessment</h1>
        <p className="assessment-subtitle">
          Upload an image (JPG, PNG) to assess the severity of damage using AI-powered analysis.
        </p>

        {/* Input Section */}
        <div className="input-section">
          <div className="input-grid">
            <div className="input-group">
              <label className="input-label">Disaster Type</label>
              <select
                value={disasterType}
                onChange={(e) => setDisasterType(e.target.value)}
                className="input-select"
              >
                <option value="">Select Disaster Type</option>
                <option value="flood">Flood</option>
                <option value="earthquake">Earthquake</option>
                <option value="fire">Fire</option>
                <option value="hurricane">Hurricane</option>
                <option value="tornado">Tornado</option>
                <option value="landslide">Landslide</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Location (Area / City)</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter location"
                className="input-text"
              />
            </div>
          </div>

          {/* File Upload */}
          <div className="upload-section">
            <label className="input-label">Upload Damage Image</label>
            <input
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleFileChange}
              className="file-input"
              id="fileInput"
            />
            <label htmlFor="fileInput" className="upload-area">
              <div className="upload-content">
                <Upload className="upload-icon" size={32} />
                <p className="upload-text">
                  {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
                </p>
                <p className="upload-subtext">JPG, PNG (Max 10MB)</p>
              </div>
            </label>
          </div>

          {/* Image Preview */}
          {previewUrl && (
            <div className="preview-section">
              <label className="input-label">Preview</label>
              <img src={previewUrl} alt="Preview" className="preview-image" />
            </div>
          )}

          {/* Assess Button */}
          <button
            onClick={assessDamage}
            disabled={isAssessing}
            className="assess-button"
          >
            {isAssessing ? (
              <>
                <Loader className="button-icon animate-spin" size={20} />
                Analyzing Damage...
              </>
            ) : (
              'Assess Damage'
            )}
          </button>
        </div>

        {/* Results Section */}
        {result && (
          <div className="results-section">
            <div className="results-header">
              <CheckCircle className="success-icon" size={32} />
              <h2 className="results-title">Assessment Complete</h2>
            </div>

            <div className="metrics-grid">
              <div className="metric-card">
                <h3 className="metric-label">Severity Level</h3>
                <p className={`metric-value ${getSeverityColor(result.severity)}`}>
                  {result.severity}
                </p>
              </div>

              <div className="metric-card">
                <h3 className="metric-label">Damage Percentage</h3>
                <p className="metric-value metric-primary">{result.damagePercentage}%</p>
              </div>

              <div className="metric-card">
                <h3 className="metric-label">Affected Area</h3>
                <p className="metric-value metric-info">{result.affectedArea.toLocaleString()} m²</p>
              </div>

              <div className="metric-card">
                <h3 className="metric-label">Estimated Cost</h3>
                <p className="metric-value metric-warning">
                  ${result.resources.estimatedCost.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="resources-section">
              <h3 className="resources-title">Required Resources</h3>
              <div className="resources-grid">
                <div className="resource-item">
                  <p className="resource-label">Personnel</p>
                  <p className="resource-value">{result.resources.personnel}</p>
                </div>
                <div className="resource-item">
                  <p className="resource-label">Emergency Vehicles</p>
                  <p className="resource-value">{result.resources.vehicles}</p>
                </div>
                <div className="resource-item">
                  <p className="resource-label">Priority</p>
                  <p className="resource-value priority-high">
                    {result.severity === 'Critical' || result.severity === 'Severe' ? 'HIGH' : 'MEDIUM'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}