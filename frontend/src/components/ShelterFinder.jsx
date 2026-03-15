import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { io } from "socket.io-client";
import { Search, Navigation, Building, Users, MapPin, Plus, ShieldAlert, Navigation2, CheckCircle, AlertTriangle, X } from "lucide-react";

import "leaflet/dist/leaflet.css";
import "leaflet-control-geocoder";
import "leaflet-routing-machine";

const socket = io("http://localhost:5000");

delete L.Icon.Default.prototype._getIconUrl;

// Custom icons
const defaultIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const userIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const shelterIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});


function Routing({ from, to }) {
  const map = useMap();
  const routingRef = React.useRef(null);

  useEffect(() => {
    if (!from || !to || !map) return;

    if (routingRef.current) {
      routingRef.current.setWaypoints([
        L.latLng(parseFloat(from[0]), parseFloat(from[1])),
        L.latLng(parseFloat(to[0]), parseFloat(to[1]))
      ]);
      return;
    }

    routingRef.current = L.Routing.control({
      waypoints: [
        L.latLng(parseFloat(from[0]), parseFloat(from[1])),
        L.latLng(parseFloat(to[0]), parseFloat(to[1]))
      ],
      routeWhileDragging: false,
      addWaypoints: false,
      draggableWaypoints: false,
      lineOptions: {
        styles: [{ color: '#3b82f6', weight: 6, opacity: 0.8 }]
      },
      show: false // Hide the step-by-step instructions panel
    }).addTo(map);

    return () => {
      if (routingRef.current && map) {
        try {
          // Safely remove plan and lines to prevent the 'removeLayer' null error from leaflet-routing-machine
          if (routingRef.current.getPlan()) {
            routingRef.current.getPlan().setWaypoints([]);
          }
          map.removeControl(routingRef.current);
        } catch (e) {
          console.warn("Leaflet Routing cleanup warning", e);
        } finally {
          routingRef.current = null;
        }
      }
    };
  }, [from, to, map]);

  return null;
}

