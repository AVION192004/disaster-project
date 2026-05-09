import React, { useState, useRef } from 'react';
import { Upload, CheckCircle, Loader, AlertTriangle, MapPin, Users, Truck, Zap, Activity, Shield } from 'lucide-react';
import './DamageAssessment.css';

const API_BASE = "http://localhost:5000";

const mapDamageToSeverity = (predicted_label, confidence) => {
  switch (predicted_label) {
    case 'No Damage':
      return { severity: 'Minor', severityColor: '#10b981', damagePercentage: Math.round(confidence * 0.05), dispatchPriority: 'LOW', personnel: 5, vehicles: 1 };
    case 'Major Damage':
      return { severity: 'Severe', severityColor: '#f59e0b', damagePercentage: Math.round(40 + confidence * 0.4), dispatchPriority: 'HIGH', personnel: Math.round(20 + confidence * 0.3), vehicles: Math.round(5 + confidence * 0.05) };
    case 'Destroyed':
      return { severity: 'Critical', severityColor: '#ef4444', damagePercentage: Math.round(70 + confidence * 0.3), dispatchPriority: 'CRITICAL', personnel: Math.round(40 + confidence * 0.5), vehicles: Math.round(10 + confidence * 0.1) };
    default:
      return { severity: 'Minor', severityColor: '#10b981', damagePercentage: 10, dispatchPriority: 'LOW', personnel: 5, vehicles: 2 };
  }
};

const DISASTER_TYPES = [
  { value: 'flood', label: '🌊 Flood' },
  { value: 'earthquake', label: '🏚️ Earthquake' },
  { value: 'fire', label: '🔥 Fire' },
  { value: 'cyclone', label: '🌀 Cyclone' },
  { value: 'landslide', label: '⛰️ Landslide' },
];

