import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import HeroSection from "./components/HeroSection";
import Features from "./components/Features";
import HowItWorks from "./components/HowItWorks";
import DamageAssessment from "./components/DamageAssessment";
import SignUp from "./components/SignUp";
import SignIn from "./components/SignIn";
import Dashboard from "./components/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
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

const darkPage = {
  backgroundColor: "#0D1117",
  minHeight: "100vh",
  paddingTop: "20px",
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
        <div className="App" style={{ backgroundColor: "#0D1117", minHeight: "100vh" }}>
          <Header />

          <Routes>

            {/* Home */}
            <Route
              path="/"
              element={
                <>
                  <HeroSection />
                  <HowItWorks />
                </>
              }
            />

            {/* Report Disaster */}
            <Route
              path="/report-disaster"
              element={
                <div style={darkPage}>
                  <ReportDisaster />
                </div>
              }
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
            <Route path="/shelters" element={<ShelterFinder />} />

            {/* Relief Bot */}
            <Route path="/relief-bot" element={<ReliefBot />} />

            {/* SOS */}
            <Route path="/sos" element={<SOSEmergency />} />

            {/* Sign Up */}
            <Route
              path="/signup"
              element={
                <div style={darkPage}>
                  <SignUp />
                </div>
              }
            />
            <Route path="/disaster-news" element={<DisasterNews />} />

            {/* Sign In */}
            <Route
              path="/signin"
              element={
                <div style={darkPage}>
                  <SignIn onSignIn={() => setIsAuthenticated(true)} />
                </div>
              }
            />

            {/* Dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Officer */}
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

            <Route path="/officer/dashboard" element={<OfficerDashboard />} />

            {/* Admin */}
            <Route path="/admin/disaster" element={<AdminDisaster />} />

          </Routes>
        </div>
        
        <ReliefBotFloating />
        <ThemeToggle />
        
      </Router>
      
  );
}

export default App;