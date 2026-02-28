import React, { useState, useRef, useEffect } from 'react';
import { Upload, CheckCircle, Loader, Eye, EyeOff } from 'lucide-react';
import './DamageAssessment.css';

const mapDamageToSeverity = (predicted_label, confidence) => {
  switch (predicted_label) {
    case 'No Damage':
      return {
        severity:         'Minor',
        damagePercentage: Math.round(confidence * 0.05),
        dispatchPriority: 'LOW',
        personnel:        5,
        vehicles:         1,
      };
    case 'Major Damage':
      return {
        severity:         'Severe',
        damagePercentage: Math.round(40 + confidence * 0.4),
        dispatchPriority: 'HIGH',
        personnel:        Math.round(20 + confidence * 0.3),
        vehicles:         Math.round(5  + confidence * 0.05),
      };
    case 'Destroyed':
      return {
        severity:         'Critical',
        damagePercentage: Math.round(70 + confidence * 0.3),
        dispatchPriority: 'HIGH',
        personnel:        Math.round(40 + confidence * 0.5),
        vehicles:         Math.round(10 + confidence * 0.1),
      };
    default:
      return {
        severity:         'Minor',
        damagePercentage: 10,
        dispatchPriority: 'LOW',
        personnel:        5,
        vehicles:         2,
      };
  }
};

// Build allocation payload from predicted label
const buildAllocationPayload = (predicted_label) => {
  switch (predicted_label) {
    case 'No Damage':
      return { building_no_damage: 1, building_minor_damage: 0, building_major_damage: 0, building_total_destruction: 0 };
    case 'Major Damage':
      return { building_no_damage: 0, building_minor_damage: 0, building_major_damage: 1, building_total_destruction: 0 };
    case 'Destroyed':
      return { building_no_damage: 0, building_minor_damage: 0, building_major_damage: 0, building_total_destruction: 1 };
    default:
      return { building_no_damage: 1, building_minor_damage: 0, building_major_damage: 0, building_total_destruction: 0 };
  }
};

const categoryMeta = {
  minor_damage:      { label: 'Minor Damage',      color: '#22C55E' },
  major_damage:      { label: 'Major Damage',      color: '#F59E0B' },
  total_destruction: { label: 'Total Destruction', color: '#EF4444' },
};