export default function DamageAssessment() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [disasterType, setDisasterType] = useState('');
  const [location, setLocation] = useState('');
  const [isAssessing, setIsAssessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (file) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Please upload a JPG, PNG, or WEBP image.');
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(file);
    setResult(null);
    setError(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files[0]);
  };

  const assessDamage = async () => {
    if (!selectedFile || !disasterType || !location) {
      setError('Please fill all fields and upload an image before running assessment.');
      return;
    }
    setIsAssessing(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('disasterType', disasterType);
      formData.append('location', location);
      const response = await fetch(`${API_BASE}/api/damage/assess`, { method: 'POST', body: formData });
      if (!response.ok) throw new Error(`Server error ${response.status}`);
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      const mapped = mapDamageToSeverity(data.predicted_label, data.confidence);
      setResult({ ...data, confidence: Math.round(data.confidence), ...mapped });
    } catch (err) {
      setError(`Backend connection failed. Make sure Flask is running on ${API_BASE}`);
    } finally {
      setIsAssessing(false);
    }
  };

  const priorityColor = result?.dispatchPriority === 'CRITICAL' ? '#ef4444'
    : result?.dispatchPriority === 'HIGH' ? '#f59e0b' : '#10b981';

  return (
    <div className="da-wrap">
      <div className="da-inner">

        <header className="da-header">
          <div className="da-header__icon-wrap"><Shield size={28} color="#3b82f6" /></div>
          <div>
            <h1 className="da-title">AI Damage Assessment</h1>
            <p className="da-subtitle">Upload satellite or ground imagery for instant AI-powered severity analysis</p>
          </div>
        </header>

        <section className="da-card">
          <div className="da-card__label">📋 Assessment Parameters</div>
          <div className="da-field-row">
            <div className="da-field">
              <label className="da-label">Disaster Type</label>
              <select value={disasterType} onChange={(e) => setDisasterType(e.target.value)} className="da-select">
                <option value="">Select type…</option>
                {DISASTER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="da-field">
              <label className="da-label">Location</label>
              <div className="da-input-wrap">
                <MapPin size={16} className="da-input-icon" />
                <input value={location} onChange={(e) => setLocation(e.target.value)} className="da-input da-input--icon" placeholder="e.g. Ernakulam, Kerala" />
              </div>
            </div>
          </div>

          <div className="da-field">
            <label className="da-label">Damage Imagery</label>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => handleFileChange(e.target.files[0])} className="da-file-hidden" id="fileInput" />
            <label
              htmlFor="fileInput"
              className={`da-dropzone ${isDragging ? 'da-dropzone--active' : ''} ${selectedFile ? 'da-dropzone--filled' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              {selectedFile ? (
                <>
                  <div className="da-dropzone__preview-wrap">
                    <img src={previewUrl} alt="Preview" className="da-dropzone__preview-img" />
                  </div>
                  <div className="da-dropzone__info">
                    <CheckCircle size={18} color="#10b981" />
                    <span className="da-dropzone__filename">{selectedFile.name}</span>
                    <span className="da-dropzone__hint">Click to change image</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="da-dropzone__icon-wrap"><Upload size={28} /></div>
                  <span className="da-dropzone__primary">Drag & drop or click to upload</span>
                  <span className="da-dropzone__secondary">JPG, PNG, WEBP · Max 10MB</span>
                </>
              )}
            </label>
          </div>

          {error && <div className="da-error"><AlertTriangle size={16} />{error}</div>}

          <button onClick={assessDamage} disabled={isAssessing} className="da-submit">
            {isAssessing ? <><Loader size={18} className="da-submit__spinner" />Analysing with AI...</> : <><Zap size={18} />Run AI Assessment</>}
          </button>
        </section>

        {result && (
          <section className="da-results">
            <div className="da-results__header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle size={22} color="#10b981" />
                <h2 className="da-results__title">Assessment Complete</h2>
              </div>
              <span className="da-severity-badge" style={{ background: `${result.severityColor}20`, color: result.severityColor, border: `1px solid ${result.severityColor}40` }}>
                {result.severity}
              </span>
            </div>

            <div className="da-metrics">
              <div className="da-metric">
                <div className="da-metric__label">Prediction</div>
                <div className="da-metric__value" style={{ color: result.severityColor }}>{result.predicted_label}</div>
              </div>
              <div className="da-metric">
                <div className="da-metric__label">Confidence</div>
                <div className="da-metric__value">{result.confidence}%</div>
                <div className="da-confidence-bar">
                  <div className="da-confidence-bar__fill" style={{ width: `${result.confidence}%`, background: result.severityColor }} />
                </div>
              </div>
              <div className="da-metric">
                <div className="da-metric__label">Damage Level</div>
                <div className="da-metric__value">{result.damagePercentage}%</div>
                <div className="da-confidence-bar">
                  <div className="da-confidence-bar__fill" style={{ width: `${result.damagePercentage}%`, background: result.severityColor }} />
                </div>
              </div>
            </div>

            <div className="da-priority-banner" style={{ borderColor: `${priorityColor}40`, background: `${priorityColor}10` }}>
              <Activity size={18} color={priorityColor} />
              <span style={{ color: priorityColor, fontWeight: 'bold' }}>Dispatch Priority: {result.dispatchPriority}</span>
            </div>

            <div className="da-card__label">🚒 Recommended Resource Allocation</div>
            <div className="da-resources__grid">
              <div className="da-resource-card" style={{ borderColor: 'rgba(139,92,246,0.3)', background: 'rgba(139,92,246,0.08)' }}>
                <Users size={22} color="#8b5cf6" />
                <div className="da-resource-card__value" style={{ color: '#8b5cf6' }}>{result.personnel}</div>
                <div className="da-resource-card__label">Personnel</div>
              </div>
              <div className="da-resource-card" style={{ borderColor: 'rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.08)' }}>
                <Truck size={22} color="#f59e0b" />
                <div className="da-resource-card__value" style={{ color: '#f59e0b' }}>{result.vehicles}</div>
                <div className="da-resource-card__label">Vehicles</div>
              </div>
              <div className="da-resource-card" style={{ borderColor: 'rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.08)' }}>
                <MapPin size={22} color="#3b82f6" />
                <div className="da-resource-card__value" style={{ color: '#3b82f6' }}>{location}</div>
                <div className="da-resource-card__label">Location</div>
              </div>
            </div>

            {/* Plain image, no heatmap overlay */}
            <div className="da-viz">
              <div className="da-viz__toolbar">
                <span className="da-card__label" style={{ margin: 0 }}>🔍 Damage Image</span>
              </div>
              <div className="da-viz__canvas-wrap">
                <img src={previewUrl} alt="Damage" className="da-viz__canvas" />
              </div>
            </div>

          </section>
        )}
      </div>
    </div>
  );
}