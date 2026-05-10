import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import { NotificationProvider } from "./contexts/NotificationContext";
import HeroSection from "./components/HeroSection";
import Features from "./components/Features";
import HowItWorks from "./components/HowItWorks";
import DamageAssessment from "./components/DamageAssessment";
import ReportDisaster from "./components/ReportDisaster";
import FirstAid from "./components/FirstAid";
import SOSEmergency from "./components/SOSEmergency";
import OfficerRegister from "./pages/OfficerRegister";
import OfficerLogin from "./pages/OfficerLogin";
import OfficerDashboard from "./pages/OfficerDashboard";
import AdminDisaster from "./pages/AdminDisaster";
import ShelterFinder from "./components/ShelterFinder";
import ReliefBot from "./components/ReliefBot";
import DisasterNews from "./components/DisasterNews";
import ReliefBotFloating from "./components/ReliefBotFloating";
import ThemeToggle from "./components/ThemeToggle";
import Home3D from "./components/Home3D";
import ReportDisaster3D from "./components/ReportDisaster3D";

const darkPage = {
  backgroundColor: "#0D1117",
  minHeight: "100vh",
  paddingTop: "20px",
};

function App() {

  // ✅ Offline / Online detection
  useEffect(() => {
    const handleOffline = () => {
      alert("⚠️ You are offline. Emergency reports will be saved locally.");
    };

    const handleOnline = () => {
      alert("✅ Internet restored. Syncing reports.");
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return (
    <Router>
      <NotificationProvider>
        <div className="App" style={{ backgroundColor: "#0D1117", minHeight: "100vh" }}>
          <Header />

          <Routes>
            {/* Home Page */}
            <Route
              path="/"
              element={<Home3D />}
            />

            {/* Report Disaster */}
            <Route
              path="/report-disaster"
              element={<ReportDisaster3D />}
            />

            {/* Damage Assessment */}
            <Route
              path="/damage-assessment"
              element={
                <div style={{ ...darkPage, padding: "40px 20px" }}>
                  <DamageAssessment />
                </div>
              }
            />

            {/* Features */}
            <Route
              path="/features"
              element={
                <div style={darkPage}>
                  <Features />
                </div>
              }
            />

            {/* First Aid */}
            <Route
              path="/first-aid"
              element={
                <div style={darkPage}>
                  <FirstAid />
                </div>
              }
            />

            {/* Shelter Finder */}
            <Route
              path="/shelters"
              element={
                <div style={darkPage}>
                  <ShelterFinder />
                </div>
              }
            />

            {/* Relief Bot */}
            <Route
              path="/relief-bot"
              element={
                <div style={darkPage}>
                  <ReliefBot />
                </div>
              }
            />

            {/* SOS Emergency */}
            <Route
              path="/sos"
              element={
                <div style={darkPage}>
                  <SOSEmergency />
                </div>
              }
            />

            {/* Disaster News */}
            <Route
              path="/disaster-news"
              element={
                <div style={darkPage}>
                  <DisasterNews />
                </div>
              }
            />


            {/* Officer Dashboard & Auth */}
            <Route path="/signup" element={<OfficerRegister />} />
            <Route
              path="/officer/register"
              element={
                <div style={darkPage}>
                  <OfficerRegister />
                </div>
              }
            />
            <Route
              path="/officer/login"
              element={
                <div style={darkPage}>
                  <OfficerLogin />
                </div>
              }
            />
            <Route 
              path="/officer/dashboard" 
              element={
                <div style={darkPage}>
                  <OfficerDashboard />
                </div>
              } 
            />

            {/* Admin Panels */}
            <Route 
              path="/admin/disaster" 
              element={
                <div style={darkPage}>
                  <AdminDisaster />
                </div>
              } 
            />
          </Routes>
          
          <ReliefBotFloating />
          <ThemeToggle />
        </div>
      </NotificationProvider>
    </Router>
  );
}

export default App;