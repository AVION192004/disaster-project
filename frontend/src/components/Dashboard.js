import React, { useState, useEffect } from "react";
import "./Dashboard.css";
import DamageAssessment from "./DamageAssessment";
import ResourceAllocation from "./ResourceAllocation";
import ReportDisaster from "./ReportDisaster";
import Overview from "./Overview";
import ReportsManagement from "./ReportsManagement";

const navItems = [
  {
    id: "overview",
    label: "Overview",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    id: "damage",
    label: "Damage Assessment",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
  },
  {
    id: "resources",
    label: "Resource Allocation",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
    ),
  },
  {
    id: "reports",
    label: "Reports",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
  {
    id: "report-disaster",
    label: "Report Disaster",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
  },
];

function Dashboard() {
  const [activeSection, setActiveSection] = useState("overview");
  const [pendingCount,  setPendingCount]  = useState(0);
  const [officerName,   setOfficerName]   = useState("OF");

  // Read officer name from JWT stored in localStorage
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

  // Fetch live pending report count for alert badge
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res  = await fetch("http://localhost:5000/api/disaster/stats");
        const data = await res.json();
        if (data.success) setPendingCount(data.stats.pending);
      } catch (_) {}
    };
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const renderContent = () => {
    switch (activeSection) {
      case "overview":        return <Overview        onNavigate={setActiveSection} />;
      case "damage":          return <DamageAssessment />;
      case "resources":       return <ResourceAllocation />;
      case "reports":         return <ReportsManagement />;
      case "report-disaster": return <ReportDisaster />;
      default:                return null;
    }
  };

  const activeItem = navItems.find((item) => item.id === activeSection);

  return (
    <div className="dashboard-page">

      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside className="db-sidebar" aria-label="Dashboard navigation">

        <div className="db-sidebar__header">
          <div className="db-sidebar__logo">
            <span className="db-sidebar__mark">RV</span>
            <span className="db-sidebar__name">RescueVision</span>
          </div>
        </div>

        <div className="db-sidebar__section-label">Operations</div>

        <nav className="db-nav" aria-label="Operations navigation">
          <ul className="db-nav__list" role="list">
            {navItems.map(({ id, label, icon }) => (
              <li key={id} className="db-nav__item">
                <button
                  className={`db-nav__btn${activeSection === id ? " db-nav__btn--active" : ""}`}
                  onClick={() => setActiveSection(id)}
                  aria-current={activeSection === id ? "page" : undefined}
                  type="button"
                >
                  <span className="db-nav__btn-icon">{icon}</span>
                  {label}
                  {id === "reports" && pendingCount > 0 && (
                    <span className="db-nav__badge">{pendingCount}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="db-sidebar__footer">
          <span className="db-sidebar__status-dot" aria-hidden="true" />
          <span className="db-sidebar__status-text">All systems operational</span>
        </div>

      </aside>

      {/* ── Main body ───────────────────────────────────── */}
      <div className="db-body">

        {/* Top bar */}
        <header className="db-topbar">
          <div className="db-topbar__breadcrumb">
            <span className="db-topbar__breadcrumb-root">Dashboard</span>
            <span className="db-topbar__breadcrumb-sep" aria-hidden="true">/</span>
            <span className="db-topbar__breadcrumb-current">
              {activeItem?.label}
            </span>
          </div>

          <div className="db-topbar__actions">
            <div
              className="db-topbar__alert-badge"
              role="status"
              aria-label={`${pendingCount} pending incidents`}
              onClick={() => setActiveSection("reports")}
              style={{ cursor: "pointer" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {pendingCount > 0 && (
                <span className="db-topbar__alert-count">{pendingCount}</span>
              )}
            </div>

            <div
              className="db-topbar__avatar"
              aria-label="Officer profile"
              role="img"
            >
              {officerName}
            </div>
          </div>
        </header>

        {/* Content area */}
        <main className="db-main" id="main-content" tabIndex={-1}>
          {renderContent()}
        </main>

      </div>
    </div>
  );
}

export default Dashboard;