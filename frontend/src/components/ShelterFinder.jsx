import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

// Fix default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

export default function ShelterFinder() {
  const [position, setPosition] = useState(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setPosition([pos.coords.latitude, pos.coords.longitude]);
    });
  }, []);

  if (!position) return <p>Getting your location...</p>;

  return (
    <div style={{ height: "600px", width: "100%" }}>
      <MapContainer center={position} zoom={13} style={{ height: "100%" }}>
        <TileLayer
          attribution="© OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User Location */}
        <Marker position={position}>
          <Popup>📍 You are here</Popup>
        </Marker>

        {/* Example Shelter (Replace with real data later) */}
        <Marker position={[position[0] + 0.01, position[1] + 0.01]}>
          <Popup>🏥 Nearby Hospital</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}