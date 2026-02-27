import React, { useState, useEffect, useCallback } from "react";
import "./ReportsManagement.css";

const STATUS_OPTIONS = ["Pending", "Active", "Assigned", "Resolved"];

const severityColor = {
  Low:      { text: "#22C55E", bg: "rgba(34,197,94,0.1)",   border: "rgba(34,197,94,0.2)"  },
  Medium:   { text: "#F59E0B", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.2)" },
  High:     { text: "#F97316", bg: "rgba(249,115,22,0.1)",  border: "rgba(249,115,22,0.2)" },
  Critical: { text: "#EF4444", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.2)"  },
};

const statusColor = {
  Pending:  { text: "#F59E0B", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.2)" },
  Active:   { text: "#EF4444", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.2)"  },
  Assigned: { text: "#6B48FF", bg: "rgba(107,72,255,0.1)",  border: "rgba(107,72,255,0.2)" },
  Resolved: { text: "#22C55E", bg: "rgba(34,197,94,0.1)",   border: "rgba(34,197,94,0.2)"  },
};

const Badge = ({ label, colorMap }) => {
  const c = colorMap[label] || { text: "#8B95A8", bg: "rgba(139,149,168,0.1)", border: "rgba(139,149,168,0.2)" };
  return (
    <span
      className="rm-badge"
      style={{ color: c.text, background: c.bg, border: `1px solid ${c.border}` }}
    >
      {label}
    </span>
  );
};

export default function ReportsManagement() {
  const [reports,       setReports]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [filterStatus,  setFilterStatus]  = useState("All");
  const [filterSev,     setFilterSev]     = useState("All");
  const [searchQuery,   setSearchQuery]   = useState("");
  const [updating,      setUpdating]      = useState(null); // id being updated
  const [expandedId,    setExpandedId]    = useState(null);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res  = await fetch("http://localhost:5000/api/disaster/reports");
      const data = await res.json();
      if (data.success) setReports(data.reports);
      else setError("Failed to load reports");
    } catch {
      setError("Cannot connect to backend");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const updateStatus = async (id, status) => {
    setUpdating(id);
    try {
      const res  = await fetch(`http://localhost:5000/api/disaster/report/${id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        setReports((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status } : r))
        );
      }
    } catch { /* silently fail */ }
    finally { setUpdating(null); }
  };

  const formatDate = (ts) => {
    if (!ts) return "—";
    return new Date(ts).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    });
  };

  // Filter + search
  const filtered = reports.filter((r) => {
    const matchStatus = filterStatus === "All" || r.status   === filterStatus;
    const matchSev    = filterSev    === "All" || r.severity === filterSev;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q ||
      r.name.toLowerCase().includes(q)     ||
      r.location.toLowerCase().includes(q) ||
      (r.reporter_name || "").toLowerCase().includes(q);
    return matchStatus && matchSev && matchSearch;
  });

  return (
    <div className="rm-wrap">

      {/* Header */}
      <header className="rm-header">
        <div>
          <h1 className="rm-title">Reports Management</h1>
          <p className="rm-subtitle">View and manage all submitted disaster incidents.</p>
        </div>
        <button
          className="rm-refresh-btn"
          onClick={fetchReports}
          disabled={loading}
          type="button"
          aria-label="Refresh reports"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          Refresh
        </button>
      </header>

      {/* Filters */}
      <div className="rm-filters">
        <input
          className="rm-search"
          type="search"
          placeholder="Search by type, location, reporter…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search reports"
        />
        <select
          className="rm-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="All">All statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          className="rm-select"
          value={filterSev}
          onChange={(e) => setFilterSev(e.target.value)}
          aria-label="Filter by severity"
        >
          <option value="All">All severities</option>
          {["Low", "Medium", "High", "Critical"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <span className="rm-count">{filtered.length} report{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Content */}
      {loading ? (
        <div className="rm-loading" role="status">
          <span className="rm-loading__spinner" aria-hidden="true" />
          Loading reports…
        </div>
      ) : error ? (
        <div className="rm-error" role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rm-empty">No reports match your filters.</div>
      ) : (
        <div className="rm-list">
          {filtered.map((report) => {
            const isExpanded = expandedId === report.id;
            return (
              <div key={report.id} className={`rm-row${isExpanded ? " rm-row--expanded" : ""}`}>

                {/* Main row */}
                <div
                  className="rm-row__main"
                  onClick={() => setExpandedId(isExpanded ? null : report.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && setExpandedId(isExpanded ? null : report.id)}
                  aria-expanded={isExpanded}
                >
                  <span className="rm-row__id">#{report.id}</span>

                  <div className="rm-row__info">
                    <span className="rm-row__name">{report.name}</span>
                    <span className="rm-row__loc">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                      {report.location}
                    </span>
                  </div>

                  <div className="rm-row__badges">
                    <Badge label={report.severity} colorMap={severityColor} />
                    <Badge label={report.status}   colorMap={statusColor}   />
                  </div>

                  <span className="rm-row__date">{formatDate(report.created_at)}</span>

                  <svg
                    className={`rm-row__chevron${isExpanded ? " rm-row__chevron--open" : ""}`}
                    width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    aria-hidden="true"
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="rm-detail" aria-label="Report details">
                    {report.description && (
                      <div className="rm-detail__field">
                        <span className="rm-detail__label">Description</span>
                        <span className="rm-detail__value">{report.description}</span>
                      </div>
                    )}
                    <div className="rm-detail__row">
                      <div className="rm-detail__field">
                        <span className="rm-detail__label">Reporter</span>
                        <span className="rm-detail__value">{report.reporter_name || "Anonymous"}</span>
                      </div>
                      {report.reporter_phone && (
                        <div className="rm-detail__field">
                          <span className="rm-detail__label">Phone</span>
                          <span className="rm-detail__value">{report.reporter_phone}</span>
                        </div>
                      )}
                      <div className="rm-detail__field">
                        <span className="rm-detail__label">Submitted</span>
                        <span className="rm-detail__value">{formatDate(report.created_at)}</span>
                      </div>
                    </div>

                    {/* Status update */}
                    <div className="rm-detail__actions">
                      <span className="rm-detail__label">Update status</span>
                      <div className="rm-status-btns">
                        {STATUS_OPTIONS.map((s) => {
                          const c   = statusColor[s];
                          const active = report.status === s;
                          return (
                            <button
                              key={s}
                              className={`rm-status-btn${active ? " rm-status-btn--active" : ""}`}
                              style={active ? {
                                color: c.text, background: c.bg,
                                borderColor: c.border
                              } : {}}
                              onClick={() => updateStatus(report.id, s)}
                              disabled={updating === report.id || active}
                              type="button"
                            >
                              {updating === report.id && !active ? (
                                <span className="rm-status-btn__spinner" aria-hidden="true" />
                              ) : null}
                              {s}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}