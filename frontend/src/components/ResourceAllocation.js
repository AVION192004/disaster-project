import React, { useState, useEffect } from "react";
import axios from "axios";
import "./ResourceAllocation.css";

const damageFields = [
  { name: "building_no_damage",         label: "No Damage",         tier: "none" },
  { name: "building_minor_damage",      label: "Minor Damage",      tier: "minor" },
  { name: "building_major_damage",      label: "Major Damage",      tier: "major" },
  { name: "building_total_destruction", label: "Total Destruction",  tier: "critical" },
];

const categoryMeta = {
  minor_damage:       { label: "Minor Damage",      tierClass: "tier--minor" },
  major_damage:       { label: "Major Damage",      tierClass: "tier--major" },
  total_destruction:  { label: "Total Destruction", tierClass: "tier--critical" },
};

function ResourceAllocation() {
  const [damageInput, setDamageInput] = useState({
    building_no_damage:         0,
    building_minor_damage:      0,
    building_major_damage:      0,
    building_total_destruction: 0,
  });

  const [allocatedResources, setAllocatedResources] = useState({
    minor_damage:      [],
    major_damage:      [],
    total_destruction: [],
  });

  const [availableResources, setAvailableResources] = useState([]);
  const [loading, setLoading]                       = useState(false);

  useEffect(() => {
    fetchAvailableResources();
  }, []);

  const fetchAvailableResources = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://127.0.0.1:5000/get-resources");
      setAvailableResources(response.data.resources);
    } catch (error) {
      console.error("Error fetching resources:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setDamageInput({
      ...damageInput,
      [e.target.name]: parseInt(e.target.value) || 0,
    });
  };

  const handleAllocateResources = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        "http://127.0.0.1:5000/allocate-resources",
        damageInput
      );
      setAllocatedResources(response.data.allocation_results);
      setAvailableResources(response.data.updated_resources);
    } catch (error) {
      console.error("Error allocating resources:", error);
    } finally {
      setLoading(false);
    }
  };

  const hasAllocations =
    allocatedResources.minor_damage.length > 0 ||
    allocatedResources.major_damage.length > 0 ||
    allocatedResources.total_destruction.length > 0;

  return (
    <div className="ra-wrap">

      {/* ── Page header ─────────────────────────────────── */}
      <header className="ra-header">
        <h1 className="ra-title">Resource Allocation</h1>
        <p className="ra-subtitle">
          Enter building damage counts by severity tier. The DQN engine will
          compute an optimal dispatch recommendation.
        </p>
      </header>

      <div className="ra-layout">

        {/* ── Left — input + results ───────────────────── */}
        <div className="ra-left">

          {/* Input card */}
          <section className="ra-card" aria-label="Damage input">
            <h2 className="ra-card__title">Damage Report</h2>
            <p className="ra-card__desc">Buildings affected per damage category</p>

            <div className="ra-fields">
              {damageFields.map(({ name, label, tier }) => (
                <div key={name} className="ra-field">
                  <label className="ra-field__label" htmlFor={name}>
                    <span className={`ra-field__tier-dot tier-dot--${tier}`} aria-hidden="true" />
                    {label}
                  </label>
                  <input
                    className="ra-field__input"
                    type="number"
                    id={name}
                    name={name}
                    min="0"
                    value={damageInput[name]}
                    onChange={handleInputChange}
                  />
                </div>
              ))}
            </div>

            <button
              className="ra-allocate-btn"
              onClick={handleAllocateResources}
              disabled={loading}
              type="button"
            >
              {loading ? (
                <>
                  <span className="ra-allocate-btn__spinner" aria-hidden="true" />
                  Allocating…
                </>
              ) : (
                "Run Allocation"
              )}
            </button>
          </section>

          {/* Allocation results */}
          <section className="ra-card ra-card--results" aria-label="Allocation results" aria-live="polite">
            <h2 className="ra-card__title">Allocation Results</h2>

            {!hasAllocations ? (
              <p className="ra-empty">
                No allocations yet. Submit a damage report to generate recommendations.
              </p>
            ) : (
              <div className="ra-allocation-list">
                {Object.entries(categoryMeta).map(([key, { label, tierClass }]) =>
                  allocatedResources[key].length > 0 ? (
                    <div key={key} className="ra-alloc-group">
                      <div className="ra-alloc-group__header">
                        <span className={`ra-alloc-group__badge ${tierClass}`}>{label}</span>
                      </div>
                      <ul className="ra-alloc-items" role="list">
                        {allocatedResources[key].map((resource, index) => (
                          <li key={index} className="ra-alloc-item">
                            <span className="ra-alloc-item__name">{resource.resource_name}</span>
                            <span className="ra-alloc-item__qty">
                              {resource.allocated_quantity} units
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null
                )}
              </div>
            )}
          </section>

        </div>

        {/* ── Right — available resources ──────────────── */}
        <aside className="ra-right" aria-label="Available resources">
          <section className="ra-card ra-card--inventory">
            <div className="ra-card__title-row">
              <h2 className="ra-card__title">Inventory</h2>
              <button
                className="ra-refresh-btn"
                onClick={fetchAvailableResources}
                disabled={loading}
                type="button"
                aria-label="Refresh inventory"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <polyline points="23 4 23 10 17 10"/>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                </svg>
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="ra-loading" role="status">
                <span className="ra-loading__spinner" aria-hidden="true" />
                Loading inventory…
              </div>
            ) : availableResources.length === 0 ? (
              <p className="ra-empty">No inventory data available.</p>
            ) : (
              <ul className="ra-inventory-list" role="list">
                {availableResources.map((resource, index) => {
                  const pct = Math.max((resource.quantity / 5000) * 100, 2);
                  const levelClass =
                    pct > 60 ? "bar--high" : pct > 25 ? "bar--medium" : "bar--low";
                  return (
                    <li key={index} className="ra-inventory-item">
                      <div className="ra-inventory-item__top">
                        <span className="ra-inventory-item__name">{resource.resource_name}</span>
                        <span className="ra-inventory-item__qty">{resource.quantity.toLocaleString()} units</span>
                      </div>
                      <div className="ra-bar-track" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin="0" aria-valuemax="100">
                        <div className={`ra-bar-fill ${levelClass}`} style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </aside>

      </div>
    </div>
  );
}

export default ResourceAllocation;