export default function ShelterFinder() {
  const [position, setPosition] = useState(null);
  const [shelters, setShelters] = useState([]);
  const [selectedShelter, setSelectedShelter] = useState(null);
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const [newShelter, setNewShelter] = useState({
    name: "",
    location: "",
    capacity: ""
  });

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
        setLoading(false);
      },
      (err) => {
        console.error("Location error", err);
        // Fallback default location if user denies location
        setPosition([37.7749, -122.4194]);
        setLoading(false);
      }
    );

    loadShelters();

    socket.on("shelter_update", (data) => {
      setShelters((prev) =>
        prev.map((s) =>
          s.id === data.id ? { ...s, available: data.available } : s
        )
      );
    });

    return () => socket.off("shelter_update");
  }, []);

  const loadShelters = () => {
    fetch("http://localhost:5000/api/shelters")
      .then((res) => res.json())
      .then((data) => {
        if(Array.isArray(data)) setShelters(data);
      })
      .catch(err => console.error("Error loading shelters", err));
  };

  const addShelter = async () => {
    if(!newShelter.name || !newShelter.capacity) {
      alert("Please enter shelter name and capacity");
      return;
    }
    
    try {
      const res = await fetch("http://localhost:5000/api/shelters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newShelter.name,
          latitude: position[0],
          longitude: position[1],
          capacity: parseInt(newShelter.capacity)
        })
      });

      const data = await res.json();
      if (data.success) {
        setNewShelter({ name: "", location: "", capacity: "" });
        setIsAddingMode(false);
        loadShelters();
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert("Cannot connect to backend");
    }
  };

  const findNearestShelter = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/shelters/nearest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: position[0],
          longitude: position[1]
        })
      });

      if (!res.ok) throw new Error("Server error");
      const data = await res.json();

      if (!data || !data.latitude || !data.longitude) {
        alert("No shelter found nearby");
        return;
      }

      const lat = parseFloat(data.latitude);
      const lon = parseFloat(data.longitude);
      setSelectedShelter([lat, lon]);

    } catch (err) {
      alert("Cannot find nearest shelter. Check backend connection.");
    }
  };

  // Filter shelters based on search
  const filteredShelters = shelters.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const calculateAvailabilityColor = (available, total) => {
    const ratio = available / total;
    if (ratio > 0.5) return "#10b981"; // Green - lots of space
    if (ratio > 0.1) return "#f59e0b"; // Yellow - filling up
    return "#ef4444"; // Red - almost full
  };

  const styles = {
    container: {
      display: "flex",
      height: "calc(100vh - 70px)", // Account for navbar
      background: "#09090b",
      color: "#f8fafc",
      fontFamily: "'Inter', sans-serif",
      overflow: "hidden"
    },
    sidebar: {
      width: "400px",
      background: "#13192b",
      borderRight: "1px solid #1e293b",
      display: "flex",
      flexDirection: "column",
      zIndex: 10
    },
    header: {
      padding: "24px",
      borderBottom: "1px solid #1e293b",
      background: "linear-gradient(to bottom, #111827, #13192b)"
    },
    titleBox: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      marginBottom: "20px"
    },
    title: {
      fontSize: "1.5rem",
      fontWeight: "bold",
      color: "white",
      margin: 0
    },
    searchContainer: {
      position: "relative",
      width: "100%"
    },
    searchIcon: {
      position: "absolute",
      left: "12px",
      top: "12px",
      color: "#64748b"
    },
    searchInput: {
      width: "100%",
      background: "#0f172a",
      border: "1px solid #334155",
      borderRadius: "8px",
      padding: "12px 16px 12px 40px",
      color: "white",
      outline: "none",
      boxSizing: "border-box"
    },
    btnContainer: {
      padding: "16px 24px",
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "12px"
    },
    primaryBtn: {
      background: "#3b82f6",
      color: "white",
      border: "none",
      borderRadius: "8px",
      padding: "10px",
      fontWeight: "bold",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      cursor: "pointer",
      transition: "all 0.2s",
      boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)"
    },
    secondaryBtn: {
      background: "#1e293b",
      color: "white",
      border: "1px solid #334155",
      borderRadius: "8px",
      padding: "10px",
      fontWeight: "bold",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      cursor: "pointer",
      transition: "all 0.2s"
    },
    listArea: {
      flex: 1,
      overflowY: "auto",
      padding: "0 24px 24px 24px",
      display: "flex",
      flexDirection: "column",
      gap: "12px"
    },
    shelterCard: (isSelected) => ({
      background: isSelected ? "rgba(59, 130, 246, 0.1)" : "#0f172a",
      border: isSelected ? "1px solid #3b82f6" : "1px solid #1e293b",
      borderRadius: "12px",
      padding: "16px",
      cursor: "pointer",
      transition: "transform 0.2s, border-color 0.2s",
      display: "flex",
      flexDirection: "column",
      gap: "12px"
    }),
    cardHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start"
    },
    shelterName: {
      fontSize: "1.1rem",
      fontWeight: "bold",
      color: "white",
      margin: 0,
      display: "flex",
      alignItems: "center",
      gap: "8px"
    },
    statsRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      background: "#13192b",
      padding: "10px 12px",
      borderRadius: "8px"
    },
    statBox: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      fontSize: "0.875rem",
      color: "#cbd5e1"
    },
    routeBtn: {
      marginTop: "8px",
      background: "rgba(16, 185, 129, 0.1)",
      color: "#10b981",
      border: "none",
      borderRadius: "6px",
      padding: "8px",
      width: "100%",
      fontWeight: "bold",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "6px",
      cursor: "pointer"
    },
    mapArea: {
      flex: 1,
      position: "relative"
    },
    addForm: {
      background: "#0f172a",
      borderRadius: "12px",
      padding: "20px",
      border: "1px dashed #3b82f6",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      marginBottom: "20px"
    },
    input: {
      width: "100%",
      background: "#13192b",
      border: "1px solid #334155",
      borderRadius: "6px",
      padding: "10px 12px",
      color: "white",
      boxSizing: "border-box",
      outline: "none"
    }
  };

  if (loading) {
    return (
      <div style={{...styles.container, alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'20px'}}>
        <div style={{width:'40px', height:'40px', border:'3px solid #1e293b', borderTopColor:'#3b82f6', borderRadius:'50%', animation:'spin 1s linear infinite'}} />
        <p style={{color:'#94a3b8', fontWeight:'bold', letterSpacing:'1px'}}>Locating your position...</p>
        <style dangerouslySetInnerHTML={{__html: `@keyframes spin { 100% { transform: rotate(360deg); } }`}} />
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* SIDEBAR UI */}
      <div style={styles.sidebar}>
        <div style={styles.header}>
          <div style={styles.titleBox}>
            <div style={{background:'rgba(59, 130, 246, 0.1)', padding:'10px', borderRadius:'12px'}}>
              <Building color="#3b82f6" size={28} />
            </div>
            <div>
              <h1 style={styles.title}>Safe Shelters</h1>
              <p style={{color:'#64748b', fontSize:'0.85rem', margin:0, marginTop:'4px'}}>Live capacity tracking</p>
            </div>
          </div>
          
          <div style={styles.searchContainer}>
            <Search style={styles.searchIcon} size={18} />
            <input 
              style={styles.searchInput} 
              placeholder="Search shelters nearby..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div style={styles.btnContainer}>
          <button style={styles.primaryBtn} onClick={findNearestShelter} className="hover-scale">
            <Navigation2 size={18} /> Nearest
          </button>
          <button style={styles.secondaryBtn} onClick={() => setIsAddingMode(!isAddingMode)} className="hover-scale">
            <Plus size={18} /> Add New
          </button>
        </div>

        <div style={styles.listArea}>
          
          {isAddingMode && (
            <div style={styles.addForm}>
              <h3 style={{margin:0, fontSize:'1rem', color:'white', display:'flex', alignItems:'center', gap:'8px'}}><Plus size={16} color="#3b82f6"/> Register Shelter</h3>
              <p style={{fontSize:'0.75rem', color:'#94a3b8', margin:0}}>Location will snap to your current GPS coordinates.</p>
              <input style={styles.input} placeholder="Shelter Name (e.g. Central High School)" value={newShelter.name} onChange={(e) => setNewShelter({...newShelter, name: e.target.value})} />
              <input style={styles.input} type="number" placeholder="Total Capacity (e.g. 500)" value={newShelter.capacity} onChange={(e) => setNewShelter({...newShelter, capacity: e.target.value})} />
              <button style={{...styles.primaryBtn, width:'100%'}} onClick={addShelter}>Confirm Registration</button>
            </div>
          )}

          {filteredShelters.length === 0 ? (
            <div style={{textAlign:'center', padding:'40px 20px', color:'#64748b'}}>
              <ShieldAlert size={48} style={{opacity:0.5, marginBottom:'16px'}} />
              <p>No active shelters found in your area.</p>
            </div>
          ) : (
            filteredShelters.map((s) => {
              const parsedLat = parseFloat(s.latitude);
              const parsedLon = parseFloat(s.longitude);
              const isSelected = selectedShelter && selectedShelter[0] === parsedLat && selectedShelter[1] === parsedLon;
              const statusColor = calculateAvailabilityColor(s.available, s.capacity);

              return (
                <div 
                  key={s.id} 
                  style={styles.shelterCard(isSelected)}
                  onClick={() => !isNaN(parsedLat) && !isNaN(parsedLon) && setSelectedShelter([parsedLat, parsedLon])}
                  className="shelter-card"
                >
                  <div style={styles.cardHeader}>
                    <h3 style={styles.shelterName}><Building size={16} color="#3b82f6"/> {s.name}</h3>
                    <div style={{background:`rgba(${statusColor === '#10b981' ? '16,185,129' : statusColor === '#f59e0b' ? '245,158,11' : '239,68,68'}, 0.1)`, padding:'4px 8px', borderRadius:'12px', fontSize:'0.75rem', fontWeight:'bold', color:statusColor, display:'flex', alignItems:'center', gap:'4px'}}>
                      <div style={{width:'6px', height:'6px', borderRadius:'50%', background:statusColor}} />
                      {s.available > 0 ? 'Accepting' : 'Full'}
                    </div>
                  </div>

                  <div style={styles.statsRow}>
                    <div style={styles.statBox}>
                      <Users size={16} /> 
                      <span>Max: <b>{s.capacity}</b></span>
                    </div>
                    <div style={{width:'1px', height:'20px', background:'#334155'}} />
                    <div style={styles.statBox}>
                      <CheckCircle size={16} color={statusColor} /> 
                      <span style={{color: statusColor, fontWeight:'bold'}}>{s.available} Open</span>
                    </div>
                  </div>

                  {isSelected && (
                    <div style={{display:'flex', gap:'8px', marginTop: '8px'}}>
                      <div style={{...styles.routeBtn, flex:1, margin:0, background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6'}}>
                        <Navigation size={14} /> Navigating...
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedShelter(null); }} 
                        style={{...styles.routeBtn, flex:0, padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', margin:0}}
                        title="Cancel Route"
                        className="hover-cancel"
                      >
                        <X size={14} /> Cancel
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MAP UI */}
      <div style={styles.mapArea}>
        <MapContainer
          center={position} // Always map origin to user
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
        >
          {/* Using standard OpenStreetMap tiles */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {position && (
            <Marker position={position} icon={userIcon}>
              <Popup className="dark-popup">
                <b>📍 Your Location</b><br/>Emergency responders see this.
              </Popup>
            </Marker>
          )}

          {shelters
            .filter((s) => !isNaN(parseFloat(s.latitude)) && !isNaN(parseFloat(s.longitude)))
            .map((s) => (
              <Marker
                key={s.id}
                position={[parseFloat(s.latitude), parseFloat(s.longitude)]}
                icon={shelterIcon}
                eventHandlers={{
                  click: () => setSelectedShelter([parseFloat(s.latitude), parseFloat(s.longitude)]),
                }}
              >
                <Popup className="dark-popup">
                  <strong style={{fontSize:'1.1rem'}}>{s.name}</strong><br />
                  <span style={{color:'#94a3b8', fontSize:'0.85rem'}}>Capacity: {s.capacity}</span><br/>
                  <span style={{color: calculateAvailabilityColor(s.available, s.capacity), fontWeight:'bold'}}>
                    Available: {s.available}
                  </span>
                </Popup>
              </Marker>
            ))}

          {selectedShelter && position && (
            <Routing from={position} to={selectedShelter} />
          )}
        </MapContainer>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .hover-scale:hover { transform: translateY(-2px); filter: brightness(1.2); }
        .shelter-card:hover { border-color: #3b82f6 !important; background: rgba(59,130,246,0.05) !important; }
        .hover-cancel:hover { background: #ef4444 !important; color: white !important; }
        
        /* Overriding Leaflet default styles to match dark theme */
        .leaflet-routing-container {
          background-color: #13192b !important;
          color: white !important;
          border-radius: 12px !important;
          border: 1px solid #1e293b !important;
          box-shadow: 0 10px 25px rgba(0,0,0,0.5) !important;
        }
        .leaflet-popup-content-wrapper {
          background-color: #13192b !important;
          color: white !important;
          border: 1px solid #334155;
          border-radius: 8px;
        }
        .leaflet-popup-tip {
          background-color: #13192b !important;
        }
        .leaflet-control-zoom {
          border: none !important;
        }
        .leaflet-bar a {
          background-color: #13192b !important;
          color: white !important;
          border-bottom: 1px solid #1e293b !important;
        }
        .leaflet-bar a:hover {
          background-color: #1e293b !important;
        }
      `}} />
    </div>
  );
}