import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-control-geocoder/dist/Control.Geocoder.css';
import 'leaflet-control-geocoder';
import { io } from "socket.io-client";
import ResourceManagementPanel from './ResourceManagementPanel';
import { Shield, Bell, Download, LogOut, Activity, Users, Truck, Wrench, Menu, X, CheckCircle, Clock, AlertTriangle, Search, Filter } from 'lucide-react';


const EnhancedOfficerDashboard = () => {
  const navigate = useNavigate();
  const [officer, setOfficer] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedSeverity, setSelectedSeverity] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [reportNotifications, setReportNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [resources, setResources] = useState({
    personnel: { available: 45, deployed: 23, total: 68 },
    vehicles: { available: 12, deployed: 8, total: 20 },
    equipment: { available: 30, deployed: 15, total: 45 }
  });
  const [activityFeed, setActivityFeed] = useState([]);
  const [broadcastAlerts, setBroadcastAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [emergencyAlert, setEmergencyAlert] = useState(null);
  const [statsHistory, setStatsHistory] = useState([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [mapLayer, setMapLayer] = useState('street');

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const notificationRef = useRef(null);
  const quickActionsRef = useRef(null);
  const exportRef = useRef(null);
  const [, forceUpdate] = useState(0);

  // Toast notification system
  const showToast = useCallback((message, type = 'info', persist = false) => {
    const id = Date.now();
    const notification = { id, message, type, timestamp: new Date(), persist };
    setNotifications(prev => [...prev, notification]);

    // Auto-remove after 5 seconds (unless persist)
    if (!persist) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, 5000);
    }
  }, []);

  // Add to activity feed
  const addActivity = useCallback((action, details, isUnread = true) => {
    const activity = {
      id: Date.now(),
      action,
      details,
      timestamp: new Date(),
      officer: officer?.name || 'System',
      read: !isUnread,
      broadcast: false // flag for broadcasts
    };
    setActivityFeed(prev => {
      const newFeed = [activity, ...prev].slice(0, 100); // increased limit
      // Persist to localStorage
      try {
        localStorage.setItem('dashboardActivityFeed', JSON.stringify(newFeed));
      } catch (e) {
        console.warn('localStorage activity save failed:', e);
      }
      return newFeed;
    });
    if (isUnread) {
      setUnreadCount(prev => prev + 1);
    }
  }, [officer]);

  // Load persistent activity feed
  const loadActivityFeed = useCallback(() => {
    try {
      const saved = localStorage.getItem('dashboardActivityFeed');
      if (saved) {
        const feed = JSON.parse(saved).filter(a => {
          const age = new Date() - new Date(a.timestamp);
          return age < 24 * 60 * 60 * 1000; // 24h
        });
        setActivityFeed(feed);
        const unread = feed.filter(a => !a.read).length;
        setUnreadCount(unread);
      }
    } catch (e) {
      console.warn('Failed to load activity feed:', e);
    }
  }, []);

  // Initialize officer data + load activity
  useEffect(() => {
    loadActivityFeed();
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
  }, [navigate, loadActivityFeed]);

  // Fetch reports
  useEffect(() => {
    if (officer) {
      fetchReports();
    }
  }, [officer]);

  // Initialize map
  useEffect(() => {
    if (activeTab === 'overview' && mapRef.current && !mapInstanceRef.current) {
      initializeMap();
    }
  }, [activeTab]);

  // Auto-refresh timer
  useEffect(() => {
    const timer = setInterval(() => {
      forceUpdate(n => n + 1);
      // Update stats history every minute
      setStatsHistory(prev => [...prev, {
        timestamp: new Date(),
        stats: calculateStats()
      }].slice(-60)); // Keep last 60 minutes
    }, 60000);

    return () => clearInterval(timer);
  }, [reports]);

  // Socket.io real-time updates
  useEffect(() => {
    const socket = io("http://127.0.0.1:5000");

    socket.on("connect", () => {
      showToast('Connected to real-time updates', 'success');
    });

    socket.on("disconnect", () => {
      showToast('Connection lost. Reconnecting...', 'warning');
    });

    socket.on("new_disaster_report", (report) => {
      setReports(prev => [report, ...prev]);
      showToast(`New ${report.severity} priority report: ${report.name}`,
        report.severity === 'Critical' ? 'error' : 'warning');
      addActivity('New Report', `${report.name} - ${report.location}`);
      // Push into the dedicated report notifications list
      setReportNotifications(prev => [{
        id: report.id || Date.now(),
        name: report.name,
        location: report.location,
        severity: report.severity,
        reporter: report.reporter_name,
        timestamp: report.created_at || new Date(),
        read: false
      }, ...prev].slice(0, 50));
      setUnreadCount(prev => prev + 1);

      // Check for critical alerts
      if (report.severity === 'Critical') {
        setEmergencyAlert({
          title: 'CRITICAL ALERT',
          message: report.name,
          location: report.location,
          report
        });
      }
    });

    socket.on("disaster_status_updated", (data) => {
      setReports(prev =>
        prev.map(r =>
          r.id === data.report_id
            ? { ...r, status: data.new_status }
            : r
        ));
      showToast(`Status updated to ${data.new_status}`, 'success');
      addActivity('Status Update', `Report #${data.report_id} → ${data.new_status}`);
    });

    // Listen for incoming broadcast alerts from any officer
    socket.on("broadcast_alert", (data) => {
      setBroadcastAlerts(prev => [{
        id: Date.now(),
        message: data.message,
        priority: data.priority,
        officer: data.officer || 'System',
        timestamp: new Date()
      }, ...prev].slice(0, 20));
      if (data.officer !== officer?.name) {
        showToast(`📢 Alert from ${data.officer}: ${data.message}`, 'warning', true);
        setUnreadCount(prev => prev + 1);
      }
    });

    return () => socket.disconnect();
  }, [showToast, addActivity]);

  // Update map markers
  useEffect(() => {
    if (activeTab === 'overview' && mapInstanceRef.current && reports.length > 0) {
      updateMapMarkers();
    }
  }, [reports, activeTab, mapLayer]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (quickActionsRef.current && !quickActionsRef.current.contains(e.target)) {
        setShowQuickActions(false);
      }
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initializeMap = () => {
    try {
      if (mapInstanceRef.current) return;

      const defaultCenter = [9.5915, 76.5215];
      const map = L.map(mapRef.current, {
        center: defaultCenter,
        zoom: 8,
        attributionControl: true
      });

      // Multiple map layers
      const layers = {
        street: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }),
        satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: '© Esri',
          maxZoom: 19,
        }),
        terrain: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenTopoMap',
          maxZoom: 17,
        })
      };

      layers.street.addTo(map);
      map.layers = layers;
      map.currentLayer = 'street';

      L.Control.geocoder().addTo(map);
      L.control.scale().addTo(map);

      // Custom zoom controls with refresh
      const customControls = L.control({ position: 'topright' });
      customControls.onAdd = () => {
        const div = L.DomUtil.create('div', 'leaflet-control leaflet-bar custom-controls');
        div.innerHTML = `
          <button class="refresh-btn" title="Refresh Data" style="width:34px;height:34px;background:white;border:1px solid #ccc;border-radius:4px;cursor:pointer;font-size:16px;">🔄</button>
          <button class="fullscreen-btn" title="Toggle Fullscreen" style="width:34px;height:34px;background:white;border:1px solid #ccc;border-radius:4px;cursor:pointer;font-size:16px;">⛶</button>
          <button class="layer-btn" title="Change Map Layer" style="width:34px;height:34px;background:white;border:1px solid #ccc;border-radius:4px;cursor:pointer;font-size:16px;">🗺️</button>
        `;
        return div;
      };
      customControls.addTo(map);

      mapInstanceRef.current = map;
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  };

  const fetchReports = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/disaster/reports');
      const data = await response.json();

      if (data.success) {
        setReports(data.reports || []);
        addActivity('Data Sync', `Loaded ${data.reports?.length || 0} reports`);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
      showToast('Failed to fetch reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (reportId, newStatus) => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/disaster/report/${reportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setReports(reports.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r)));
        showToast('Status updated successfully!', 'success');
        addActivity('Status Change', `Report #${reportId} → ${newStatus}`);
      }
    } catch (err) {
      console.error('Error updating status:', err);
      showToast('Failed to update status', 'error');
    }
  };

  const handleBroadcastAlert = async (message, priority) => {
    try {
      const socket = io("http://127.0.0.1:5000");
      socket.emit('broadcast_alert', { message, priority, officer: officer?.name });
      socket.disconnect();

      // Store in local broadcast history immediately
      setBroadcastAlerts(prev => [{
        id: Date.now(),
        message,
        priority,
        officer: officer?.name || 'You',
        timestamp: new Date()
      }, ...prev].slice(0, 20));

      showToast(`📢 Alert "${message}" broadcast to all (Priority: ${priority})`, 'success', true);
      addActivity('📢 BROADCAST', `${priority}: ${message}`, true);
    } catch (err) {
      showToast('Failed to broadcast alert', 'error');
    }
  };

  const handleDeployResources = async (reportId, resourceType) => {
    try {
      setResources(prev => ({
        ...prev,
        [resourceType]: {
          ...prev[resourceType],
          available: prev[resourceType].available - 1,
          deployed: prev[resourceType].deployed + 1
        }
      }));
      showToast(`${resourceType} deployed successfully!`, 'success');
      addActivity('Resource Deployed', `${resourceType} → Report #${reportId}`);
    } catch (err) {
      showToast('Failed to deploy resource', 'error');
    }
  };

  const handleExport = (format) => {
    const data = filteredReports.map(r => ({
      ID: r.id,
      Name: r.name,
      Location: r.location,
      Severity: r.severity,
      Status: r.status,
      Reporter: r.reporter_name,
      Date: new Date(r.created_at).toLocaleDateString()
    }));

    if (format === 'csv') {
      const csv = [
        Object.keys(data[0] || {}).join(','),
        ...data.map(row => Object.values(row).join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `disaster_reports_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      showToast('CSV exported successfully!', 'success');
    } else if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `disaster_reports_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      showToast('JSON exported successfully!', 'success');
    }

    setShowExportMenu(false);
    addActivity('Export', `Exported ${data.length} reports as ${format.toUpperCase()}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('officer_token');
    localStorage.removeItem('officer_data');
    navigate('/officer/login');
  };

  const getSeverityColor = (severity) => {
    const colors = {
      'Critical': '#ff5252',
      'High': '#ff9800',
      'Medium': '#2196f3',
      'Low': '#4caf50'
    };
    return colors[severity] || '#999';
  };

  const getStatusColor = (status) => {
    const colors = {
      'Pending': '#ff9800',
      'In Progress': '#2196f3',
      'Completed': '#4caf50'
    };
    return colors[status] || '#999';
  };

  const getResponseTime = (createdAt) => {
    if (!createdAt) return "Just now";
    const diff = new Date() - new Date(createdAt);
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  const calculateStats = () => ({
    total: reports.length,
    pending: reports.filter(r => r.status === 'Pending').length,
    inProgress: reports.filter(r => r.status === 'In Progress').length,
    completed: reports.filter(r => r.status === 'Completed').length,
    critical: reports.filter(r => r.severity === 'Critical').length,
    high: reports.filter(r => r.severity === 'High').length,
    resolutionRate: reports.length > 0
      ? Math.round((reports.filter(r => r.status === 'Completed').length / reports.length) * 100)
      : 0
  });

  const stats = calculateStats();

  // Advanced filtering
  const filteredReports = reports.filter(r => {
    const matchesStatus = selectedStatus === 'All' || r.status === selectedStatus;
    const matchesSeverity = selectedSeverity === 'All' || r.severity === selectedSeverity;
    const matchesSearch = !searchQuery ||
      r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reporter_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDateRange = (!dateRange.start || new Date(r.created_at) >= new Date(dateRange.start)) &&
      (!dateRange.end || new Date(r.created_at) <= new Date(dateRange.end));

    return matchesStatus && matchesSeverity && matchesSearch && matchesDateRange;
  });

  const highPriorityReports = reports
    .filter(r => ['Critical', 'High'].includes(r.severity))
    .slice(0, 5);

  // Calculate trends
  const getTrend = (current, previous) => {
    if (!previous) return null;
    const diff = current - previous;
    return diff > 0 ? `+${diff}` : diff < 0 ? `${diff}` : '0';
  };

  const createCustomMarker = (severity, status) => {
    const color = getSeverityColor(severity);
    const isCompleted = status === 'Completed';
    return L.divIcon({
      html: `<div style="
        width: 36px;
        height: 36px;
        background: ${isCompleted ? '#4caf50' : `linear-gradient(135deg, ${color}, ${color}dd)`};
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        cursor: pointer;
        ${isCompleted ? 'opacity: 0.7;' : ''}
      ">${isCompleted ? '✓' : '📍'}</div>`,
      iconSize: [36, 36],
      className: 'custom-marker',
    });
  };

  const updateMapMarkers = () => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) map.removeLayer(layer);
    });

    const bounds = L.latLngBounds();
    let hasMarkers = false;

    reports.forEach((report) => {
      const lat = parseFloat(report.latitude) || (9.5915 + (report.id * 0.05) % 0.5);
      const lng = parseFloat(report.longitude) || (76.5215 + (report.id * 0.03) % 0.5);

      const marker = L.marker([lat, lng], {
        icon: createCustomMarker(report.severity, report.status),
        title: report.name
      }).addTo(map);

      const popupContent = `
        <div style="font-family: Arial; color: #333; min-width: 280px; padding: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h4 style="margin: 0; color: #1a1a2e;">${report.name}</h4>
            <span style="background: ${getSeverityColor(report.severity)}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
              ${report.severity}
            </span>
          </div>
          <div style="background: #f5f5f5; padding: 10px; border-radius: 6px; margin-bottom: 10px;">
            <p style="margin: 4px 0; font-size: 13px;"><strong>📍 Location:</strong> ${report.location}</p>
            <p style="margin: 4px 0; font-size: 13px;"><strong>📊 Status:</strong> <span style="color: ${getStatusColor(report.status)}; font-weight: 600;">${report.status}</span></p>
            <p style="margin: 4px 0; font-size: 13px;"><strong>👤 Reporter:</strong> ${report.reporter_name}</p>
            ${report.reporter_phone ? `<p style="margin: 4px 0; font-size: 13px;"><strong>📱 Phone:</strong> ${report.reporter_phone}</p>` : ''}
          </div>
          <div style="display: flex; gap: 8px; justify-content: space-between; align-items: center;">
            <span style="font-size: 11px; color: #666;">📅 ${new Date(report.created_at).toLocaleString()}</span>
            <span style="font-size: 11px; color: #666;">⏱ ${getResponseTime(report.created_at)}</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, { maxWidth: 320 });
      bounds.extend([lat, lng]);
      hasMarkers = true;
    });

    if (hasMarkers) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  // Styles object
  const styles = {
    container: {
      maxWidth: '100%',
      margin: '0 auto',
      padding: '24px 32px',
      background: '#09090b',
      minHeight: '100vh',
      color: '#f8fafc',
      fontFamily: "'Inter', sans-serif"
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '28px',
      padding: '20px 24px',
      background: 'linear-gradient(to bottom, #111827, #13192b)',
      borderRadius: '16px',
      border: '1px solid #1e293b',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    },
    logoIcon: {
      width: '48px',
      height: '48px',
      background: 'rgba(59, 130, 246, 0.1)',
      border: '1px solid rgba(59, 130, 246, 0.3)',
      color: '#3b82f6',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    headerActions: {
      display: 'flex',
      gap: '16px',
      alignItems: 'center'
    },
    notificationBell: {
      position: 'relative',
      padding: '12px',
      background: 'rgba(30, 41, 59, 0.5)',
      border: '1px solid #334155',
      borderRadius: '10px',
      cursor: 'pointer',
      color: '#94a3b8',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s'
    },
    notificationBadge: {
      position: 'absolute',
      top: '-6px',
      right: '-6px',
      background: '#ef4444',
      color: 'white',
      borderRadius: '50%',
      width: '20px',
      height: '20px',
      fontSize: '11px',
      fontWeight: 'bold',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '2px solid #13192b'
    },
    emergencyBanner: {
      background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05))',
      borderLeft: '4px solid #ef4444',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      padding: '16px 24px',
      borderRadius: '12px',
      marginBottom: '24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      animation: 'pulse 2s infinite'
    },
    welcomeCard: {
      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.05))',
      padding: '24px 32px',
      borderRadius: '16px',
      marginBottom: '28px',
      border: '1px solid rgba(59, 130, 246, 0.2)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    tabs: {
      display: 'flex',
      gap: '12px',
      marginBottom: '24px',
      flexWrap: 'wrap',
      background: '#1e293b',
      padding: '6px',
      borderRadius: '12px',
      width: 'fit-content'
    },
    tab: (isActive) => ({
      padding: '10px 20px',
      background: isActive ? '#3b82f6' : 'transparent',
      border: 'none',
      borderRadius: '8px',
      color: isActive ? 'white' : '#94a3b8',
      cursor: 'pointer',
      fontSize: '0.9rem',
      fontWeight: isActive ? 'bold' : '500',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }),
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '20px',
      marginBottom: '24px'
    },
    statCard: (color) => ({
      background: '#1e293b',
      padding: '24px',
      borderRadius: '16px',
      border: '1px solid #334155',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      position: 'relative',
      overflow: 'hidden'
    }),
    statValue: (color) => ({
      fontSize: '2.5rem',
      fontWeight: 'bold',
      color: 'white',
      margin: '12px 0 4px'
    }),
    statLabel: {
      fontSize: '0.875rem',
      color: '#94a3b8',
      fontWeight: '500'
    },
    statTrend: (isPositive) => ({
      fontSize: '0.75rem',
      color: isPositive ? '#10b981' : '#ef4444',
      background: isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
      padding: '4px 8px',
      borderRadius: '20px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      fontWeight: 'bold'
    }),
    mainGrid: {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr',
      gap: '24px',
      marginBottom: '24px'
    },
    card: {
      background: '#13192b',
      borderRadius: '16px',
      border: '1px solid #1e293b',
      overflow: 'hidden',
      boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
    },
    cardHeader: {
      padding: '20px 24px',
      borderBottom: '1px solid #1e293b',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: 'linear-gradient(to bottom, #1e293b, #13192b)'
    },
    cardTitle: {
      margin: 0,
      fontSize: '1.1rem',
      fontWeight: 'bold',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: 'white'
    },
    cardBody: {
      padding: '24px'
    },
    mapContainer: {
      height: '500px',
      borderRadius: '12px',
      overflow: 'hidden',
      border: '1px solid #1e293b'
    },
    priorityItem: {
      padding: '16px',
      background: '#0f172a',
      borderRadius: '12px',
      marginBottom: '12px',
      border: '1px solid #1e293b',
      borderLeft: '4px solid #ef4444',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px'
    },
    resourceGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '16px',
      marginTop: '16px'
    },
    resourceCard: (type) => ({
      padding: '20px',
      background: '#0f172a',
      borderRadius: '12px',
      border: '1px solid #1e293b',
      textAlign: 'center',
      position: 'relative'
    }),
    progressBar: {
      height: '8px',
      background: '#334155',
      borderRadius: '4px',
      marginTop: '12px',
      overflow: 'hidden'
    },
    progressFill: (percentage, color) => ({
      width: `${percentage}%`,
      height: '100%',
      background: color,
      borderRadius: '4px',
      transition: 'width 0.3s ease',
      boxShadow: `0 0 10px ${color}80`
    }),
    activityItem: {
      padding: '12px',
      borderBottom: '1px solid #1e293b',
      fontSize: '0.85rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px'
    },
    searchBox: {
      display: 'flex',
      gap: '12px',
      marginBottom: '24px',
      flexWrap: 'wrap'
    },
    searchInput: {
      flex: 1,
      minWidth: '250px',
      padding: '12px 16px',
      background: '#13192b',
      border: '1px solid #334155',
      borderRadius: '10px',
      color: 'white',
      fontSize: '0.95rem',
      outline: 'none'
    },
    select: {
      padding: '12px 16px',
      background: '#13192b',
      border: '1px solid #334155',
      borderRadius: '10px',
      color: 'white',
      cursor: 'pointer',
      minWidth: '150px',
      outline: 'none',
      appearance: 'none', // removes default dropdown arrow for cleaner look on some browsers
    },
    button: (variant) => ({
      padding: '10px 20px',
      background: variant === 'primary' ? '#3b82f6'
        : variant === 'danger' ? 'rgba(239, 68, 68, 0.1)'
          : variant === 'success' ? '#10b981'
            : '#1e293b',
      border: variant === 'danger' ? '1px solid rgba(239, 68, 68, 0.3)' : variant === 'primary' || variant === 'success' ? 'none' : '1px solid #334155',
      borderRadius: '10px',
      color: variant === 'danger' ? '#ef4444' : 'white',
      cursor: 'pointer',
      fontSize: '0.9rem',
      fontWeight: 'bold',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s',
    }),
    reportCard: {
      background: '#13192b',
      padding: '24px',
      borderRadius: '16px',
      border: '1px solid #1e293b',
      marginBottom: '16px',
      transition: 'border-color 0.2s'
    },
    toast: (type) => ({
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      padding: '16px 24px',
      background: type === 'success' ? '#10b981'
        : type === 'error' ? '#ef4444'
          : type === 'warning' ? '#f59e0b'
            : '#3b82f6',
      borderRadius: '12px',
      color: 'white',
      boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
      zIndex: 10000,
      animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontWeight: 'bold'
    }),
    dropdown: {
      position: 'absolute',
      top: 'calc(100% + 8px)',
      right: 0,
      background: '#1e293b',
      border: '1px solid #334155',
      borderRadius: '12px',
      minWidth: '220px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
      zIndex: 1000,
      overflow: 'hidden'
    },
    dropdownItem: {
      padding: '14px 16px',
      cursor: 'pointer',
      borderBottom: '1px solid #1e293b',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      transition: 'background 0.2s ease',
      fontSize: '0.9rem',
      color: '#cbd5e1'
    },
    quickActionButton: (color) => ({
      padding: '16px',
      background: `rgba(${color}, 0.1)`,
      border: `1px solid rgba(${color}, 0.2)`,
      borderRadius: '12px',
      cursor: 'pointer',
      textAlign: 'center',
      transition: 'all 0.2s',
      color: `rgb(${color})`,
      fontWeight: 'bold'
    })
  };

  if (!officer) {
    return (
      <div style={{ ...styles.container, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '20px' }}>⏳</div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Toast Notifications */}
      <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999 }}>
        {notifications.map(n => (
          <div key={n.id} style={styles.toast(n.type)}>
            <strong>{n.type.toUpperCase()}:</strong> {n.message}
          </div>
        ))}
      </div>

      {/* Emergency Alert Banner */}
      {emergencyAlert && (
        <div style={styles.emergencyBanner}>
          <div>
            <strong>🚨 {emergencyAlert.title}:</strong> {emergencyAlert.message}
            <span style={{ marginLeft: '10px', opacity: 0.8 }}>📍 {emergencyAlert.location}</span>
          </div>
          <button
            onClick={() => setEmergencyAlert(null)}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer' }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>🛡️</div>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px' }}>Disaster Response Center</h1>
            <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>Officer Command Dashboard</p>
          </div>
        </div>

        <div style={styles.headerActions}>
          {/* Quick Actions */}
          <div ref={quickActionsRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowQuickActions(prev => !prev)}
              style={styles.button('primary')}
            >
              ⚡ Quick Actions
            </button>
            {showQuickActions && (
              <div style={styles.dropdown}>
                <div style={styles.dropdownItem} onClick={() => { handleBroadcastAlert('Test Alert', 'Medium'); setShowQuickActions(false); }}>
                  📢 Broadcast Alert
                </div>
                <div style={styles.dropdownItem} onClick={() => { setActiveTab('reports'); setShowQuickActions(false); }}>
                  📋 View All Reports
                </div>
                <div style={styles.dropdownItem} onClick={() => { fetchReports(); setShowQuickActions(false); }}>
                  🔄 Refresh Data
                </div>
              </div>
            )}
          </div>

          {/* Notifications */}
          <div ref={notificationRef} style={{ position: 'relative' }}>
            <button
              onClick={() => {
                setShowNotifications(prev => !prev);
                if (unreadCount > 0) {
                  setUnreadCount(0);
                  setReportNotifications(prev => prev.map(n => ({ ...n, read: true })));
                  setActivityFeed(prev => prev.map(a => ({ ...a, read: true })));
                  localStorage.setItem('dashboardActivityFeed', JSON.stringify(activityFeed.map(a => ({ ...a, read: true }))));
                }
              }}
              style={styles.notificationBell}
            >
              🔔
              {unreadCount > 0 && <div style={styles.notificationBadge}>{unreadCount > 9 ? '9+' : unreadCount}</div>}
            </button>
            {showNotifications && (
              <div style={{ ...styles.dropdown, minWidth: '340px', maxHeight: '480px', overflowY: 'auto' }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.95rem' }}>🔔 Disaster Reports</strong>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{reportNotifications.length} total</span>
                </div>
                {reportNotifications.length > 0 ? reportNotifications.map(n => (
                  <div key={n.id} style={{ ...styles.dropdownItem, flexDirection: 'column', alignItems: 'flex-start', gap: '4px', background: n.read ? 'transparent' : 'rgba(59,130,246,0.05)', borderLeft: n.read ? 'none' : '3px solid #3b82f6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'white' }}>🚨 {n.name}</span>
                      <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: n.severity === 'Critical' ? '#ef4444' : n.severity === 'High' ? '#f59e0b' : n.severity === 'Medium' ? '#3b82f6' : '#10b981', color: 'white', fontWeight: 'bold' }}>{n.severity}</span>
                    </div>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>📍 {n.location}</span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>👤 {n.reporter} • {new Date(n.timestamp).toLocaleTimeString()}</span>
                  </div>
                )) : (
                  <div style={{ padding: '30px 20px', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📭</div>
                    <div>No disaster reports yet</div>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>New reports will appear here in real-time</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Export */}
          <div ref={exportRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowExportMenu(prev => !prev)}
              style={styles.button()}
            >
              📥 Export
            </button>
            {showExportMenu && (
              <div style={styles.dropdown}>
                <div style={styles.dropdownItem} onClick={() => { handleExport('csv'); }}>
                  📄 Export as CSV
                </div>
                <div style={styles.dropdownItem} onClick={() => { handleExport('json'); }}>
                  📋 Export as JSON
                </div>
                <div style={styles.dropdownItem} onClick={() => { window.print(); setShowExportMenu(false); }}>
                  🖨️ Print Report
                </div>
              </div>
            )}
          </div>

          {/* User Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 15px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}>
            <span>👤 {officer.name}</span>
          </div>

          <button onClick={handleLogout} style={styles.button('danger')}>
            Logout
          </button>
        </div>
      </header>

      {/* Welcome Card */}
      <div style={styles.welcomeCard}>
        <div>
          <h2 style={{ margin: '0 0 5px' }}>Welcome back, {officer.name}! 👋</h2>
          <p style={{ margin: 0, color: '#aaa', fontSize: '14px' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '12px', color: '#888' }}>System Status</div>
          <div style={{ color: '#4caf50', fontWeight: 'bold' }}>● All Systems Operational</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {[
          { id: 'overview', label: '📊 Overview & Map', icon: '📊' },
          { id: 'reports', label: '📋 All Reports', icon: '📋' },
          { id: 'resources', label: '🚒 Resources', icon: '🚒' },
          { id: 'analytics', label: '📈 Analytics', icon: '📈' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={styles.tab(activeTab === tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Statistics Cards */}
          <div style={styles.statsGrid}>
            {[
              { title: 'Total Reports', value: stats.total, color: '#8b5cf6', icon: '📋', trend: '+3' },
              { title: 'Pending', value: stats.pending, color: '#ff9800', icon: '⏳', trend: '-2' },
              { title: 'In Progress', value: stats.inProgress, color: '#2196f3', icon: '🔄', trend: '+1' },
              { title: 'Completed', value: stats.completed, color: '#4caf50', icon: '✅', trend: '+5' },
              { title: 'Critical', value: stats.critical, color: '#ff5252', icon: '🚨', trend: '0' },
              { title: 'Resolution Rate', value: `${stats.resolutionRate}%`, color: '#4caf50', icon: '📊', trend: '+5%' }
            ].map((stat, idx) => (
              <div key={idx} style={styles.statCard(stat.color)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '24px' }}>{stat.icon}</span>
                  <span style={styles.statTrend(!stat.trend.startsWith('-'))}>
                    {stat.trend.startsWith('+') ? '↑' : stat.trend.startsWith('-') ? '↓' : '•'} {stat.trend}
                  </span>
                </div>
                <div style={styles.statValue(stat.color)}>{stat.value}</div>
                <div style={styles.statLabel}>{stat.title}</div>
              </div>
            ))}
          </div>

          {/* Map and Priority Cases */}
          <div style={styles.mainGrid}>
            {/* Map */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>📍 Incident Map</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => {
                    const map = mapInstanceRef.current;
                    if (map && map.layers) {
                      map.removeLayer(map.layers[map.currentLayer]);
                      const nextLayer = map.currentLayer === 'street' ? 'satellite' : map.currentLayer === 'satellite' ? 'terrain' : 'street';
                      map.layers[nextLayer].addTo(map);
                      map.currentLayer = nextLayer;
                    }
                  }} style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer', fontSize: '12px' }}>
                    🗺️ Layer
                  </button>
                </div>
              </div>
              <div style={styles.cardBody}>
                <div ref={mapRef} style={styles.mapContainer} />
              </div>
            </div>

            {/* High Priority & Resources */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {/* High Priority Cases */}
              <div style={styles.card}>
                <div style={{ ...styles.cardHeader, background: 'linear-gradient(90deg, rgba(255,82,82,0.2), transparent)' }}>
                  <h3 style={{ ...styles.cardTitle, color: '#ff5252' }}>🚨 High Priority Cases</h3>
                </div>
                <div style={{ ...styles.cardBody, maxHeight: '200px', overflowY: 'auto' }}>
                  {highPriorityReports.length > 0 ? highPriorityReports.map(report => (
                    <div key={report.id} style={styles.priorityItem}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <strong style={{ fontSize: '14px' }}>{report.name}</strong>
                        <span style={{
                          background: getSeverityColor(report.severity),
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          color: 'white'
                        }}>
                          {report.severity}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#aaa' }}>📍 {report.location}</div>
                      <div style={{ fontSize: '11px', color: '#888', marginTop: '5px' }}>
                        ⏱ {getResponseTime(report.created_at)} ago
                      </div>
                    </div>
                  )) : (
                    <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>No high priority cases</p>
                  )}
                </div>
              </div>

              {/* Resources Overview */}
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.cardTitle}>🚒 Resource Status</h3>
                </div>
                <div style={styles.cardBody}>
                  <div style={styles.resourceGrid}>
                    {[
                      { type: 'personnel', icon: '👥', label: 'Personnel', ...resources.personnel, color: '#8b5cf6' },
                      { type: 'vehicles', icon: '🚒', label: 'Vehicles', ...resources.vehicles, color: '#ff9800' },
                      { type: 'equipment', icon: '🔧', label: 'Equipment', ...resources.equipment, color: '#2196f3' }
                    ].map(r => (
                      <div key={r.type} style={styles.resourceCard(r.type)}>
                        <div style={{ fontSize: '24px', marginBottom: '5px' }}>{r.icon}</div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: r.color }}>{r.available}</div>
                        <div style={{ fontSize: '11px', color: '#888' }}>{r.label} Available</div>
                        <div style={styles.progressBar}>
                          <div style={styles.progressFill((r.deployed / r.total) * 100, r.color)} />
                        </div>
                        <div style={{ fontSize: '10px', color: '#666', marginTop: '5px' }}>
                          {r.deployed}/{r.total} deployed
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Activity Feed */}
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.cardTitle}>📝 Recent Activity</h3>
                </div>
                <div style={{ ...styles.cardBody, maxHeight: '150px', overflowY: 'auto', padding: '10px' }}>
                  {activityFeed.length > 0 ? activityFeed.slice(0, 5).map(a => (
                    <div key={a.id} style={styles.activityItem}>
                      <span style={{ color: '#8b5cf6' }}>{a.action}</span>: {a.details}
                      <span style={{ float: 'right', color: '#666', fontSize: '11px' }}>
                        {new Date(a.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  )) : (
                    <p style={{ color: '#666', textAlign: 'center', padding: '10px' }}>No recent activity</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Broadcast Alert History */}
          <div style={styles.card}>
            <div style={{ ...styles.cardHeader, background: 'linear-gradient(90deg, rgba(245,158,11,0.1), transparent)' }}>
              <h3 style={{ ...styles.cardTitle, color: '#f59e0b' }}>📢 Broadcast Alert History</h3>
              <button
                onClick={() => {
                  const msg = window.prompt('Enter broadcast message:');
                  const pri = window.prompt('Enter priority (Low/Medium/High/Critical):', 'High');
                  if (msg) handleBroadcastAlert(msg, pri || 'High');
                }}
                style={{ ...styles.button('primary'), padding: '8px 16px', fontSize: '0.85rem', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b' }}
              >
                📢 Send New Alert
              </button>
            </div>
            <div style={{ ...styles.cardBody, maxHeight: '220px', overflowY: 'auto', padding: '0' }}>
              {broadcastAlerts.length > 0 ? broadcastAlerts.map(alert => (
                <div key={alert.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px 20px',
                  borderBottom: '1px solid #1e293b'
                }}>
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
                    background: alert.priority === 'Critical' ? 'rgba(239,68,68,0.15)' : alert.priority === 'High' ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px'
                  }}>
                    {alert.priority === 'Critical' ? '🚨' : alert.priority === 'High' ? '⚠️' : '📢'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'white', marginBottom: '2px' }}>{alert.message}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>Sent by {alert.officer}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', fontWeight: 'bold',
                      background: alert.priority === 'Critical' ? 'rgba(239,68,68,0.2)' : alert.priority === 'High' ? 'rgba(245,158,11,0.2)' : 'rgba(59,130,246,0.2)',
                      color: alert.priority === 'Critical' ? '#ef4444' : alert.priority === 'High' ? '#f59e0b' : '#3b82f6'
                    }}>
                      {alert.priority}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>{new Date(alert.timestamp).toLocaleTimeString()}</div>
                  </div>
                </div>
              )) : (
                <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📭</div>
                  <div>No broadcasts sent yet</div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <>
          {/* Search and Filter */}
          <div style={styles.searchBox}>
            <input
              type="text"
              placeholder="🔍 Search by name, location, or reporter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={styles.select}
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              style={styles.select}
            >
              <option value="All">All Severity</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              style={{ ...styles.select, width: 'auto' }}
            />
            <span style={{ padding: '12px', color: '#666' }}>to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              style={{ ...styles.select, width: 'auto' }}
            />
          </div>

          {/* Results Count */}
          <div style={{ marginBottom: '15px', color: '#888', fontSize: '14px' }}>
            Showing {filteredReports.length} of {reports.length} reports
          </div>

          {/* Reports List */}
          {filteredReports.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>📭</div>
              <p>No reports found matching your criteria</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {filteredReports.map(report => (
                <div key={report.id} style={styles.reportCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                    <div>
                      <h3 style={{ margin: '0 0 8px', fontSize: '18px' }}>📍 {report.name}</h3>
                      <p style={{ color: '#aaa', margin: '0 0 5px', fontSize: '14px' }}>📍 {report.location}</p>
                      <p style={{ color: '#888', margin: 0, fontSize: '13px' }}>👤 Reported by: {report.reporter_name}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        background: getSeverityColor(report.severity),
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '13px'
                      }}>
                        {report.severity}
                      </span>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        background: getStatusColor(report.status),
                        color: 'white',
                        fontSize: '13px'
                      }}>
                        {report.status}
                      </span>
                    </div>
                  </div>

                  {report.description && (
                    <p style={{ color: '#bbb', marginBottom: '15px', fontSize: '14px', lineHeight: '1.5' }}>
                      📝 {report.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: '12px', color: '#888' }}>
                      📅 {new Date(report.created_at).toLocaleString()} • ⏱ {getResponseTime(report.created_at)} ago
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <select
                        value={report.status}
                        onChange={(e) => handleUpdateStatus(report.id, e.target.value)}
                        style={{ ...styles.select, padding: '8px 12px', fontSize: '13px' }}
                      >
                        <option value="Pending">⏳ Pending</option>
                        <option value="In Progress">🔄 In Progress</option>
                        <option value="Completed">✅ Completed</option>
                      </select>
                      <button
                        onClick={() => handleDeployResources(report.id, 'personnel')}
                        style={{ ...styles.button('primary'), padding: '8px 15px', fontSize: '13px' }}
                      >
                        🚀 Deploy
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Resources Tab */}
      {activeTab === 'resources' && (
        <ResourceManagementPanel
          resources={resources}
          onUpdateResources={setResources}
          addActivity={addActivity}
          showToast={showToast}
        />
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'grid', gap: '20px' }}>
          {/* Summary Stats */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>📊 Performance Analytics</h3>
            </div>
            <div style={styles.cardBody}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '12px' }}>
                  <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#8b5cf6' }}>{stats.resolutionRate}%</div>
                  <div style={{ fontSize: '14px', color: '#888' }}>Resolution Rate</div>
                </div>
                <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(33, 150, 243, 0.1)', borderRadius: '12px' }}>
                  <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#2196f3' }}>2h 15m</div>
                  <div style={{ fontSize: '14px', color: '#888' }}>Avg Response Time</div>
                </div>
                <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(76, 175, 80, 0.1)', borderRadius: '12px' }}>
                  <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#4caf50' }}>{stats.completed}</div>
                  <div style={{ fontSize: '14px', color: '#888' }}>Cases Resolved</div>
                </div>
                <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(255, 152, 0, 0.1)', borderRadius: '12px' }}>
                  <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#ff9800' }}>{stats.pending}</div>
                  <div style={{ fontSize: '14px', color: '#888' }}>Pending Cases</div>
                </div>
              </div>
            </div>
          </div>

          {/* Severity Distribution */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>🎯 Severity Distribution</h3>
            </div>
            <div style={styles.cardBody}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
                {[
                  { label: 'Critical', count: stats.critical, color: '#ff5252', percentage: stats.total > 0 ? ((stats.critical / stats.total) * 100).toFixed(1) : 0 },
                  { label: 'High', count: stats.high, color: '#ff9800', percentage: stats.total > 0 ? ((stats.high / stats.total) * 100).toFixed(1) : 0 },
                  { label: 'Medium', count: stats.total - stats.critical - stats.high - reports.filter(r => r.severity === 'Low').length, color: '#2196f3', percentage: stats.total > 0 ? (((stats.total - stats.critical - stats.high - reports.filter(r => r.severity === 'Low').length) / stats.total) * 100).toFixed(1) : 0 },
                  { label: 'Low', count: reports.filter(r => r.severity === 'Low').length, color: '#4caf50', percentage: stats.total > 0 ? ((reports.filter(r => r.severity === 'Low').length / stats.total) * 100).toFixed(1) : 0 }
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center', padding: '15px', background: `${s.color}15`, borderRadius: '10px', border: `1px solid ${s.color}40` }}>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: s.color }}>{s.count}</div>
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>{s.label}</div>
                    <div style={{ fontSize: '11px', color: s.color, marginTop: '3px' }}>{s.percentage}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>📈 Activity Timeline</h3>
            </div>
            <div style={{ ...styles.cardBody, maxHeight: '300px', overflowY: 'auto' }}>
              {activityFeed.length > 0 ? activityFeed.map(a => (
                <div key={a.id} style={{
                  display: 'flex',
                  gap: '15px',
                  padding: '12px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.05)'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: 'rgba(139, 92, 246, 0.2)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    📋
                  </div>
                  <div>
                    <div style={{ fontWeight: '500', marginBottom: '3px' }}>{a.action}</div>
                    <div style={{ fontSize: '13px', color: '#aaa' }}>{a.details}</div>
                    <div style={{ fontSize: '11px', color: '#666', marginTop: '5px' }}>
                      {new Date(a.timestamp).toLocaleString()} • {a.officer}
                    </div>
                  </div>
                </div>
              )) : (
                <p style={{ textAlign: 'center', color: '#666', padding: '30px' }}>No activity recorded yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{
        marginTop: '30px',
        padding: '20px',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        textAlign: 'center',
        color: '#666',
        fontSize: '12px'
      }}>
        <p>© 2024 Disaster Response Management System • Last updated: {new Date().toLocaleString()}</p>
      </footer>

      {/* CSS Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .custom-marker {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
        }
        .leaflet-popup-content {
          margin: 0 !important;
        }
        @media print {
          body * { visibility: hidden; }
          #printArea, #printArea * { visibility: visible; }
          #printArea { position: absolute; left: 0; top: 0; }
        }
        @media (max-width: 768px) {
          .mainGrid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default EnhancedOfficerDashboard;