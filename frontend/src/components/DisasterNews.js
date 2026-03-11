import React, { useEffect, useState } from "react";

export default function DisasterNews() {

  const [alerts, setAlerts] = useState([]);

  useEffect(() => {

    const proxy =
      "https://api.allorigins.win/raw?url=" +
      encodeURIComponent("https://www.gdacs.org/xml/rss.xml");

    fetch(proxy)
      .then(res => res.text())
      .then(data => {

        const parser = new DOMParser();
        const xml = parser.parseFromString(data, "text/xml");

        const items = xml.querySelectorAll("item");

        const news = Array.from(items).map(item => ({
          title: item.querySelector("title")?.textContent,
          link: item.querySelector("link")?.textContent,
          date: item.querySelector("pubDate")?.textContent
        }));

        setAlerts(news);

      })
      .catch(err => console.error("GDACS fetch error:", err));

  }, []);

  return (
    <div style={{ padding: "40px", color: "white" }}>

      <h1>🌍 Live Global Disaster Alerts (GDACS)</h1>

      {alerts.length === 0 && <p>Loading disaster alerts...</p>}

      {alerts.map((alert, i) => (
        <div
          key={i}
          style={{
            background: "#161b22",
            padding: "15px",
            marginTop: "12px",
            borderRadius: "8px"
          }}
        >
          <h3>{alert.title}</h3>
          <p>{new Date(alert.date).toLocaleString()}</p>

          <a
            href={alert.link}
            target="_blank"
            rel="noreferrer"
            style={{ color: "#58a6ff" }}
          >
            Read Full Alert →
          </a>
        </div>
      ))}

    </div>
  );
}