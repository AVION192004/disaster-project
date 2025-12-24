import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const OfficerDashboard = () => {
  const navigate = useNavigate();
  const [officer, setOfficer] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedStatus, setSelectedStatus] = useState('All');

  useEffect(() => {
    // Check if officer is logged in
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

  // Fetch disaster reports
  useEffect(() => {
    if (officer) {
      fetchReports();
    }
  }, [officer]);

  const fetchReports = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/disaster/reports');
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
      const response = await fetch(`http://localhost:5000/api/disaster/report/${reportId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setReports(reports.map(r => 
          r.id === reportId ? { ...r, status: newStatus } : r
        ));
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

  const filteredReports = selectedStatus === 'All' 
    ? reports 
    : reports.filter(r => r.status === selectedStatus);

  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.status === 'Pending').length,
    inProgress: reports.filter(r => r.status === 'In Progress').length,
    completed: reports.filter(r => r.status === 'Completed').length
  };

  return (
    <div style={{ 
      maxWidth: '1400px', 
      margin: '0 auto', 
      padding: '40px 20px',
      backgroundColor: '#1a1a2e',
      minHeight: '100vh',
      color: 'white'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '40px'
      }}>
        <h1>Officer Dashboard</h1>
        <button 
          onClick={handleLogout}
          style={{
            padding: '10px 20px',
            backgroundColor: '#ff5252',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Logout
        </button>
      </div>

      {/* Welcome Card */}
      <div style={{
        backgroundColor: 'rgba(80, 80, 120, 0.3)',
        padding: '30px',
        borderRadius: '12px',
        marginBottom: '30px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <h2>Welcome, {officer.name}! 👋</h2>
        <p>Email: {officer.email}</p>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: '30px', display: 'flex', gap: '10px' }}>
        <button
          onClick={() => setActiveTab('overview')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'overview' ? '#b366ff' : 'rgba(80, 80, 120, 0.3)',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'reports' ? '#b366ff' : 'rgba(80, 80, 120, 0.3)',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          All Reports
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            <div style={{
              backgroundColor: 'rgba(80, 80, 120, 0.2)',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h3>📋 Total Reports</h3>
              <p style={{ fontSize: '48px', fontWeight: 'bold', color: '#b366ff', margin: '10px 0' }}>{stats.total}</p>
              <p>Disaster reports received</p>
            </div>

            <div style={{
              backgroundColor: 'rgba(80, 80, 120, 0.2)',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h3>⏳ Pending</h3>
              <p style={{ fontSize: '48px', fontWeight: 'bold', color: '#ffb84d', margin: '10px 0' }}>{stats.pending}</p>
              <p>Awaiting review</p>
            </div>

            <div style={{
              backgroundColor: 'rgba(80, 80, 120, 0.2)',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h3>🔄 In Progress</h3>
              <p style={{ fontSize: '48px', fontWeight: 'bold', color: '#2196f3', margin: '10px 0' }}>{stats.inProgress}</p>
              <p>Currently being assessed</p>
            </div>

            <div style={{
              backgroundColor: 'rgba(80, 80, 120, 0.2)',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h3>✅ Completed</h3>
              <p style={{ fontSize: '48px', fontWeight: 'bold', color: '#4caf50', margin: '10px 0' }}>{stats.completed}</p>
              <p>Assessments done</p>
            </div>
          </div>
        </>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ marginRight: '10px', color: '#ccc' }}>Filter by Status: </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                padding: '8px 15px',
                backgroundColor: 'rgba(60, 60, 90, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              <option>All</option>
              <option>Pending</option>
              <option>In Progress</option>
              <option>Completed</option>
            </select>
          </div>

          {filteredReports.length === 0 ? (
            <div style={{
              backgroundColor: 'rgba(80, 80, 120, 0.2)',
              padding: '40px',
              borderRadius: '12px',
              textAlign: 'center',
              color: '#999'
            }}>
              <p>No reports found</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {filteredReports.map((report) => (
                <div
                  key={report.id}
                  style={{
                    backgroundColor: 'rgba(80, 80, 120, 0.2)',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                    <div>
                      <h3 style={{ marginBottom: '5px' }}>📍 {report.name}</h3>
                      <p style={{ color: '#ccc', marginBottom: '5px' }}>Location: {report.location}</p>
                      <p style={{ color: '#999', fontSize: '14px' }}>Reported by: {report.reporter_name}</p>
                      {report.reporter_phone && <p style={{ color: '#999', fontSize: '14px' }}>Phone: {report.reporter_phone}</p>}
                    </div>
                    <span style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      backgroundColor: report.severity === 'Critical' ? '#cc0000' : report.severity === 'High' ? '#ff5252' : report.severity === 'Medium' ? '#ffb84d' : '#4caf50',
                      color: 'white',
                      fontWeight: 'bold'
                    }}>
                      {report.severity}
                    </span>
                  </div>

                  {report.description && (
                    <p style={{ color: '#bbb', marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      📝 {report.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#999', fontSize: '14px' }}>Reported: {new Date(report.created_at).toLocaleDateString()}</span>
                    <select
                      value={report.status}
                      onChange={(e) => handleUpdateStatus(report.id, e.target.value)}
                      style={{
                        padding: '8px 15px',
                        backgroundColor: 'rgba(60, 60, 90, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        color: 'white',
                        cursor: 'pointer'
                      }}
                    >
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