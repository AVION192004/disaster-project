import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, MapPin, Phone, User, Mail, Upload, Send, CheckCircle, 
  Navigation, ShieldAlert, X, Activity, Droplets, 
  Flame, Wind, Tornado, Mountain, Sun, HelpCircle, Info, PhoneCall, Camera
} from 'lucide-react';

export default function ReportDisaster() {
  const [formData, setFormData] = useState({
    disasterType: '',
    severity: '',
    location: '',
    description: '',
    reporterName: '',
    reporterPhone: '',
    reporterEmail: '',
    injured: '',
    missing: '',
    deceased: '',
    displaced: ''
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reportId, setReportId] = useState(null);
  const [error, setError] = useState('');
  const [backendStatus, setBackendStatus] = useState('checking');
  const [isLocating, setIsLocating] = useState(false);

  const disasterTypes = [
    { id: 'Flood',      icon: Droplets,   color: '#3b82f6' },
    { id: 'Earthquake', icon: Activity,   color: '#a855f7' },
    { id: 'Fire',       icon: Flame,      color: '#ef4444' },
    { id: 'Hurricane',  icon: Wind,       color: '#06b6d4' },
    { id: 'Tornado',    icon: Tornado,    color: '#64748b' },
    { id: 'Landslide',  icon: Mountain,   color: '#10b981' },
    { id: 'Drought',    icon: Sun,        color: '#eab308' },
    { id: 'Other',      icon: HelpCircle, color: '#f43f5e' },
  ];

  const severityLevels = [
    { value: '1', label: 'Low',      desc: 'Minor impact'       },
    { value: '2', label: 'Moderate', desc: 'Manageable'         },
    { value: '3', label: 'Severe',   desc: 'Significant damage' },
    { value: '4', label: 'Critical', desc: 'Life-threatening'   },
    { value: '5', label: 'Extreme',  desc: 'Catastrophic'       },
  ];

  useEffect(() => {
    checkBackendHealth();
    const interval = setInterval(checkBackendHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  const checkBackendHealth = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/health', { method: 'GET' });
      setBackendStatus(response.ok ? 'online' : 'offline');
    } catch {
      setBackendStatus('offline');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const setDisasterType = (type) => { setFormData(prev => ({ ...prev, disasterType: type })); setError(''); };
  const setSeverity     = (val)  => { setFormData(prev => ({ ...prev, severity: val }));      setError(''); };

  const getUserLocation = () => {
    if (!navigator.geolocation) { setError('Geolocation is not supported by your browser'); return; }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        setFormData(prev => ({ ...prev, location: `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}` }));
      },
      () => { setIsLocating(false); setError('Unable to auto-detect location. Please type it manually.'); }
    );
  };

  const handleFileChange = (e) => setSelectedFiles(prev => [...prev, ...Array.from(e.target.files)]);
  const removeFile = (index) => setSelectedFiles(prev => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.disasterType || !formData.severity || !formData.location || !formData.reporterName || !formData.reporterPhone) {
      setError('Please select a Disaster Type, Severity Level, Exact Location, Reporter Name, and Phone Number.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (backendStatus === 'offline') {
      setError('❌ Backend is not running. Please start backend with: python backend/api.py');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const response = await fetch('http://localhost:5000/api/disaster/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.disasterType,
          location: formData.location,
          description: formData.description,
          severity: formData.severity,
          reporter_name: formData.reporterName,
          reporter_phone: formData.reporterPhone,
          reporter_email: formData.reporterEmail,
          casualties: parseInt(formData.injured || 0) + parseInt(formData.deceased || 0) + parseInt(formData.missing || 0),
          affected_people: parseInt(formData.displaced || 0)
        }),
      });
      const data = await response.json();
      if (data.success) { setReportId(data.report_id || 'PENDING'); setSubmitted(true); }
      else { setError(data.error || 'Failed to submit report'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    } catch {
      setError('❌ Network error. Please ensure backend is running on http://localhost:5000');
      setBackendStatus('offline');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmitted(false); setReportId(null); setError('');
    setFormData({ disasterType: '', severity: '', location: '', description: '', reporterName: '', reporterPhone: '', reporterEmail: '', injured: '', missing: '', deceased: '', displaced: '' });
    setSelectedFiles([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const styles = {
    container: { minHeight: '100vh', background: '#09090b', color: '#f8fafc', fontFamily: "'Inter', sans-serif", position: 'relative' },
    layout: { display: 'flex', maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem 4rem 1.5rem', gap: '2.5rem', alignItems: 'flex-start', justifyContent: 'center' },
    mainCol: { flex: '1', maxWidth: '750px', minWidth: 0 },
    sidebarCol: { width: '320px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'sticky', top: '2rem' },
    pageHeader: { textAlign: 'center', marginBottom: '2rem' },
    titleBox: { display: 'inline-flex', alignItems: 'center', gap: '12px', marginBottom: '8px' },
    title: { fontSize: '2rem', fontWeight: '700', color: 'white' },
    subtitle: { color: '#94a3b8', fontSize: '0.95rem' },
    formBox: { background: '#13192b', borderRadius: '16px', border: '1px solid #1e293b', padding: '2.5rem', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' },
    sectionTitle: { fontSize: '1.25rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', marginTop: '2.5rem', color: 'white' },
    sectionSubtitle: { fontSize: '0.875rem', color: '#64748b', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #1e293b' },
    alertWarning: { background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '8px', padding: '16px', display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '24px' },
    errorBanner: { background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', fontWeight: 'bold' },
    label: { display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#e2e8f0', marginBottom: '8px' },
    req: { color: '#ef4444' },
    typeGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px', marginBottom: '28px' },
    typeCard: (selected, color) => ({ background: selected ? 'rgba(59, 130, 246, 0.1)' : '#1e293b', border: selected ? `2px solid ${color}` : '2px solid transparent', borderRadius: '12px', padding: '16px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s', color: selected ? color : '#cbd5e1' }),
    severityContainer: { display: 'flex', gap: '10px', marginBottom: '28px', flexWrap: 'wrap' },
    severityBtn: (selected, val) => {
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#f97316', '#ef4444'];
      const color = colors[parseInt(val)-1] || '#64748b';
      return { flex: '1 1 60px', background: selected ? `rgba(59,130,246, 0.1)` : '#1e293b', border: selected ? `2px solid ${color}` : '2px solid transparent', color: selected ? color : '#94a3b8', borderRadius: '8px', padding: '12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer', transition: 'all 0.2s' };
    },
    severityNum: { fontSize: '1.25rem', fontWeight: 'bold' },
    severityLabel: { fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' },
    inputContainer: { position: 'relative', marginBottom: '24px' },
    inputIcon: { position: 'absolute', left: '16px', top: '14px', color: '#64748b' },
    input: { width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '14px 16px 14px 44px', color: 'white', fontSize: '0.95rem', outline: 'none', transition: 'border 0.2s', boxSizing: 'border-box' },
    inputSmall: { width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '12px 16px', color: 'white', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' },
    textarea: { width: '100%', minHeight: '120px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '16px', color: 'white', fontSize: '0.95rem', resize: 'vertical', display: 'block', boxSizing: 'border-box' },
    casualtiesGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '28px' },
    casualtyLabel: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', color: '#cbd5e1', marginBottom: '8px', fontWeight: 'bold' },
    btnGroup: { display: 'flex', justifyContent: 'center', marginTop: '40px', paddingTop: '32px', borderTop: '1px dashed #334155' },
    submitBtn: { background: '#ef4444', border: 'none', color: 'white', padding: '16px 32px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', fontSize: '1.1rem', width: '100%', justifyContent: 'center', boxShadow: '0 4px 14px 0 rgba(239, 68, 68, 0.39)', transition: 'background 0.2s, transform 0.2s' },
    sidebarBox: { background: '#13192b', borderRadius: '16px', border: '1px solid #1e293b', padding: '1.5rem', marginBottom: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
    sidebarTitle: { fontSize: '1rem', fontWeight: 'bold', color: 'white', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' },
    contactList: { display: 'flex', flexDirection: 'column', gap: '12px' },
    contactItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', padding: '12px', borderRadius: '8px', border: '1px solid #1e293b' },
    contactInfo: { display: 'flex', alignItems: 'center', gap: '12px' },
    contactName: { fontSize: '0.875rem', fontWeight: 'bold', color: '#e2e8f0' },
    contactNum: { fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' },
    callBtn: { background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', border: 'none', cursor: 'pointer', transition: 'background 0.2s' },
    tipsList: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' },
    tipItem: { display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.5' },
    tipDot: { marginTop: '6px', width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6', flexShrink: 0 },
    uploadArea: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '10rem', background: '#0f172a', border: '2px dashed #334155', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.3s ease', padding: '20px', textAlign: 'center', boxSizing: 'border-box' },
    fileGrid: { marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '16px' },
    fileItem: { position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid #334155', aspectRatio: '1/1' },
    fileImage: { width: '100%', height: '100%', objectFit: 'cover' },
    removeBtn: { position: 'absolute', top: '6px', right: '6px', width: '24px', height: '24px', background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', zIndex: 1000 },
    modalCard: { background: '#13192b', borderRadius: '16px', padding: '3rem 2rem', maxWidth: '400px', width: '100%', textAlign: 'center', border: '1px solid #10b981', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' },
  };

  if (submitted) {
    return (
      <div style={styles.modal}>
        <div style={styles.modalCard}>
          <CheckCircle color="#10b981" size={56} style={{ margin: '0 auto 1.5rem auto' }} />
          <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'white', marginBottom: '1rem' }}>Report Submitted Successfully</h2>
          <p style={{ color: '#94a3b8', marginBottom: '2rem', lineHeight: '1.5' }}>Your disaster report has been logged. Emergency responders have been notified.</p>
          <div style={{ background: '#0f172a', padding: '1.5rem', borderRadius: '8px', border: '1px dashed #334155', marginBottom: '2rem' }}>
            <p style={{ fontSize: '0.875rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Official Report ID</p>
            <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#3b82f6', letterSpacing: '2px', margin: 0 }}>DIS-{reportId}</p>
          </div>
          <button onClick={resetForm} style={{ width: '100%', background: 'white', color: 'black', fontWeight: 'bold', padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
            Submit Another Report
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.layout} className="rd-layout">

        {/* Main Form Column */}
        <div style={styles.mainCol} className="rd-main-col">
          <div style={styles.pageHeader}>
            <div style={styles.titleBox}>
              <AlertTriangle color="#ef4444" size={32} />
              <h1 style={styles.title}>Report a Disaster</h1>
            </div>
            <p style={styles.subtitle}>Help us respond faster by providing accurate information.</p>
          </div>

          <div style={styles.formBox} className="rd-formbox">
            {error && (
              <div style={styles.errorBanner}>
                <AlertTriangle size={20} style={{flexShrink: 0}} />
                <span>{error}</span>
              </div>
            )}

            <div style={styles.alertWarning}>
              <AlertTriangle color="#f59e0b" size={24} style={{marginTop:'2px', flexShrink: 0}} />
              <div>
                <h3 style={{fontSize:'1rem', fontWeight:'bold', color:'white', margin:'0 0 6px 0'}}>Disaster Information</h3>
                <p style={{fontSize:'0.875rem', color:'#cbd5e1', margin:0}}>Please provide accurate details about the disaster and its impact scale.</p>
              </div>
            </div>

            {/* Disaster Type */}
            <label style={styles.label}>Disaster Type <span style={styles.req}>*</span></label>
            <div style={styles.typeGrid} className="rd-type-grid">
              {disasterTypes.map(type => (
                <div key={type.id} onClick={() => setDisasterType(type.id)} style={styles.typeCard(formData.disasterType === type.id, type.color)} className="hover-card">
                  <type.icon size={28} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>{type.id}</span>
                </div>
              ))}
            </div>

            {/* Severity */}
            <label style={styles.label}>Severity Level <span style={styles.req}>*</span></label>
            <p style={{fontSize:'0.75rem', color:'#64748b', marginBottom:'12px'}}>Select numbers representing the impact scale.</p>
            <div style={styles.severityContainer} className="rd-severity">
              {severityLevels.map(sev => (
                <div key={sev.value} onClick={() => setSeverity(sev.value)} style={styles.severityBtn(formData.severity === sev.value, sev.value)} className="hover-card">
                  <span style={styles.severityLabel}>{sev.label}</span>
                  <span style={styles.severityNum}>{sev.value}</span>
                </div>
              ))}
            </div>

            {/* Location */}
            <label style={styles.label}>Location <span style={styles.req}>*</span></label>
            <div style={styles.inputContainer}>
              <MapPin style={styles.inputIcon} size={20} />
              <input type="text" name="location" value={formData.location} onChange={handleInputChange}
                placeholder="Enter exact location or nearby landmarks"
                style={{...styles.input, paddingRight:'110px'}} />
              <div style={{position:'absolute', right:'10px', top:'10px'}}>
                <button type="button" onClick={getUserLocation} style={{background:'#1e293b', border:'none', color:'white', padding:'6px 12px', borderRadius:'6px', fontSize:'0.75rem', fontWeight:'bold', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px'}} className="hover-btn">
                  {isLocating ? <div style={{width:'12px', height:'12px', border:'2px solid gray', borderTopColor:'white', borderRadius:'50%', animation:'spin 1s linear infinite'}} /> : <Navigation size={14}/>}
                  {isLocating ? 'Locating...' : 'Detect'}
                </button>
              </div>
            </div>

            {/* Casualties */}
            <label style={{...styles.label, marginTop:'32px', borderBottom:'1px solid #1e293b', paddingBottom:'16px', marginBottom:'20px'}}>Estimated Casualties</label>
            <div style={styles.casualtiesGrid} className="rd-casualties-grid">
              <div>
                <label style={styles.casualtyLabel}><Activity size={18} color="#f59e0b" /> Injuries</label>
                <input type="number" name="injured" value={formData.injured} onChange={handleInputChange} style={styles.inputSmall} placeholder="0" min="0" />
              </div>
              <div>
                <label style={styles.casualtyLabel}><HelpCircle size={18} color="#ef4444" /> Missing</label>
                <input type="number" name="missing" value={formData.missing} onChange={handleInputChange} style={styles.inputSmall} placeholder="0" min="0" />
              </div>
              <div>
                <label style={styles.casualtyLabel}><X size={18} color="#94a3b8" /> Deceased</label>
                <input type="number" name="deceased" value={formData.deceased} onChange={handleInputChange} style={styles.inputSmall} placeholder="0" min="0" />
              </div>
              <div>
                <label style={styles.casualtyLabel}><Navigation size={18} color="#3b82f6" /> Displaced</label>
                <input type="number" name="displaced" value={formData.displaced} onChange={handleInputChange} style={styles.inputSmall} placeholder="0" min="0" />
              </div>
            </div>

            {/* Description */}
            <label style={styles.label}>Description</label>
            <textarea name="description" value={formData.description} onChange={handleInputChange}
              style={styles.textarea} placeholder="Describe the situation in detail. What happened? What assistance is needed?" />

            {/* Reporter Details */}
            <h2 style={styles.sectionTitle}><User size={24} color="#3b82f6" /> Reporter Details</h2>
            <p style={styles.sectionSubtitle}>Please provide your contact information so responders can reach you if needed.</p>

            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'24px'}} className="rd-reporter-grid">
              <div>
                <label style={styles.label}>Full Name <span style={styles.req}>*</span></label>
                <div style={{...styles.inputContainer, marginBottom: 0}}>
                  <User style={styles.inputIcon} size={20} />
                  <input type="text" name="reporterName" value={formData.reporterName} onChange={handleInputChange} placeholder="John Doe" style={styles.input} />
                </div>
              </div>
              <div>
                <label style={styles.label}>Phone Number <span style={styles.req}>*</span></label>
                <div style={{...styles.inputContainer, marginBottom: 0}}>
                  <Phone style={styles.inputIcon} size={20} />
                  <input type="tel" name="reporterPhone" value={formData.reporterPhone} onChange={handleInputChange} placeholder="+1 (555) 000-000" style={styles.input} />
                </div>
              </div>
            </div>

            <div style={{marginBottom:'32px'}}>
              <label style={styles.label}>Email Address</label>
              <div style={{...styles.inputContainer, marginBottom: 0}}>
                <Mail style={styles.inputIcon} size={20} />
                <input type="email" name="reporterEmail" value={formData.reporterEmail} onChange={handleInputChange} placeholder="Optional" style={styles.input} />
              </div>
            </div>

            {/* Image Upload */}
            <label style={styles.label}><Camera size={18} style={{verticalAlign:'middle', marginRight:'6px'}}/> Visual Evidence (Images)</label>
            <p style={{fontSize:'0.75rem', color:'#64748b', marginBottom:'12px'}}>Upload photos of the scene if it is safe to do so.</p>
            <input type="file" multiple accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} id="imageUpload" />
            <label htmlFor="imageUpload" style={styles.uploadArea} className="hover-area">
              <Upload color="#64748b" size={36} style={{marginBottom:'12px'}} />
              <p style={{fontSize:'1rem', color:'white', fontWeight:'bold', margin:0}}>Click to upload images</p>
              <p style={{fontSize:'0.8rem', color:'#64748b', margin:'6px 0 0 0'}}>Supported: JPG, PNG, WEBP (Max 10MB)</p>
            </label>

            {selectedFiles.length > 0 && (
              <div style={styles.fileGrid}>
                {selectedFiles.map((file, index) => (
                  <div key={index} style={styles.fileItem}>
                    <img src={URL.createObjectURL(file)} alt="" style={styles.fileImage} />
                    <button type="button" onClick={() => removeFile(index)} style={styles.removeBtn}><X size={14}/></button>
                  </div>
                ))}
              </div>
            )}

            <div style={styles.btnGroup}>
              <button type="button" onClick={handleSubmit} style={styles.submitBtn} disabled={isSubmitting || backendStatus === 'offline'} className="main-submit">
                {isSubmitting ? 'Submitting...' : <><Send size={20} /> Dispatch Emergency Report</>}
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={styles.sidebarCol} className="rd-sidebar-col">
          <div style={styles.sidebarBox}>
            <h2 style={styles.sidebarTitle}><PhoneCall size={18} color="#ef4444" /> Emergency Contacts</h2>
            <div style={styles.contactList}>
              {[
                { icon: Flame,      color: '#ef4444', name: 'Fire Department', num: '911' },
                { icon: Activity,   color: '#3b82f6', name: 'Ambulance',       num: '911' },
                { icon: ShieldAlert,color: '#10b981', name: 'Police',          num: '911' },
                { icon: Phone,      color: '#f59e0b', name: 'Disaster Hotline',num: '1-800-000-0000' },
              ].map(({ icon: Icon, color, name, num }) => (
                <div key={name} style={styles.contactItem}>
                  <div style={styles.contactInfo}>
                    <div style={{background:`rgba(${color === '#ef4444' ? '239,68,68' : color === '#3b82f6' ? '59,130,246' : color === '#10b981' ? '16,185,129' : '245,158,11'}, 0.1)`, padding:'8px', borderRadius:'8px'}}>
                      <Icon size={16} color={color} />
                    </div>
                    <div>
                      <div style={styles.contactName}>{name}</div>
                      <div style={styles.contactNum}>{num}</div>
                    </div>
                  </div>
                  <button type="button" style={styles.callBtn} className="hover-call">Call</button>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.sidebarBox}>
            <h2 style={styles.sidebarTitle}><Info size={18} color="#3b82f6" /> Tips for Reporting</h2>
            <ul style={styles.tipsList}>
              {[
                'Be as specific as possible about the location.',
                'Estimate the number of people affected if you can see them.',
                'Mention any immediate dangers like broken power lines or fires.',
                'Upload photos of the scene if it is safe to do so.',
              ].map((tip, i) => (
                <li key={i} style={styles.tipItem}><div style={styles.tipDot} />{tip}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .hover-card:hover { transform: translateY(-2px); filter: brightness(1.2); }
        .hover-btn:hover { background: #334155 !important; }
        .hover-area:hover { border-color: #3b82f6 !important; background: rgba(59,130,246,0.05) !important; }
        .hover-call:hover { background: rgba(16,185,129,0.2) !important; color: white !important; }
        .main-submit:hover:not(:disabled) { background: #dc2626 !important; transform: translateY(-2px); box-shadow: 0 6px 20px 0 rgba(239,68,68,0.5) !important; }

        @media (max-width: 900px) {
          .rd-layout {
            flex-direction: column !important;
            padding: 1rem !important;
          }
          .rd-main-col {
            max-width: 100% !important;
            width: 100% !important;
          }
          .rd-sidebar-col {
            width: 100% !important;
            position: static !important;
          }
        }

        @media (max-width: 600px) {
          .rd-formbox {
            padding: 1rem !important;
          }
          .rd-type-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .rd-severity {
            flex-wrap: wrap !important;
          }
          .rd-severity > div {
            flex: 1 1 28% !important;
          }
          .rd-reporter-grid {
            grid-template-columns: 1fr !important;
          }
          .rd-casualties-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}} />
    </div>
  );
}