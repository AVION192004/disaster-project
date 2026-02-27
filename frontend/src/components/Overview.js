import React, { useState, useEffect } from "react";
import "./Overview.css";

const severityColor = {
  Low:      "#22C55E",
  Medium:   "#F59E0B",
  High:     "#F97316",
  Critical: "#EF4444",
};

const statusColor = {
  Pending:    { bg: "rgba(245,158,11,0.1)",  text: "#F59E0B", border: "rgba(245,158,11,0.2)" },
  Active:     { bg: "rgba(239,68,68,0.1)",   text: "#EF4444", border: "rgba(239,68,68,0.2)" },
  Resolved:   { bg: "rgba(34,197,94,0.1)",   text: "#22C55E", border: "rgba(34,197,94,0.2)" },
  Assigned:   { bg: "rgba(107,72,255,0.1)",  text: "#6B48FF", border: "rgba(107,72,255,0.2)" },
};

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="ov-stat-card" style={{ "--accent": accent }}>
      <span className="ov-stat-card__value">{value}</span>
      <span className="ov-stat-card__label">{label}</span>
      {sub && <span className="ov-stat-card__sub">{sub}</span>}
      <div className="ov-stat-card__bar" aria-hidden="true" />
    </div>
  );
}

export default function Overview({ onNavigate }) {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res  = await fetch("http://localhost:5000/api/disaster/stats");
        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
        } else {
          setError("Failed to load stats");
        }
      } catch (e) {
        setError("Cannot connect to backend");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const formatDate = (ts) => {
    if (!ts) return "—";
    const d = new Date(ts);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  if (loading) {
    return (
      <div className="ov-wrap">
        <div className="ov-loading" role="status">
          <span className="ov-loading__spinner" aria-hidden="true" />
          Loading overview…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ov-wrap">
        <div className="ov-error" role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          {error} — make sure the backend server is running.
        </div>
      </div>
    );
  }

  const sb = stats.severity_breakdown || {};
  const severities = ["Low", "Medium", "High", "Critical"];
  const totalSeverity = severities.reduce((a, s) => a + (sb[s] || 0), 0) || 1;

  return (
    <div className="ov-wrap">

      {/* Page header */}
      <header className="ov-header">
        <div>
          <h1 className="ov-title">Overview</h1>
          <p className="ov-subtitle">Live situational summary of all disaster incidents.</p>
        </div>
        <button
          className="ov-report-btn"
          onClick={() => onNavigate("report-disaster")}
          type="button"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Report Disaster
        </button>
      </header>

      {/* Stat cards */}
      <div className="ov-stats-grid" aria-label="Incident statistics">
        <StatCard label="Total Reports"  value={stats.total}    accent="#6B48FF" />
        <StatCard label="Pending"        value={stats.pending}  accent="#F59E0B" sub="Awaiting response" />
        <StatCard label="Active"         value={stats.active}   accent="#EF4444" sub="In progress" />
        <StatCard label="Resolved"       value={stats.resolved} accent="#22C55E" sub="Closed" />
      </div>

      <div className="ov-bottom-grid">

        {/* Severity breakdown */}
        <section className="ov-card" aria-label="Severity breakdown">
          <h2 className="ov-card__title">Severity Breakdown</h2>
          <div className="ov-severity-list">
            {severities.map((sev) => {
              const count = sb[sev] || 0;
              const pct   = Math.round((count / totalSeverity) * 100);
              return (
                <div key={sev} className="ov-severity-row">
                  <span className="ov-severity-row__label" style={{ color: severityColor[sev] }}>
                    {sev}
                  </span>
                  <div className="ov-severity-row__track" role="progressbar" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100">
                    <div
                      className="ov-severity-row__fill"
                      style={{ width: `${pct}%`, background: severityColor[sev] }}
                    />
                  </div>
                  <span className="ov-severity-row__count">{count}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Disaster types */}
        <section className="ov-card" aria-label="Top disaster types">
          <h2 className="ov-card__title">Top Disaster Types</h2>
          {(!stats.disaster_types || stats.disaster_types.length === 0) ? (
            <p className="ov-empty">No reports yet.</p>
          ) : (
            <ul className="ov-type-list" role="list">
              {stats.disaster_types.map((item, i) => (
                <li key={i} className="ov-type-item">
                  <span className="ov-type-item__rank">{i + 1}</span>
                  <span className="ov-type-item__name">{item.type}</span>
                  <span className="ov-type-item__count">{item.count} report{item.count !== 1 ? "s" : ""}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

      </div>

      {/* Recent reports */}
      <section className="ov-card ov-card--full" aria-label="Recent reports">
        <div className="ov-card__header-row">
          <h2 className="ov-card__title">Recent Reports</h2>
          <button
            className="ov-see-all-btn"
            onClick={() => onNavigate("reports")}
            type="button"
          >
            See all →
          </button>
        </div>

        {(!stats.recent_reports || stats.recent_reports.length === 0) ? (
          <p className="ov-empty">No reports yet.</p>
        ) : (
          <div className="ov-table-wrap">
            <table className="ov-table" aria-label="Recent disaster reports">
              <thead>
                <tr>
                  <th className="ov-table__th">ID</th>
                  <th className="ov-table__th">Type</th>
                  <th className="ov-table__th">Location</th>
                  <th className="ov-table__th">Severity</th>
                  <th className="ov-table__th">Status</th>
                  <th className="ov-table__th">Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_reports.map((r) => {
                  const sc = statusColor[r.status] || statusColor["Pending"];
                  return (
                    <tr key={r.id} className="ov-table__row">
                      <td className="ov-table__td ov-table__td--id">#{r.id}</td>
                      <td className="ov-table__td">{r.name}</td>
                      <td className="ov-table__td ov-table__td--loc">{r.location}</td>
                      <td className="ov-table__td">
                        <span
                          className="ov-badge"
                          style={{ color: severityColor[r.severity], background: `${severityColor[r.severity]}18`, border: `1px solid ${severityColor[r.severity]}33` }}
                        >
                          {r.severity}
                        </span>
                      </td>
                      <td className="ov-table__td">
                        <span
                          className="ov-badge"
                          style={{ color: sc.text, background: sc.bg, border: `1px solid ${sc.border}` }}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="ov-table__td ov-table__td--date">{formatDate(r.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

    </div>
  );
}