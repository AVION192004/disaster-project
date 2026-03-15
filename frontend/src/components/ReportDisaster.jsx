import React, { useState } from 'react';
import { AlertTriangle, MapPin, Phone, User, Mail, Upload, Send, CheckCircle, ArrowLeft } from 'lucide-react';
import { useEffect } from "react";

export default function ReportDisaster() {
  const [formData, setFormData] = useState({
    disasterType: '',
    severity: '',
    location: '',
    description: '',
    reporterName: '',
    reporterPhone: '',
    reporterEmail: '',
    casualties: '',
    affectedPeople: ''
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reportId, setReportId] = useState(null);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(''); // Clear error when user types
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

   useEffect(() => {
    const syncReports = async () => {
      const offlineReports =
        JSON.parse(localStorage.getItem("offlineReports")) || [];

      if (offlineReports.length === 0) return;

      try {
        for (let report of offlineReports) {
          await fetch("http://127.0.0.1:5000/api/disaster/report", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(report),
          });
        }

        localStorage.removeItem("offlineReports");
        alert("✅ Offline reports synced successfully");
      } catch (err) {
        console.error("Sync failed", err);
      }
    };

    window.addEventListener("online", syncReports);
    return () => window.removeEventListener("online", syncReports);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.disasterType || !formData.severity || !formData.location || !formData.reporterName || !formData.reporterPhone) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // ✅ ACTUAL API CALL TO BACKEND
      const response = await fetch('http://127.0.0.1:5000/api/disaster/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.disasterType,           // Maps to 'name' in backend
          location: formData.location,
          description: formData.description,
          severity: formData.severity,
          reporter_name: formData.reporterName,
          reporter_phone: formData.reporterPhone,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // ✅ Success - show the report ID from backend
        setReportId(data.report_id);
        setSubmitted(true);
        console.log('✅ Disaster reported successfully:', data);
      } else {
        // ❌ Backend returned error
        setError(data.error || 'Failed to submit report');
      }
    } catch (err) {
      // ❌ Network or other error
      console.error('❌ Error submitting report:', err);
      setError('Network error. Please check if backend is running on http://127.0.0.1:5000');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setReportId(null);
    setError('');
    setFormData({
      disasterType: '', severity: '', location: '', description: '',
      reporterName: '', reporterPhone: '', reporterEmail: '', casualties: '', affectedPeople: ''
    });
    setSelectedFiles([]);
  };

 const styles = {

  /* 🔥 Dark Navy Base Instead of Purple Gradient */
  container: {
    minHeight: '100vh',
    background: '#0f172a',
    color: 'white',
    fontFamily: 'Arial, sans-serif'
  },

  header: {
    background: '#111827',
    borderBottom: '1px solid #1f2937',
    padding: '1rem 2rem'
  },

  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  backBtn: {
    background: 'none',
    border: 'none',
    color: '#9ca3af',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.9rem'
  },

  logo: { fontSize: '1.5rem', fontWeight: 'bold' },

  content: { maxWidth: '900px', margin: '0 auto', padding: '3rem 1.5rem' },

  pageHeader: { textAlign: 'center', marginBottom: '2rem' },

  iconContainer: {
    width: '64px',
    height: '64px',
    background: '#dc2626',
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1rem'
  },

  /* 🔥 Removed purple gradient text */
  title: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
    color: 'white'
  },

  subtitle: { color: '#9ca3af', fontSize: '1.1rem' },

  formContainer: {
    background: '#1e293b',
    borderRadius: '1rem',
    padding: '2rem',
    border: '1px solid #334155'
  },

  errorBanner: {
    background: '#dc2626',
    color: 'white',
    padding: '1rem',
    borderRadius: '0.5rem',
    marginBottom: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },

  section: { marginBottom: '2rem' },

  sectionHeader: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem'
  },

  gridFull: { gridColumn: '1 / -1' },

  label: {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '500',
    marginBottom: '0.5rem',
    color: '#e5e7eb'
  },

  required: { color: '#f87171' },

  input: {
    width: '100%',
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '0.5rem',
    padding: '0.75rem 1rem',
    color: 'white',
    fontSize: '1rem',
    boxSizing: 'border-box'
  },

  inputWithIcon: { paddingLeft: '2.75rem' },

  inputIcon: {
    position: 'absolute',
    left: '0.75rem',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#6b7280'
  },

  inputContainer: { position: 'relative' },

  textarea: {
    width: '100%',
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '0.5rem',
    padding: '0.75rem 1rem',
    color: 'white',
    fontSize: '1rem',
    resize: 'none',
    minHeight: '100px',
    boxSizing: 'border-box'
  },

  uploadArea: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '8rem',
    background: '#0f172a',
    border: '2px dashed #334155',
    borderRadius: '0.5rem',
    cursor: 'pointer'
  },

  uploadContent: { textAlign: 'center' },

  uploadText: { fontSize: '0.875rem', color: '#e5e7eb', marginTop: '0.5rem' },

  uploadSubtext: { fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' },

  fileGrid: {
    marginTop: '1rem',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    gap: '1rem'
  },

  fileItem: {
    position: 'relative',
    background: '#1e293b',
    borderRadius: '0.5rem',
    padding: '0.5rem'
  },

  fileImage: {
    width: '100%',
    height: '6rem',
    objectFit: 'cover',
    borderRadius: '0.25rem'
  },

  removeBtn: {
    position: 'absolute',
    top: '-0.5rem',
    right: '-0.5rem',
    width: '1.5rem',
    height: '1.5rem',
    background: '#dc2626',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: '1.25rem',
    lineHeight: '1'
  },

  fileName: {
    fontSize: '0.75rem',
    color: '#9ca3af',
    marginTop: '0.25rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },

  warning: {
    background: '#3f1d1d',
    border: '1px solid #7f1d1d',
    borderRadius: '0.5rem',
    padding: '1rem',
    marginBottom: '1.5rem'
  },

  warningText: {
    fontSize: '0.875rem',
    color: '#fca5a5'
  },

  /* 🔥 Removed red-orange gradient */
  submitBtn: {
    width: '100%',
    background: '#dc2626',
    color: 'white',
    padding: '1rem',
    borderRadius: '0.5rem',
    border: 'none',
    fontWeight: 'bold',
    fontSize: '1.125rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem'
  },

  submitBtnDisabled: { background: '#475569', cursor: 'not-allowed' },

  spinner: {
    width: '1.25rem',
    height: '1.25rem',
    border: '2px solid white',
    borderTopColor: 'transparent',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },

  /* 🔥 Modal without purple */
  modal: {
    position: 'fixed',
    inset: 0,
    background: '#0f172a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1.5rem',
    zIndex: 1000
  },

  modalCard: {
    background: '#1e293b',
    borderRadius: '1rem',
    padding: '2rem',
    maxWidth: '28rem',
    width: '100%',
    textAlign: 'center',
    border: '1px solid #10b981'
  },

  modalTitle: {
    fontSize: '1.875rem',
    fontWeight: 'bold',
    margin: '1rem 0'
  },

  modalMessage: { color: '#9ca3af', marginBottom: '1.5rem' },

  reportIdBox: {
    background: '#0f172a',
    borderRadius: '0.5rem',
    padding: '1rem',
    marginBottom: '1.5rem'
  },

  reportIdLabel: { fontSize: '0.875rem', color: '#6b7280' },

  /* 🔥 Blue accent instead of purple */
  reportIdValue: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#60a5fa',
    marginTop: '0.25rem'
  },

  newReportBtn: {
    width: '100%',
    background: '#2563eb',
    color: 'white',
    padding: '0.75rem',
    borderRadius: '0.5rem',
    border: 'none',
    fontWeight: '600',
    cursor: 'pointer'
  }
};

  if (submitted) {
    return (
      <div style={styles.modal}>
        <div style={styles.modalCard}>
          <CheckCircle style={{ color: '#4ade80', margin: '0 auto' }} size={64} />
          <h2 style={styles.modalTitle}>Report Submitted!</h2>
          <p style={styles.modalMessage}>Your disaster report has been received. Our rescue team will respond immediately.</p>
          <div style={styles.reportIdBox}>
            <p style={styles.reportIdLabel}>Report ID</p>
            <p style={styles.reportIdValue}>DIS-{reportId}</p>
          </div>
          <button onClick={resetForm} style={styles.newReportBtn}>Submit Another Report</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <button onClick={() => window.history.back()} style={styles.backBtn}>
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          <div style={styles.logo}>Rescueplex.</div>
        </div>
      </header>

      <div style={styles.content}>
        <div style={styles.pageHeader}>
          <div style={styles.iconContainer}>
            <AlertTriangle size={32} />
          </div>
          <h1 style={styles.title}>Report a Disaster</h1>
          <p style={styles.subtitle}>Help us respond faster by providing accurate information</p>
        </div>

        <div style={styles.formContainer}>
          {/* Error Banner */}
          {error && (
            <div style={styles.errorBanner}>
              <AlertTriangle size={20} />
              <span>{error}</span>
            </div>
          )}

          <div style={styles.section}>
            <h2 style={styles.sectionHeader}>
              <AlertTriangle size={24} style={{ color: '#f87171' }} />
              Disaster Information
            </h2>

            <div style={styles.grid}>
              <div>
                <label style={styles.label}>Disaster Type <span style={styles.required}>*</span></label>
                <select name="disasterType" value={formData.disasterType} onChange={handleInputChange} style={styles.input}>
                  <option value="">Select Type</option>
                  <option value="Earthquake">Earthquake</option>
                  <option value="Flood">Flood</option>
                  <option value="Fire">Fire</option>
                  <option value="Hurricane">Hurricane</option>
                  <option value="Tornado">Tornado</option>
                  <option value="Landslide">Landslide</option>
                  <option value="Tsunami">Tsunami</option>
                  <option value="Building Collapse">Building Collapse</option>
                  <option value="Gas Leak">Gas Leak</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label style={styles.label}>Severity Level <span style={styles.required}>*</span></label>
                <select name="severity" value={formData.severity} onChange={handleInputChange} style={styles.input}>
                  <option value="">Select Severity</option>
                  <option value="Low">Low - No injuries</option>
                  <option value="Medium">Medium - Few injuries</option>
                  <option value="High">High - Multiple injuries</option>
                  <option value="Critical">Critical - Life threatening</option>
                </select>
              </div>

              <div style={styles.gridFull}>
                <label style={styles.label}>Location <span style={styles.required}>*</span></label>
                <div style={styles.inputContainer}>
                  <MapPin style={styles.inputIcon} size={20} />
                  <input type="text" name="location" value={formData.location} onChange={handleInputChange} placeholder="Enter exact location or nearest landmark" style={{...styles.input, ...styles.inputWithIcon}} />
                </div>
              </div>

              <div>
                <label style={styles.label}>Estimated Casualties</label>
                <input type="number" name="casualties" value={formData.casualties} onChange={handleInputChange} placeholder="Number of injured/deceased" min="0" style={styles.input} />
              </div>

              <div>
                <label style={styles.label}>People Affected</label>
                <input type="number" name="affectedPeople" value={formData.affectedPeople} onChange={handleInputChange} placeholder="Approximate number" min="0" style={styles.input} />
              </div>

              <div style={styles.gridFull}>
                <label style={styles.label}>Description</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Describe what happened, current situation, immediate dangers..." style={styles.textarea} />
              </div>
            </div>
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionHeader}>
              <User size={24} style={{ color: '#60a5fa' }} />
              Your Information
            </h2>

            <div style={styles.grid}>
              <div>
                <label style={styles.label}>Full Name <span style={styles.required}>*</span></label>
                <div style={styles.inputContainer}>
                  <User style={styles.inputIcon} size={20} />
                  <input type="text" name="reporterName" value={formData.reporterName} onChange={handleInputChange} placeholder="Enter your name" style={{...styles.input, ...styles.inputWithIcon}} />
                </div>
              </div>

              <div>
                <label style={styles.label}>Phone Number <span style={styles.required}>*</span></label>
                <div style={styles.inputContainer}>
                  <Phone style={styles.inputIcon} size={20} />
                  <input type="tel" name="reporterPhone" value={formData.reporterPhone} onChange={handleInputChange} placeholder="Enter phone number" style={{...styles.input, ...styles.inputWithIcon}} />
                </div>
              </div>

              <div style={styles.gridFull}>
                <label style={styles.label}>Email Address</label>
                <div style={styles.inputContainer}>
                  <Mail style={styles.inputIcon} size={20} />
                  <input type="email" name="reporterEmail" value={formData.reporterEmail} onChange={handleInputChange} placeholder="Enter email (optional)" style={{...styles.input, ...styles.inputWithIcon}} />
                </div>
              </div>
            </div>
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionHeader}>
              <Upload size={24} style={{ color: '#4ade80' }} />
              Upload Images (Optional)
            </h2>

            <input type="file" multiple accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} id="imageUpload" />
            <label htmlFor="imageUpload" style={styles.uploadArea}>
              <div style={styles.uploadContent}>
                <Upload style={{ color: '#9ca3af', margin: '0 auto' }} size={32} />
                <p style={styles.uploadText}>Click to upload images</p>
                <p style={styles.uploadSubtext}>JPG, PNG up to 10MB each</p>
              </div>
            </label>

            {selectedFiles.length > 0 && (
              <div style={styles.fileGrid}>
                {selectedFiles.map((file, index) => (
                  <div key={index} style={styles.fileItem}>
                    <img src={URL.createObjectURL(file)} alt={`Upload ${index + 1}`} style={styles.fileImage} />
                    <button type="button" onClick={() => removeFile(index)} style={styles.removeBtn}>×</button>
                    <p style={styles.fileName}>{file.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={styles.warning}>
            <p style={styles.warningText}><strong>Emergency?</strong> If this is a life-threatening emergency, please call emergency services (911) immediately before submitting this report.</p>
          </div>

        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .hover-card:hover { transform: translateY(-2px); filter: brightness(1.2); }
        .hover-btn:hover { background: #334155 !important; }
        .hover-area:hover { border-color: #3b82f6 !important; background: rgba(59, 130, 246, 0.05) !important; }
        .hover-call:hover { background: rgba(16, 185, 129, 0.2) !important; color: white !important; }
        .main-submit:hover:not(:disabled) { background: #dc2626 !important; transform: translateY(-2px); box-shadow: 0 6px 20px 0 rgba(239, 68, 68, 0.5) !important; }
      `}} />
    </div>
  );
}