export default function DamageAssessment() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl]     = useState(null);
  const [disasterType, setDisasterType] = useState('');
  const [location, setLocation]         = useState('');
  const [isAssessing, setIsAssessing]   = useState(false);
  const [result, setResult]             = useState(null);
  const [showOverlay, setShowOverlay]   = useState(true);
  const [error, setError]               = useState(null);
  const [allocation, setAllocation]     = useState(null);
  const [allocating, setAllocating]     = useState(false);
  const canvasRef = useRef(null);
  

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp')) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result);
      reader.readAsDataURL(file);
      setResult(null);
      setAllocation(null);
      setError(null);
    } else {
      alert('Please upload a JPG, PNG, or WEBP image');
    }
  };

  useEffect(() => {
    if (result && previewUrl && canvasRef.current && showOverlay) {
      const canvas = canvasRef.current;
      const ctx    = canvas.getContext('2d');
      const img    = new Image();
      img.onload = () => {
        const maxWidth = 800;
        const scale    = Math.min(maxWidth / img.width, 1);
        canvas.width   = img.width  * scale;
        canvas.height  = img.height * scale;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        if (result.gradcam_heatmap_b64) {
          const maskImg  = new Image();
          maskImg.onload = () => {
            ctx.globalAlpha = 0.55;
            ctx.drawImage(maskImg, 0, 0, canvas.width, canvas.height);
            ctx.globalAlpha = 1.0;
          };
          maskImg.src = `data:image/jpeg;base64,${result.gradcam_heatmap_b64}`;
        }
      };
      img.src = previewUrl;
    }
  }, [result, previewUrl, showOverlay]);

  // Auto-allocate resources after prediction
  const allocateResources = async (predicted_label) => {
    setAllocating(true);
    try {
      const payload = buildAllocationPayload(predicted_label);
      const response = await fetch('http://localhost:5000/allocate-resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (data.success) {
        setAllocation(data.allocation_results);
      }
    } catch (err) {
      console.error('Resource allocation error:', err);
    } finally {
      setAllocating(false);
    }
  };

  const assessDamage = async () => {
    if (!selectedFile || !disasterType || !location) {
      alert('Please fill in all fields and upload an image');
      return;
    }
    setIsAssessing(true);
    setError(null);
    setAllocation(null);

    try {
      const formData = new FormData();
      formData.append('image',        selectedFile);
      formData.append('disasterType', disasterType);
      formData.append('location',     location);

      const response = await fetch('http://localhost:5000/api/damage/assess', {
        method: 'POST',
        body:   formData,
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Assessment failed');

      const mapped = mapDamageToSeverity(data.predicted_label, data.confidence);

      const resultData = {
        predicted_label:     data.predicted_label,
        damage_level:        data.damage_level,
        confidence:          Math.round(data.confidence),
        all_probabilities:   data.all_probabilities,
        gradcam_heatmap_b64: data.gradcam_heatmap_b64,
        color:               data.color,
        severity:            mapped.severity,
        damagePercentage:    mapped.damagePercentage,
        dispatchPriority:    mapped.dispatchPriority,
        resources: {
          personnel: mapped.personnel,
          vehicles:  mapped.vehicles,
        },
        affectedArea: data.damage_level === 0 ? 0
                    : data.damage_level === 2 ? Math.round(1000 + data.confidence * 30)
                    : Math.round(3000 + data.confidence * 50),
      };

      setResult(resultData);

      // Auto-trigger resource allocation
      await allocateResources(data.predicted_label);

    } catch (err) {
      console.error('Assessment error:', err);
      setError(`Assessment failed: ${err.message}. Make sure the backend is running on port 5000.`);
    } finally {
      setIsAssessing(false);
    }
  };

  const getSeverityClass = (severity) => ({
    Minor:    'severity--minor',
    Moderate: 'severity--moderate',
    Severe:   'severity--severe',
    Critical: 'severity--critical',
  }[severity] || '');

  const getConfidenceClass = (conf) => {
    if (conf >= 85) return 'da-metric__value--confidence-high';
    if (conf >= 70) return 'da-metric__value--confidence-mid';
    return 'da-metric__value--confidence-low';
  };

  const hasAllocations = allocation && (
    (allocation.minor_damage      && allocation.minor_damage.length      > 0) ||
    (allocation.major_damage      && allocation.major_damage.length      > 0) ||
    (allocation.total_destruction && allocation.total_destruction.length > 0)
  );

  return (
    <div className="da-wrap">
      <div className="da-inner">

        <header className="da-header">
          <h1 className="da-title">Damage Assessment</h1>
          <p className="da-subtitle">
            Upload ground-level or field imagery to generate an AI-powered severity
            report and automatic resource dispatch recommendation.
          </p>
        </header>

        {/* ── Input card ── */}
        <section className="da-card" aria-label="Assessment inputs">
          <div className="da-field-row">
            <div className="da-field">
              <label className="da-label" htmlFor="disasterType">Disaster type</label>
              <select
                id="disasterType"
                value={disasterType}
                onChange={(e) => setDisasterType(e.target.value)}
                className="da-select"
              >
                <option value="">Select type…</option>
                <option value="flood">Flood</option>
                <option value="earthquake">Earthquake</option>
                <option value="fire">Fire</option>
                <option value="hurricane">Hurricane</option>
                <option value="tornado">Tornado</option>
                <option value="landslide">Landslide</option>
              </select>
            </div>
            <div className="da-field">
              <label className="da-label" htmlFor="location">Location (area / city)</label>
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Ernakulam, Kerala"
                className="da-input"
              />
            </div>
          </div>

          <div className="da-field">
            <label className="da-label">Damage imagery</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="da-file-hidden"
              id="da-file"
            />
            <label htmlFor="da-file" className="da-dropzone">
              <Upload size={22} className="da-dropzone__icon" aria-hidden="true" />
              <span className="da-dropzone__primary">
                {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
              </span>
              <span className="da-dropzone__secondary">JPG, PNG, WEBP — max 10 MB</span>
            </label>
          </div>

          {previewUrl && !result && (
            <div className="da-field">
              <label className="da-label">Preview</label>
              <div className="da-preview">
                <img src={previewUrl} alt="Uploaded damage imagery preview" className="da-preview__img" />
              </div>
            </div>
          )}

          {error && (
            <div style={{
              background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.4)',
              borderRadius: '8px', padding: '12px 16px', color: '#f87171', fontSize: '14px', marginTop: '12px',
            }}>
              {error}
            </div>
          )}

          <button onClick={assessDamage} disabled={isAssessing} className="da-submit" type="button">
            {isAssessing ? (
              <><Loader size={16} className="da-submit__spinner" aria-hidden="true" /> Analysing…</>
            ) : 'Run Assessment'}
          </button>
        </section>

        {/* ── Results ── */}
        {result && (
          <section className="da-results" aria-label="Assessment results" aria-live="polite">

            <div className="da-results__header">
              <CheckCircle size={20} className="da-results__check" aria-hidden="true" />
              <h2 className="da-results__title">Assessment complete</h2>
            </div>

            {/* Prediction badge */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px 16px', background: 'rgba(255,255,255,0.05)',
              borderRadius: '8px', marginBottom: '16px', fontSize: '14px',
            }}>
              <span style={{ color: '#94a3b8' }}>AI Prediction:</span>
              <span style={{ fontWeight: 700, color: result.color || '#a78bfa', fontSize: '16px' }}>
                {result.predicted_label}
              </span>
              <span style={{ color: '#64748b', marginLeft: 'auto' }}>
                Confidence: <strong style={{ color: '#e2e8f0' }}>{result.confidence}%</strong>
              </span>
            </div>

            {/* Probability bars */}
            {result.all_probabilities && (
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                {Object.entries(result.all_probabilities).map(([label, prob]) => (
                  <div key={label} style={{
                    flex: '1', minWidth: '120px', background: 'rgba(255,255,255,0.04)',
                    borderRadius: '8px', padding: '10px 14px', textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>{label}</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#e2e8f0' }}>{prob}%</div>
                    <div style={{ height: '3px', background: '#1e293b', borderRadius: '2px', marginTop: '6px' }}>
                      <div style={{
                        height: '100%', width: `${prob}%`,
                        background: label === result.predicted_label ? (result.color || '#a78bfa') : '#334155',
                        borderRadius: '2px', transition: 'width 0.6s ease',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Visualisation */}
            <div className="da-viz">
              <div className="da-viz__header">
                <h3 className="da-viz__title">Damage visualisation</h3>
                <button onClick={() => setShowOverlay(!showOverlay)} className="da-viz__toggle" type="button">
                  {showOverlay ? <><EyeOff size={14} /> Hide overlay</> : <><Eye size={14} /> Show overlay</>}
                </button>
              </div>
              <div className="da-viz__canvas-wrap">
                <canvas ref={canvasRef} className="da-viz__canvas" style={{ display: showOverlay ? 'block' : 'none' }} />
                <img src={previewUrl} alt="Original" className="da-viz__canvas" style={{ display: showOverlay ? 'none' : 'block' }} />
              </div>
              <div className="da-legend">
                {['Severe','Moderate','Minor'].map(l => (
                  <span key={l} className="da-legend__item">
                    <span className={`da-legend__dot da-legend__dot--${l.toLowerCase()}`} />
                    {l}
                  </span>
                ))}
              </div>
            </div>

            {/* Metrics */}
            <div className="da-metrics da-metrics--four">
              <div className="da-metric">
                <span className="da-metric__label">Severity level</span>
                <span className={`da-metric__value ${getSeverityClass(result.severity)}`}>{result.severity}</span>
              </div>
              <div className="da-metric">
                <span className="da-metric__label">Damage extent</span>
                <span className="da-metric__value da-metric__value--primary">{result.damagePercentage}%</span>
              </div>
              <div className="da-metric">
                <span className="da-metric__label">Affected area</span>
                <span className="da-metric__value da-metric__value--info">{result.affectedArea.toLocaleString()} m²</span>
              </div>
              <div className="da-metric">
                <span className="da-metric__label">AI confidence</span>
                <span className={`da-metric__value ${getConfidenceClass(result.confidence)}`}>{result.confidence}%</span>
              </div>
            </div>

            {/* ── Auto Resource Allocation Results ── */}
            <div style={{
              background: '#161B27', border: '1px solid #2A3347',
              borderRadius: '8px', padding: '1.25rem',
              display: 'flex', flexDirection: 'column', gap: '1rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: '#F0F2F7' }}>
                  Recommended Resource Dispatch
                </h3>
                {allocating && (
                  <span style={{ fontSize: '13px', color: '#6B48FF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Loader size={13} className="da-submit__spinner" /> Calculating…
                  </span>
                )}
                {!allocating && hasAllocations && (
                  <span style={{
                    fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em',
                    padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase',
                    background: result.dispatchPriority === 'HIGH' ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                    color: result.dispatchPriority === 'HIGH' ? '#EF4444' : '#22C55E',
                    border: `1px solid ${result.dispatchPriority === 'HIGH' ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`,
                  }}>
                    {result.dispatchPriority} Priority
                  </span>
                )}
              </div>

              {/* Allocation results grouped by tier */}
              {!allocating && hasAllocations && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  {Object.entries(categoryMeta).map(([key, { label, color }]) =>
                    allocation[key] && allocation[key].length > 0 ? (
                      <div key={key}>
                        <span style={{
                          fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.05em',
                          textTransform: 'uppercase', padding: '2px 8px', borderRadius: '4px',
                          background: `${color}18`, color, border: `1px solid ${color}33`,
                          display: 'inline-block', marginBottom: '8px',
                        }}>
                          {label}
                        </span>
                        <div style={{
                          border: '1px solid #2A3347', borderRadius: '6px', overflow: 'hidden',
                          display: 'flex', flexDirection: 'column', gap: '1px', background: '#2A3347',
                        }}>
                          {allocation[key].map((item, i) => (
                            <div key={i} style={{
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              padding: '0.625rem 0.875rem', background: '#1E2636', fontSize: '0.875rem',
                            }}>
                              <span style={{ color: '#F0F2F7', fontWeight: 500 }}>{item.resource_name}</span>
                              <span style={{ color: '#8B95A8', fontSize: '0.8125rem' }}>
                                {item.allocated_quantity} units
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null
                  )}
                </div>
              )}

              {!allocating && !hasAllocations && (
                <p style={{ color: '#56617A', fontSize: '0.875rem', margin: 0 }}>
                  No resources required for this damage level.
                </p>
              )}
            </div>

          </section>
        )}

      </div>
    </div>
  );
}