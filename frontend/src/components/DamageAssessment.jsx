import React, { useState, useRef, useEffect } from 'react';
import { Upload, CheckCircle, Loader, Eye, EyeOff } from 'lucide-react';
import './DamageAssessment.css';

/* ===============================
   CHANGE THIS TO YOUR LAPTOP IP
   =============================== */
const API_BASE = "http://192.168.1.35:5000"; // <-- CHANGE THIS

const mapDamageToSeverity = (predicted_label, confidence) => {
  switch (predicted_label) {
    case 'No Damage':
      return {
        severity: 'Minor',
        damagePercentage: Math.round(confidence * 0.05),
        dispatchPriority: 'LOW',
        personnel: 5,
        vehicles: 1,
      };
    case 'Major Damage':
      return {
        severity: 'Severe',
        damagePercentage: Math.round(40 + confidence * 0.4),
        dispatchPriority: 'HIGH',
        personnel: Math.round(20 + confidence * 0.3),
        vehicles: Math.round(5 + confidence * 0.05),
      };
    case 'Destroyed':
      return {
        severity: 'Critical',
        damagePercentage: Math.round(70 + confidence * 0.3),
        dispatchPriority: 'HIGH',
        personnel: Math.round(40 + confidence * 0.5),
        vehicles: Math.round(10 + confidence * 0.1),
      };
    default:
      return {
        severity: 'Minor',
        damagePercentage: 10,
        dispatchPriority: 'LOW',
        personnel: 5,
        vehicles: 2,
      };
  }
};

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

export default function DamageAssessment() {

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [disasterType, setDisasterType] = useState('');
  const [location, setLocation] = useState('');
  const [isAssessing, setIsAssessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const canvasRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Please upload JPG, PNG, or WEBP image');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(file);
    setResult(null);
    setError(null);
  };

  useEffect(() => {
    if (!result || !previewUrl || !canvasRef.current || !showOverlay) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      const maxWidth = 800;
      const scale = Math.min(maxWidth / img.width, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      if (result.gradcam_heatmap_b64) {
        const maskImg = new Image();
        maskImg.onload = () => {
          ctx.globalAlpha = 0.55;
          ctx.drawImage(maskImg, 0, 0, canvas.width, canvas.height);
          ctx.globalAlpha = 1;
        };
        maskImg.src = `data:image/jpeg;base64,${result.gradcam_heatmap_b64}`;
      }
    };

    img.src = previewUrl;
  }, [result, previewUrl, showOverlay]);

  const assessDamage = async () => {

    if (!selectedFile || !disasterType || !location) {
      alert('Fill all fields and upload an image');
      return;
    }

    setIsAssessing(true);
    setError(null);

    try {

      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('disasterType', disasterType);
      formData.append('location', location);

      const response = await fetch(`${API_BASE}/api/damage/assess`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error(`Server error ${response.status}`);

      const data = await response.json();
      if (!data.success) throw new Error(data.error);

      const mapped = mapDamageToSeverity(data.predicted_label, data.confidence);

      setResult({
        ...data,
        confidence: Math.round(data.confidence),
        ...mapped,
      });

    } catch (err) {
      console.error(err);
      setError(`Backend connection failed. Make sure Flask is running on ${API_BASE}`);
    } finally {
      setIsAssessing(false);
    }
  };

  return (
    <div className="da-wrap">
      <div className="da-inner">

        <header className="da-header">
          <h1 className="da-title">Damage Assessment</h1>
          <p className="da-subtitle">
            Upload imagery to generate AI-based severity report.
          </p>
        </header>

        <section className="da-card">

          <div className="da-field-row">
            <div className="da-field">
              <label className="da-label">Disaster Type</label>
              <select
                value={disasterType}
                onChange={(e) => setDisasterType(e.target.value)}
                className="da-select"
              >
                <option value="">Select type…</option>
                <option value="flood">Flood</option>
                <option value="earthquake">Earthquake</option>
                <option value="fire">Fire</option>
              </select>
            </div>

            <div className="da-field">
              <label className="da-label">Location</label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="da-input"
                placeholder="e.g. Ernakulam"
              />
            </div>
          </div>

          <div className="da-field">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="da-file-hidden"
              id="fileInput"
            />
            <label htmlFor="fileInput" className="da-dropzone">
              <Upload size={22} />
              {selectedFile ? selectedFile.name : "Upload damage image"}
            </label>
          </div>

          <button
            onClick={assessDamage}
            disabled={isAssessing}
            className="da-submit"
          >
            {isAssessing ? (
              <>
                <Loader size={18} className="da-submit__spinner" />
                Analysing...
              </>
            ) : (
              "Run Assessment"
            )}
          </button>

          {error && <p style={{ color: '#ef4444' }}>{error}</p>}

        </section>

        {result && (
          <section className="da-results">
            <div className="da-results__header">
              <CheckCircle size={20} />
              <h2>Assessment Complete</h2>
            </div>

            <p><strong>Prediction:</strong> {result.predicted_label}</p>
            <p><strong>Confidence:</strong> {result.confidence}%</p>

            <div className="da-viz">
              <button
                onClick={() => setShowOverlay(!showOverlay)}
                className="da-viz__toggle"
              >
                {showOverlay ? <EyeOff size={16}/> : <Eye size={16}/>}
                Toggle Overlay
              </button>

              <div className="da-viz__canvas-wrap">
                <canvas
                  ref={canvasRef}
                  className="da-viz__canvas"
                  style={{ display: showOverlay ? 'block' : 'none' }}
                />
                {!showOverlay && (
                  <img
                    src={previewUrl}
                    alt="Original"
                    className="da-viz__canvas"
                  />
                )}
              </div>
            </div>

          </section>
        )}

      </div>
    </div>
  );
}