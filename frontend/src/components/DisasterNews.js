import React, { useEffect, useState } from "react";

const DOT_COLORS = { green: "#2ea043", orange: "#d97706", red: "#dc2626" };

function parseTitle(rawTitle) {
  const lower = rawTitle?.toLowerCase() || "";
  for (const color of ["green", "orange", "red"]) {
    if (lower.startsWith(color + " ")) {
      return { cleanTitle: rawTitle.slice(color.length + 1), severity: color };
    }
  }
  return { cleanTitle: rawTitle, severity: null };
}

function parseRSSDate(str) {
  if (!str) return 0;
  // RFC 822: "Thu, 08 May 2026 00:30:53 +0000"
  const t = Date.parse(str);
  if (!isNaN(t)) return t;
  // fallback: try replacing timezone name with offset
  const cleaned = str.replace(/\s+[A-Z]{2,4}$/, " +0000");
  const t2 = Date.parse(cleaned);
  return isNaN(t2) ? 0 : t2;
}

export default function DisasterNews() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const proxies = [
      "https://corsproxy.io/?" + encodeURIComponent("https://www.gdacs.org/xml/rss.xml"),
      "https://api.allorigins.win/raw?url=" + encodeURIComponent("https://www.gdacs.org/xml/rss.xml"),
      "https://api.codetabs.com/v1/proxy?quest=" + encodeURIComponent("https://www.gdacs.org/xml/rss.xml"),
    ];

    const tryFetch = async () => {
      for (const proxy of proxies) {
        try {
          const res = await fetch(proxy, { signal: AbortSignal.timeout(5000) });
          if (res.ok) return res.text();
        } catch { continue; }
      }
      throw new Error("All proxies failed");
    };

    tryFetch()
      .then(data => {
        const parser = new DOMParser();
        const xml = parser.parseFromString(data, "text/xml");
        const items = xml.querySelectorAll("item");
        const news = Array.from(items).map((item, idx) => ({
          title: item.querySelector("title")?.textContent,
          link: item.querySelector("link")?.textContent,
          date: item.querySelector("pubDate")?.textContent,
          idx, // preserve original feed order as tiebreaker
        }));
        const sorted = [...news].sort((a, b) => {
          const da = parseRSSDate(a.date);
          const db = parseRSSDate(b.date);
          if (db !== da) return db - da;
          return a.idx - b.idx; // earlier in feed = more recent if same timestamp
        });
        setAlerts(sorted);
      })
      .catch(err => console.error("GDACS fetch error:", err));
  }, []);

  return (
    <div style={{ padding: "40px", color: "white" }}>
      <h1>🌍 Live Global Disaster Alerts (GDACS)</h1>
      {alerts.length === 0 && <p>Loading disaster alerts...</p>}
      {alerts.map((alert, i) => {
        const { cleanTitle, severity } = parseTitle(alert.title);
        return (
          <div key={i} style={{ background: "#161b22", padding: "15px", marginTop: "12px", borderRadius: "8px" }}>
            <h3 style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
              {severity && (
                <span style={{
                  width: "10px", height: "10px", borderRadius: "50%",
                  background: DOT_COLORS[severity], display: "inline-block", flexShrink: 0
                }} />
              )}
              {cleanTitle}
            </h3>
            <p>{new Date(alert.date).toLocaleString()}</p>
            <a href={alert.link} target="_blank" rel="noreferrer" style={{ color: "#58a6ff" }}>
              Read Full Alert →
            </a>
          </div>
        );
      })}
    </div>
  );
}