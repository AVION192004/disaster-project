import React, { useState } from "react";
import "./Dashboard.css";
import DamageAssessment from "./DamageAssessment"; // Import the Damage Assessment component
import ResourceAllocation from "./ResourceAllocation"; // Import the Resource Allocation component

function Dashboard() {
  const [activeSection, setActiveSection] = useState("damage");

  const renderContent = () => {
    if (activeSection === "damage") {
      return <DamageAssessment />;
    } else if (activeSection === "resources") {
      return <ResourceAllocation />;
    }
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <h2 className="sidebar-title">Dashboard</h2>
        <nav className="menu">
          <button
            className={`menu-item ${activeSection === "damage" ? "active" : ""}`}
            onClick={() => setActiveSection("damage")}
          >
            Damage Assessment
          </button>
          <button
            className={`menu-item ${activeSection === "resources" ? "active" : ""}`}
            onClick={() => setActiveSection("resources")}
          >
            Resource Allocation
          </button>
        </nav>
      </aside>
      <main className="main-content">{renderContent()}</main>
    </div>
  );
}

export default Dashboard;
