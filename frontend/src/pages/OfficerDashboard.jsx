import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const OfficerDashboard = () => {
  const navigate = useNavigate();
  const [officer, setOfficer] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('officer_token');
    const officerData = localStorage.getItem('officer_data');

    if (!token || !officerData) {
      navigate('/officer/login');
      return;
    }

    try {
      setOfficer(JSON.parse(officerData));
    } catch (err) {
      console.error('Error parsing officer data:', err);
      navigate('/officer/login');
    }
  }, [navigate]);

  useEffect(() => {
    if (officer) {
      fetchReports();
    }
  }, [officer]);

  // Initialize map when component mounts
  useEffect(() => {
    if (activeTab === 'overview' && mapRef.current && !mapInstanceRef.current) {
      initializeMap();
    }
  }, [activeTab]);

  // Update markers when reports change
  useEffect(() => {
    if (activeTab === 'overview' && mapInstanceRef.current && reports.length > 0) {
      updateMapMarkers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reports, activeTab]);

  const initializeMap = () => {
    try {
      if (mapInstanceRef.current) {
        console.log('Map already initialized');
        return;
      }

      console.log('Initializing map...');
      const defaultCenter = [9.5915, 76.5215];

      const map = L.map(mapRef.current, {
        center: defaultCenter,
        zoom: 8,
        attributionControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
      console.log('✅ Map initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing map:', error);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Critical':
        return '#ff5252';
      case 'High':
        return '#ffb84d';
      case 'Medium':
        return '#2196f3';
      case 'Low':
        return '#4caf50';
      default:
        return '#999';
    }
  };

  const createCustomMarker = (severity) => {
    const color = getSeverityColor(severity);
    return L.divIcon({
      html: `<div style="
        width: 35px;
        height: 35px;
        background-color: ${color};
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        cursor: pointer;
      ">📍</div>`,
      iconSize: [35, 35],
      className: 'custom-marker',
    });
  };

  const updateMapMarkers = () => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    // Remove all existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    const bounds = L.latLngBounds();
    let hasMarkers = false;

    reports.forEach((report) => {
      let lat = 9.5915 + (report.id * 0.05) % 0.5;
      let lng = 76.5215 + (report.id * 0.03) % 0.5;

      const marker = L.marker([lat, lng], {
        icon: createCustomMarker(report.severity),
        title: report.name
      }).addTo(map);

      const popupContent = `
        <div style="font-family: Arial; color: #333; min-width: 250px;">
          <h4 style="margin: 0 0 10px 0; color: #333; border-bottom: 2px solid ${getSeverityColor(report.severity)}; padding-bottom: 8px;">
            ${report.name}
          </h4>
          <p style="margin: 6px 0;"><strong>📍 Location:</strong> ${report.location}</p>
          <p style="margin: 6px 0;"><strong>🎯 Severity:</strong> <span style="background: ${getSeverityColor(report.severity)}33; color: ${getSeverityColor(report.severity)}; padding: 2px 6px; border-radius: 3px; font-weight: 600;">${report.severity}</span></p>
          <p style="margin: 6px 0;"><strong>✅ Status:</strong> ${report.status}</p>
          <p style="margin: 6px 0;"><strong>👤 Reporter:</strong> ${report.reporter_name}</p>
          ${report.reporter_phone ? `<p style="margin: 6px 0;"><strong>📱 Phone:</strong> ${report.reporter_phone}</p>` : ''}
          <p style="margin: 8px 0 0 0; font-size: 12px; color: #666;">📅 ${new Date(report.created_at).toLocaleDateString()}</p>
        </div>
      `;

      marker.bindPopup(popupContent);
      bounds.extend([lat, lng]);
      hasMarkers = true;
    });

    if (hasMarkers) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    console.log('✅ Markers updated');
  };

  const fetchReports = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/disaster/reports');
      const data = await response.json();

      if (data.success) {
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (reportId, newStatus) => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/disaster/report/${reportId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setReports(reports.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r)));
        alert('Status updated successfully!');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('officer_token');
    localStorage.removeItem('officer_data');
    navigate('/');
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#fff', minHeight: '100vh', backgroundColor: '#1a1a2e' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!officer) {
    return null;
  }

  const filteredReports = selectedStatus === 'All' ? reports : reports.filter((r) => r.status === selectedStatus);

  const stats = {
    total: reports.length,
    pending: reports.filter((r) => r.status === 'Pending').length,
    inProgress: reports.filter((r) => r.status === 'In Progress').length,
    completed: reports.filter((r) => r.status === 'Completed').length,
    avgResponseTime: '2.3 hrs',
    resolutionRate: reports.length > 0 ? Math.round((reports.filter((r) => r.status === 'Completed').length / reports.length) * 100) : 0,
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 20px', backgroundColor: '#1a1a2e', minHeight: '100vh', color: 'white' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <h1>Officer Dashboard</h1>
        <button onClick={handleLogout} style={{ padding: '10px 20px', backgroundColor: '#ff5252', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '16px' }}>
          Logout
        </button>
      </div>

      {/* Welcome Card */}
      <div style={{ backgroundColor: 'rgba(80, 80, 120, 0.3)', padding: '30px', borderRadius: '12px', marginBottom: '30px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <h2>Welcome, {officer.name}! 👋</h2>
        <p>Email: {officer.email}</p>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: '30px', display: 'flex', gap: '10px' }}>
        <button onClick={() => setActiveTab('overview')} style={{ padding: '10px 20px', backgroundColor: activeTab === 'overview' ? '#b366ff' : 'rgba(80, 80, 120, 0.3)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '16px' }}>
          Overview & Map
        </button>
        <button onClick={() => setActiveTab('reports')} style={{ padding: '10px 20px', backgroundColor: activeTab === 'reports' ? '#b366ff' : 'rgba(80, 80, 120, 0.3)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '16px' }}>
          All Reports
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Statistics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            {[
              { title: '📋 Total Reports', value: stats.total, color: '#b366ff', desc: 'Disaster reports received' },
              { title: '⏳ Pending', value: stats.pending, color: '#ffb84d', desc: 'Awaiting review' },
              { title: '🔄 In Progress', value: stats.inProgress, color: '#2196f3', desc: 'Currently being assessed' },
              { title: '✅ Completed', value: stats.completed, color: '#4caf50', desc: 'Assessments done' },
              { title: '⏱️ Avg Response', value: stats.avgResponseTime, color: '#b366ff', desc: 'Average response time' },
              { title: '📊 Resolution Rate', value: stats.resolutionRate + '%', color: '#4caf50', desc: 'Cases resolved' },
            ].map((stat, idx) => (
              <div key={idx} style={{ backgroundColor: 'rgba(80, 80, 120, 0.2)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <h3>{stat.title}</h3>
                <p style={{ fontSize: '48px', fontWeight: 'bold', color: stat.color, margin: '10px 0' }}>{stat.value}</p>
                <p>{stat.desc}</p>
              </div>
            ))}
          </div>

          {/* Map and Priority */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
            {/* Map */}
            <div
              ref={mapRef}
              style={{
                backgroundColor: 'rgba(80, 80, 120, 0.2)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                minHeight: '500px',
                height: '500px',
                overflow: 'hidden',
                position: 'relative',
                zIndex: 1
              }}
            />

            {/* High Priority */}
            <div style={{ backgroundColor: 'rgba(80, 80, 120, 0.2)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <h3 style={{ color: '#b366ff', marginBottom: '20px' }}>🔴 High Priority</h3>
              {reports.filter((r) => r.severity === 'Critical' || r.severity === 'High').length > 0 ? (
                reports.filter((r) => r.severity === 'Critical' || r.severity === 'High').map((report) => (
                  <div key={report.id} style={{ backgroundColor: 'rgba(60, 60, 90, 0.5)', padding: '12px', borderRadius: '8px', marginBottom: '10px', borderLeft: `4px solid ${getSeverityColor(report.severity)}` }}>
                    <div style={{ fontWeight: '600', marginBottom: '3px' }}>📍 {report.name}</div>
                    <div style={{ fontSize: '12px', color: '#999' }}>{report.location}</div>
                  </div>
                ))
              ) : (
                <p style={{ color: '#999' }}>No high priority cases</p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <>
          <div style={{ marginBottom: '20px' }}>
            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} style={{ padding: '8px 15px', backgroundColor: 'rgba(60, 60, 90, 0.5)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '8px', color: 'white', cursor: 'pointer' }}>
              <option>All</option>
              <option>Pending</option>
              <option>In Progress</option>
              <option>Completed</option>
            </select>
          </div>

          {filteredReports.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#999' }}>No reports found</p>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {filteredReports.map((report) => (
                <div key={report.id} style={{ backgroundColor: 'rgba(80, 80, 120, 0.2)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                    <div>
                      <h3 style={{ marginBottom: '5px' }}>📍 {report.name}</h3>
                      <p style={{ color: '#ccc', marginBottom: '5px' }}>Location: {report.location}</p>
                      <p style={{ color: '#999', fontSize: '14px' }}>Reported by: {report.reporter_name}</p>
                    </div>
                    <span style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: getSeverityColor(report.severity), color: 'white', fontWeight: 'bold' }}>
                      {report.severity}
                    </span>
                  </div>

                  {report.description && <p style={{ color: '#bbb', marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>📝 {report.description}</p>}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#999', fontSize: '14px' }}>Reported: {new Date(report.created_at).toLocaleDateString()}</span>
                    <select value={report.status} onChange={(e) => handleUpdateStatus(report.id, e.target.value)} style={{ padding: '8px 15px', backgroundColor: 'rgba(60, 60, 90, 0.5)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '8px', color: 'white', cursor: 'pointer' }}>
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OfficerDashboard;