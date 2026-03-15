import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-control-geocoder";

// Fix marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

function SearchControl() {
  const map = useMap();

  useEffect(() => {
    const geocoder = L.Control.geocoder({
      defaultMarkGeocode: true,
    }).addTo(map);

    return () => map.removeControl(geocoder);
  }, [map]);

  return null;
}

export default function ShelterFinder() {
  const [position, setPosition] = useState(null);
  const [shelters, setShelters] = useState([]);
  const [disasters, setDisasters] = useState([]);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setPosition([pos.coords.latitude, pos.coords.longitude]);
    });

    // Fetch shelters
   fetch("http://127.0.0.1:5000/api/shelters")
      .then((res) => res.json())
      .then((data) => setShelters(data))
      .catch(() => console.log("No shelters yet"));

    // Fetch disaster reports
   fetch("http://127.0.0.1:5000/api/disaster/reports")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDisasters(data.reports);
        }
      });
  }, []);

  if (!position) return <p>Getting your location...</p>;

  return (
    <div style={{ height: "600px", width: "100%" }}>
      <MapContainer center={position} zoom={12} style={{ height: "100%" }}>
        <TileLayer
          attribution="© OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <SearchControl />

        {/* User location */}
        <Marker position={position}>
          <Popup>📍 You are here</Popup>
        </Marker>

        {/* Disaster markers */}
        {disasters.map((d) => (
          <Marker key={d.id} position={[d.latitude, d.longitude]}>
            <Popup>
              🚨 <b>Disaster</b>
              <br />
              {d.name}
              <br />
              Severity: {d.severity}
            </Popup>
          </Marker>
        ))}

        {/* Shelter markers */}
        {shelters.map((s) => (
          <Marker key={s.id} position={[s.latitude, s.longitude]}>
            <Popup>
              🏠 <b>{s.name}</b>
              <br />
              Capacity: {s.capacity}
              <br />
              Available: {s.available}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}