import React, { useState, useEffect } from "react";
import axios from "axios";
import "./ResourceAllocation.css"; // Import styles

function ResourceAllocation() {
  const [damageInput, setDamageInput] = useState({
    building_no_damage: 0,
    building_minor_damage: 0,
    building_major_damage: 0,
    building_total_destruction: 0,
  });

  const [allocatedResources, setAllocatedResources] = useState({
    minor_damage: [],
    major_damage: [],
    total_destruction: [],
  });

  const [availableResources, setAvailableResources] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch available resources on component mount
  useEffect(() => {
    fetchAvailableResources();
  }, []);

  const fetchAvailableResources = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://127.0.0.1:5000/get-resources");
      setAvailableResources(response.data.resources);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching resources:", error);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setDamageInput({
      ...damageInput,
      [e.target.name]: parseInt(e.target.value) || 0, // Convert to integer, default to 0
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
      setLoading(false);
    } catch (error) {
      console.error("Error allocating resources:", error);
      setLoading(false);
    }
  };

  return (
    <div className="resource-allocation-container">
      {/* Resource Allocation Card */}
      <div className="resource-allocation-card">
        <h2>Resource Allocation</h2>
        <p>Enter the number of buildings affected in each category.</p>

        {/* Input Fields with Aligned Labels */}
        <div className="damage-input-group">
          <label>No Damage:</label>
          <input
            type="number"
            name="building_no_damage"
            value={damageInput.building_no_damage}
            onChange={handleInputChange}
          />
        </div>

        <div className="damage-input-group">
          <label>Minor Damage:</label>
          <input
            type="number"
            name="building_minor_damage"
            value={damageInput.building_minor_damage}
            onChange={handleInputChange}
          />
        </div>

        <div className="damage-input-group">
          <label>Major Damage:</label>
          <input
            type="number"
            name="building_major_damage"
            value={damageInput.building_major_damage}
            onChange={handleInputChange}
          />
        </div>

        <div className="damage-input-group">
          <label>Total Destruction:</label>
          <input
            type="number"
            name="building_total_destruction"
            value={damageInput.building_total_destruction}
            onChange={handleInputChange}
          />
        </div>

        <button
          className="action-button"
          onClick={handleAllocateResources}
          disabled={loading}
        >
          {loading ? "Allocating..." : "Allocate"}
        </button>

        {/* Allocated Resources Section (Scrollable) */}
        <div className="allocated-resources">
          <h3>Allocated Resources:</h3>
          {allocatedResources.minor_damage.length === 0 &&
          allocatedResources.major_damage.length === 0 &&
          allocatedResources.total_destruction.length === 0 ? (
            <p>No resources allocated yet.</p>
          ) : (
            <div className="allocated-list">
              {/* Minor Damage Allocations */}
              {allocatedResources.minor_damage.length > 0 && (
                <div className="allocation-category">
                  <h4>Minor Damage</h4>
                  {allocatedResources.minor_damage.map((resource, index) => (
                    <p key={index}>
                      {resource.resource_name}: {resource.allocated_quantity} units
                    </p>
                  ))}
                </div>
              )}

              {/* Major Damage Allocations */}
              {allocatedResources.major_damage.length > 0 && (
                <div className="allocation-category">
                  <h4>Major Damage</h4>
                  {allocatedResources.major_damage.map((resource, index) => (
                    <p key={index}>
                      {resource.resource_name}: {resource.allocated_quantity} units
                    </p>
                  ))}
                </div>
              )}

              {/* Total Destruction Allocations */}
              {allocatedResources.total_destruction.length > 0 && (
                <div className="allocation-category">
                  <h4>Total Destruction</h4>
                  {allocatedResources.total_destruction.map((resource, index) => (
                    <p key={index}>
                      {resource.resource_name}: {resource.allocated_quantity} units
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Available Resources Section (Scrollable) */}
      <div className="resource-available-section">
        <h3>Available Resources</h3>
        <div className="available-resources">
          {loading ? (
            <p>Loading available resources...</p>
          ) : (
            <div className="resource-list">
              {availableResources.map((resource, index) => (
                <div className="resource-card" key={index}>
                  <p>{resource.resource_name}</p>
                  <div className="progress-bar">
                    <div
                      className="progress"
                      style={{ width: `${Math.max((resource.quantity / 5000) * 100, 2)}%` }}
                    ></div>
                  </div>
                  <p className="progress-text">{resource.quantity} units available</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResourceAllocation;
