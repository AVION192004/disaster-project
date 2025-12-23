import React, { useState } from "react";
import "./DamageAssessment.css";

function DamageAssessment() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    setResult(null);

    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleAssessClick = async () => {
    if (!selectedFile) {
      alert("Please upload an image first.");
      return;
    }

    const formData = new FormData();
    formData.append("image", selectedFile);
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/analyze-damage", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to get assessment.");
      }

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Assessment Error:", error);
      setResult({ error: "Error processing image. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content-card">
      <h2>Post-Disaster Damage Assessment</h2>
      <p>Upload an image (JPG, PNG) to assess the severity of damage.</p>
      
      {previewUrl && (
        <img
          src={previewUrl}
          alt="Preview"
          className="preview-image"
        />
      )}
      
      <div className="file-upload-section">
        <input
          type="file"
          accept="image/jpeg, image/jpg"
          className="file-input"
          onChange={handleFileChange}
        />
        <button
          className="action-button"
          onClick={handleAssessClick}
          disabled={loading}
        >
          {loading ? "Analyzing Image..." : "Assess Damage"}
        </button>

        {loading && <p className="loading-text">Processing image, please wait…</p>}
      </div>

      {result && (
        <div className="result-section">
          <h3>Assessment Result</h3>

          {result.error ? (
            <p className="error-message">{result.error}</p>
          ) : (
            <ul className="result-list">
              <li>No Damage: <strong>{result.building_no_damage}</strong></li>
              <li>Minor Damage: <strong>{result.building_minor_damage}</strong></li>
              <li>Major Damage: <strong>{result.building_major_damage}</strong></li>
              <li>
                Completely Destroyed:{" "}
                <strong>{result.building_complete_destruction}</strong>
              </li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default DamageAssessment;