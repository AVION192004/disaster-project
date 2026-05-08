import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ── Severity helpers ──────────────────────────────────────── */
const SEVERITY_MAP = {
  red:    { label: "Critical", color: "#ff4d4d", bg: "rgba(255,77,77,0.15)"   },
  orange: { label: "High",     color: "#ff9f1a", bg: "rgba(255,159,26,0.15)"  },
  green:  { label: "Low",      color: "#3ddc84", bg: "rgba(61,220,132,0.15)"  },
};

function getSeverity(title = "") {
  const t = title.toLowerCase();
  if (t.includes("red") || t.includes("critical") || t.includes("deadly") || t.includes("major"))
    return SEVERITY_MAP.red;
  if (t.includes("orange") || t.includes("high") || t.includes("tropical") || t.includes("flood"))
    return SEVERITY_MAP.orange;
  return SEVERITY_MAP.green;
}

/* ── Proxy list — tried in order ──────────────────────────── */
const PROXIES = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://thingproxy.freeboard.io/fetch/${url}`,
];

const GDACS_URL = "https://www.gdacs.org/xml/rss.xml";

async function fetchWithFallback() {
  let lastErr;
  for (const buildProxy of PROXIES) {
    try {
      const res = await fetch(buildProxy(GDACS_URL), { signal: AbortSignal.timeout(8000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      if (!text || text.trim().length < 50) throw new Error("Empty response");
      return text;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

function parseAlerts(xmlText) {
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlText, "text/xml");
  const parseErr = xml.querySelector("parsererror");
  if (parseErr) throw new Error("XML parse error");

  return Array.from(xml.querySelectorAll("item")).map((item) => {
    const getText = (tag) => item.querySelector(tag)?.textContent?.trim() ?? "";
    // GDACS puts description in <description> or <gdacs:todate>
    const desc =
      getText("description").replace(/<[^>]+>/g, "").slice(0, 160) ||
      "No additional details available.";

    return {
      title:    getText("title"),
      link:     getText("link"),
      date:     getText("pubDate"),
      desc,
      country:  getText("gdacs\\:country") || getText("country") || "",
      eventType:getText("gdacs\\:eventtype") || getText("eventtype") || "Alert",
    };
  }).filter((a) => a.title);
}

/* ── Component ─────────────────────────────────────────────── */
export default function DisasterNews() {
  const [alerts, setAlerts]   = useState([]);
  const [status, setStatus]   = useState("loading"); // loading | success | error
  const [errMsg, setErrMsg]   = useState("");
  const [search, setSearch]   = useState("");
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(async () => {
    setStatus("loading");
    setErrMsg("");
    try {
      const text = await fetchWithFallback();
      const parsed = parseAlerts(text);
      if (parsed.length === 0) throw new Error("No alerts found in feed.");
      setAlerts(parsed);
      setStatus("success");
    } catch (e) {
      console.error("DisasterNews error:", e);
      setErrMsg(e.message || "Unknown error");
      setStatus("error");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = alerts.filter((a) =>
    !search || a.title.toLowerCase().includes(search.toLowerCase()) ||
    (a.country && a.country.toLowerCase().includes(search.toLowerCase()))
  );

  /* ── Render ── */
  return (
    <div style={styles.page}>

      {/* ── Header ── */}
      <motion.div
        style={styles.header}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div style={styles.headerTop}>
          <div>
            <div style={styles.eyebrow}>
              <span style={styles.dot} />
              Live Feed · GDACS
            </div>
            <h1 style={styles.title}>🌍 Global Disaster Alerts</h1>
            <p style={styles.subtitle}>
              Real-time disaster intelligence from the{" "}
              <a href="https://www.gdacs.org" target="_blank" rel="noreferrer" style={styles.link}>
                Global Disaster Alert &amp; Coordination System
              </a>
            </p>
          </div>
          <button style={styles.refreshBtn} onClick={load} title="Refresh alerts">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Refresh
          </button>
        </div>

        {/* Search */}
        {status === "success" && (
          <div style={styles.searchWrap}>
            <svg style={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              style={styles.searchInput}
              placeholder="Search by event name or country…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button style={styles.clearBtn} onClick={() => setSearch("")}>✕</button>
            )}
          </div>
        )}
      </motion.div>

      {/* ── States ── */}
      <AnimatePresence mode="wait">

        {/* Loading */}
        {status === "loading" && (
          <motion.div key="loading" style={styles.center}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div style={styles.spinner} />
            <p style={styles.stateText}>Fetching live alerts from GDACS…</p>
          </motion.div>
        )}

        {/* Error */}
        {status === "error" && (
          <motion.div key="error" style={styles.center}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div style={styles.errorBox}>
              <span style={{ fontSize: 40 }}>⚠️</span>
              <h2 style={{ color: "#ff6b6b", margin: "12px 0 6px" }}>Failed to Load Alerts</h2>
              <p style={{ color: "#8b949e", margin: "0 0 20px" }}>
                {errMsg || "Could not reach the GDACS feed. Check your connection."}
              </p>
              <button style={styles.retryBtn} onClick={load}>Try Again</button>
            </div>
          </motion.div>
        )}

        {/* Success */}
        {status === "success" && (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Count bar */}
            <div style={styles.countBar}>
              <span style={styles.countText}>
                {filtered.length} alert{filtered.length !== 1 ? "s" : ""}
                {search ? ` matching "${search}"` : " worldwide"}
              </span>
              <div style={styles.legendRow}>
                {Object.values(SEVERITY_MAP).map((s) => (
                  <span key={s.label} style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, color:"#8b949e" }}>
                    <span style={{ width:8, height:8, borderRadius:"50%", background:s.color, display:"inline-block" }}/>
                    {s.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Cards */}
            {filtered.length === 0 ? (
              <p style={{ color:"#8b949e", textAlign:"center", marginTop:60 }}>
                No alerts match your search.
              </p>
            ) : (
              <div style={styles.grid}>
                {filtered.map((alert, i) => {
                  const sev = getSeverity(alert.title);
                  const isOpen = expanded === i;
                  return (
                    <motion.div
                      key={i}
                      style={{ ...styles.card, borderColor: sev.color + "44" }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.04, 0.4) }}
                      whileHover={{ y: -4, boxShadow: `0 8px 30px ${sev.color}22` }}
                    >
                      {/* Card header */}
                      <div style={styles.cardHeader}>
                        <span style={{ ...styles.sevBadge, color: sev.color, background: sev.bg }}>
                          ● {sev.label}
                        </span>
                        {alert.eventType && (
                          <span style={styles.typeBadge}>{alert.eventType}</span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 style={styles.cardTitle}>{alert.title}</h3>

                      {/* Meta row */}
                      <div style={styles.metaRow}>
                        {alert.country && (
                          <span style={styles.meta}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                              stroke="currentColor" strokeWidth="2">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                              <circle cx="12" cy="10" r="3"/>
                            </svg>
                            {alert.country}
                          </span>
                        )}
                        <span style={styles.meta}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                          </svg>
                          {alert.date ? new Date(alert.date).toLocaleString() : "Date unknown"}
                        </span>
                      </div>

                      {/* Expandable description */}
                      <AnimatePresence>
                        {isOpen && (
                          <motion.p
                            style={styles.desc}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            {alert.desc}
                          </motion.p>
                        )}
                      </AnimatePresence>

                      {/* Actions */}
                      <div style={styles.cardFooter}>
                        <button
                          style={styles.expandBtn}
                          onClick={() => setExpanded(isOpen ? null : i)}
                        >
                          {isOpen ? "Show less" : "Details"}
                        </button>
                        {alert.link && (
                          <a
                            href={alert.link}
                            target="_blank"
                            rel="noreferrer"
                            style={styles.readLink}
                          >
                            Read Full Alert →
                          </a>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spinner keyframe */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
}

/* ── Styles ─────────────────────────────────────────────────── */
const styles = {
  page: {
    minHeight: "100vh",
    background: "#0D1117",
    padding: "40px 24px 80px",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    maxWidth: 1100,
    margin: "0 auto",
  },
  header: {
    marginBottom: 32,
  },
  headerTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 20,
  },
  eyebrow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "#3ddc84",
    fontSize: 12,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#3ddc84",
    boxShadow: "0 0 8px #3ddc84",
    animation: "pulse 2s infinite",
  },
  title: {
    margin: "0 0 8px",
    fontSize: "clamp(24px, 4vw, 36px)",
    fontWeight: 700,
    color: "#e6edf3",
    lineHeight: 1.2,
  },
  subtitle: {
    margin: 0,
    color: "#8b949e",
    fontSize: 14,
  },
  link: {
    color: "#58a6ff",
    textDecoration: "none",
  },
  refreshBtn: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 18px",
    background: "rgba(88,166,255,0.1)",
    border: "1px solid rgba(88,166,255,0.3)",
    borderRadius: 8,
    color: "#58a6ff",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
    whiteSpace: "nowrap",
  },
  searchWrap: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  searchIcon: {
    position: "absolute",
    left: 14,
    color: "#8b949e",
    pointerEvents: "none",
  },
  searchInput: {
    width: "100%",
    padding: "12px 44px",
    background: "#161b22",
    border: "1px solid #30363d",
    borderRadius: 10,
    color: "#e6edf3",
    fontSize: 14,
    outline: "none",
    transition: "border 0.2s",
    boxSizing: "border-box",
  },
  clearBtn: {
    position: "absolute",
    right: 14,
    background: "none",
    border: "none",
    color: "#8b949e",
    cursor: "pointer",
    fontSize: 14,
    lineHeight: 1,
  },
  center: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 300,
    gap: 16,
  },
  spinner: {
    width: 48,
    height: 48,
    border: "4px solid #21262d",
    borderTop: "4px solid #58a6ff",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  stateText: {
    color: "#8b949e",
    fontSize: 14,
    margin: 0,
  },
  errorBox: {
    textAlign: "center",
    background: "#161b22",
    border: "1px solid #ff6b6b33",
    borderRadius: 16,
    padding: "40px 32px",
    maxWidth: 440,
  },
  retryBtn: {
    padding: "10px 28px",
    background: "linear-gradient(135deg, #ff6b6b, #ff4500)",
    border: "none",
    borderRadius: 8,
    color: "#fff",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
  },
  countBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
    padding: "12px 16px",
    background: "#161b22",
    borderRadius: 10,
    border: "1px solid #21262d",
  },
  countText: {
    color: "#8b949e",
    fontSize: 13,
  },
  legendRow: {
    display: "flex",
    gap: 16,
    flexWrap: "wrap",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: 16,
  },
  card: {
    background: "#161b22",
    border: "1px solid",
    borderRadius: 14,
    padding: "20px",
    transition: "all 0.25s ease",
    cursor: "default",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    flexWrap: "wrap",
  },
  sevBadge: {
    fontSize: 11,
    fontWeight: 700,
    padding: "3px 10px",
    borderRadius: 20,
    letterSpacing: "0.05em",
  },
  typeBadge: {
    fontSize: 11,
    color: "#8b949e",
    background: "#21262d",
    padding: "3px 10px",
    borderRadius: 20,
  },
  cardTitle: {
    margin: "0 0 10px",
    fontSize: 15,
    fontWeight: 600,
    color: "#e6edf3",
    lineHeight: 1.4,
  },
  metaRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 12,
  },
  meta: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontSize: 12,
    color: "#8b949e",
  },
  desc: {
    margin: "0 0 12px",
    fontSize: 13,
    color: "#8b949e",
    lineHeight: 1.6,
    overflow: "hidden",
  },
  cardFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    flexWrap: "wrap",
    gap: 8,
  },
  expandBtn: {
    background: "none",
    border: "1px solid #30363d",
    borderRadius: 6,
    color: "#8b949e",
    fontSize: 12,
    padding: "5px 12px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  readLink: {
    color: "#58a6ff",
    fontSize: 13,
    fontWeight: 600,
    textDecoration: "none",
  },
};