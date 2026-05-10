import React, { useState, useEffect, Suspense } from "react";
import { Canvas } from '@react-three/fiber';
import { Float, Stars, OrbitControls } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, ShieldAlert, Zap, FileText, AlertTriangle, 
  Bell, LogOut, ChevronRight, Activity, Settings, Info
} from 'lucide-react';
import DamageAssessment from "./DamageAssessment";
import ResourceAllocation from "./ResourceAllocation";
import ReportDisaster from "./ReportDisaster";
import Overview from "./Overview";
import ReportsManagement from "./ReportsManagement";
import NotificationBell from "./NotificationBell";
import "./Dashboard.css";

// 3D Animated background for Operational Intelligence
function DashboardBackground() {
  return (
    <Float speed={1} rotationIntensity={0.2} floatIntensity={0.2}>
      <mesh>
        <sphereGeometry args={[4, 64, 64]} />
        <meshStandardMaterial
          color="#1e293b"
          wireframe
          transparent
          opacity={0.06}
        />
      </mesh>
    </Float>
  );
}

const navItems = [
  { id: "overview", label: "Overview", icon: <LayoutDashboard size={20} /> },
  { id: "damage", label: "Damage Assessment", icon: <ShieldAlert size={20} /> },
  { id: "resources", label: "Resource Allocation", icon: <Zap size={20} /> },
  { id: "reports", label: "Incident Reports", icon: <FileText size={20} /> },
  { id: "report-disaster", label: "New Report", icon: <AlertTriangle size={20} /> },
];

function Dashboard() {
  const [activeSection, setActiveSection] = useState("overview");
  const [pendingCount, setPendingCount] = useState(0);
  const [officerName, setOfficerName] = useState("OF");
  const [focusLocation, setFocusLocation] = useState(null);

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.name) {
          const initials = payload.name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
          setOfficerName(initials);
        }
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/disaster/stats");
        const data = await res.json();
        if (data.success) setPendingCount(data.stats.pending);
      } catch (_) {}
    };
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = (notif) => {
    if (notif.latitude && notif.longitude) {
      setFocusLocation({ latitude: notif.latitude, longitude: notif.longitude });
      setActiveSection("overview");
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case "overview": return <Overview onNavigate={setActiveSection} focusLocation={focusLocation} />;
      case "damage": return <DamageAssessment />;
      case "resources": return <ResourceAllocation />;
      case "reports": return <ReportsManagement />;
      case "report-disaster": return <ReportDisaster />;
      default: return null;
    }
  };

  const activeItem = navItems.find((item) => item.id === activeSection);

  return (
    <div className="db3d">
      
      {/* 3D Scene Layer */}
      <div className="db3d__canvas">
        <Canvas camera={{ position: [0, 0, 10] }}>
          <Suspense fallback={null}>
            <ambientLight intensity={1} />
            <Stars radius={100} depth={50} count={5000} factor={4} />
            <DashboardBackground />
            <OrbitControls enableZoom={false} enablePan={false} />
          </Suspense>
        </Canvas>
      </div>

      {/* Glass Sidebar */}
      <aside className="db3d__sidebar">
        <motion.div 
          className="db3d__logo"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="db3d__mark">RV</div>
          <span className="db3d__name">RescueVision</span>
        </motion.div>

        <div className="db3d__label">Management</div>

        <nav className="db3d__nav">
          {navItems.map((item) => (
            <motion.button
              key={item.id}
              className={`db3d__nav-btn ${activeSection === item.id ? "active" : ""}`}
              onClick={() => setActiveSection(item.id)}
              whileHover={{ x: 5 }}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.id === "reports" && pendingCount > 0 && (
                <span className="db3d__badge">{pendingCount}</span>
              )}
            </motion.button>
          ))}
        </nav>

        <div className="db3d__label">Account</div>
        <div style={{ padding: '0 1rem' }}>
          <button className="db3d__nav-btn" style={{ color: '#ef4444' }} onClick={() => { localStorage.removeItem("token"); window.location.reload(); }}>
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>

        <div className="db3d__sidebar-footer">
          <div className="db3d__status-dot"></div>
          <span className="db3d__status-text">Operational</span>
        </div>
      </aside>

      {/* Activity Area */}
      <div className="db3d__body">
        
        {/* Dynamic Topbar */}
        <header className="db3d__topbar">
          <motion.div 
            className="db3d__breadcrumb"
            key={activeSection}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <span className="db3d__breadcrumb-root">Dashboard</span>
            <ChevronRight size={14} className="db3d__breadcrumb-sep" />
            <span className="db3d__breadcrumb-current">{activeItem?.label}</span>
          </motion.div>

          <div className="db3d__actions">
            <NotificationBell onNotificationClick={handleNotificationClick} />

            <div className="db3d__avatar">
              {officerName}
            </div>
          </div>
        </header>

        {/* Content View with Page Transitions */}
        <main className="db3d__main">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.3 }}
              style={{ minHeight: '100%' }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>

      </div>
    </div>
  );
}

export default Dashboard;