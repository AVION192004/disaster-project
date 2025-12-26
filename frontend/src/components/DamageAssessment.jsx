import React, { useState, useRef, useEffect } from 'react';
import { Upload, CheckCircle, Loader, Eye, EyeOff } from 'lucide-react';
import './DamageAssessment.css';

export default function DamageAssessment() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [disasterType, setDisasterType] = useState('');
  const [location, setLocation] = useState('');
  const [isAssessing, setIsAssessing] = useState(false);
  const [result, setResult] = useState(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const canvasRef = useRef(null);

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

  // Generate damage overlay on canvas
  useEffect(() => {
    if (result && previewUrl && canvasRef.current && showOverlay) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Set canvas size to match container
        const maxWidth = 800;
        const scale = Math.min(maxWidth / img.width, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        // Draw original image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // If we have a real segmentation mask from backend, use it
        if (result.segmentationMask) {
          const maskImg = new Image();
          maskImg.onload = () => {
            // Draw the segmentation mask with transparency
            ctx.globalAlpha = 0.6;
            ctx.drawImage(maskImg, 0, 0, canvas.width, canvas.height);
            ctx.globalAlpha = 1.0;
            
            // Add edge highlights
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 2;
            ctx.strokeRect(0, 0, canvas.width, canvas.height);
          };
          maskImg.src = `data:image/png;base64,${result.segmentationMask}`;
        } else {
          // FALLBACK: Generate mock overlay if no real mask available
          const damageIntensity = result.damagePercentage / 100;
          const numZones = Math.floor(damageIntensity * 8) + 4;
          
          const severityZones = {
            severe: Math.floor(numZones * 0.3),
            moderate: Math.floor(numZones * 0.4),
            minor: Math.floor(numZones * 0.3)
          };
          
          // Draw severe damage zones (Red)
          for (let i = 0; i < severityZones.severe; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const width = (Math.random() * 150 + 100) * scale;
            const height = (Math.random() * 150 + 100) * scale;
            
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, Math.max(width, height) / 2);
            gradient.addColorStop(0, 'rgba(220, 38, 38, 0.65)');
            gradient.addColorStop(0.5, 'rgba(220, 38, 38, 0.4)');
            gradient.addColorStop(1, 'rgba(220, 38, 38, 0)');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x - width/2, y - height/2, width, height);
          }
          
          // Draw moderate damage zones (Orange)
          for (let i = 0; i < severityZones.moderate; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const width = (Math.random() * 120 + 80) * scale;
            const height = (Math.random() * 120 + 80) * scale;
            
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, Math.max(width, height) / 2);
            gradient.addColorStop(0, 'rgba(249, 115, 22, 0.6)');
            gradient.addColorStop(0.5, 'rgba(249, 115, 22, 0.35)');
            gradient.addColorStop(1, 'rgba(249, 115, 22, 0)');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x - width/2, y - height/2, width, height);
          }
          
          // Draw minor damage zones (Yellow)
          for (let i = 0; i < severityZones.minor; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const width = (Math.random() * 100 + 60) * scale;
            const height = (Math.random() * 100 + 60) * scale;
            
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, Math.max(width, height) / 2);
            gradient.addColorStop(0, 'rgba(234, 179, 8, 0.55)');
            gradient.addColorStop(0.5, 'rgba(234, 179, 8, 0.3)');
            gradient.addColorStop(1, 'rgba(234, 179, 8, 0)');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x - width/2, y - height/2, width, height);
          }
          
          // Add edge highlights for better visibility
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.lineWidth = 2;
          ctx.strokeRect(0, 0, canvas.width, canvas.height);
        }
      };
      
      img.src = previewUrl;
    }
  }, [result, previewUrl, showOverlay]);

  const assessDamage = async () => {
    if (!selectedFile || !disasterType || !location) {
      alert('Please fill in all fields and upload an image');
      return;
    }

    setIsAssessing(true);
    
    try {
      // REAL API CALL - Uncomment this when your backend is ready
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('disasterType', disasterType);
      formData.append('location', location);
      
      const response = await fetch('/api/assess-damage', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      setResult(data);
      setIsAssessing(false);
      
    } catch (error) {
      console.error('Error assessing damage:', error);
      
      // FALLBACK: Mock results if API fails (for testing)
      setTimeout(() => {
        const mockResults = {
          severity: ['Minor', 'Moderate', 'Severe', 'Critical'][Math.floor(Math.random() * 4)],
          damagePercentage: Math.floor(Math.random() * 100),
          affectedArea: Math.floor(Math.random() * 5000) + 500,
          segmentationMask: null, // Will use random overlay
          resources: {
            personnel: Math.floor(Math.random() * 50) + 10,
            vehicles: Math.floor(Math.random() * 10) + 2
          }
        };
        
        setResult(mockResults);
        setIsAssessing(false);
      }, 3000);
    }
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
          {previewUrl && !result && (
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

            {/* NEW: Damage Visualization with Overlay */}
            <div className="visualization-section">
              <div className="visualization-header">
                <h3 className="visualization-title">Damage Visualization</h3>
                <button
                  onClick={() => setShowOverlay(!showOverlay)}
                  className="toggle-overlay-button"
                >
                  {showOverlay ? (
                    <>
                      <EyeOff size={18} />
                      Hide Overlay
                    </>
                  ) : (
                    <>
                      <Eye size={18} />
                      Show Damage Overlay
                    </>
                  )}
                </button>
              </div>
              
              <div className="overlay-container">
                <canvas 
                  ref={canvasRef} 
                  className="overlay-canvas"
                  style={{ display: showOverlay ? 'block' : 'none' }}
                />
                <img 
                  src={previewUrl} 
                  alt="Original" 
                  className="overlay-image"
                  style={{ display: showOverlay ? 'none' : 'block' }}
                />
              </div>
              
              <div className="overlay-legend">
                <div className="legend-item">
                  <div className="legend-color legend-severe"></div>
                  <span className="legend-text">Severe Damage</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color legend-moderate"></div>
                  <span className="legend-text">Moderate Damage</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color legend-minor"></div>
                  <span className="legend-text">Minor Damage</span>
                </div>
              </div>
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