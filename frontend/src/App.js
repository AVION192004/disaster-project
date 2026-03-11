import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Header from "./components/Header";
import HeroSection from "./components/HeroSection";
import Features from "./components/Features";
import HowItWorks from "./components/HowItWorks";
import DamageAssessment from './components/DamageAssessment';
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


// Reusable dark page wrapper — fixes white gap on all pages
const darkPage = {
  backgroundColor: '#0D1117',
  minHeight: '100vh',
  paddingTop: '20px',
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <Router>
      {/* Dark background covers entire app — no more white gaps */}
      <div className="App" style={{ backgroundColor: '#0D1117', minHeight: '100vh' }}>
        <Header />
        <Routes>

          {/* Home Page — clean, just hero + how it works */}
          <Route
            path="/"
            element={
              <>
                <HeroSection />
                <HowItWorks />
              </>
            }
          />

          {/* Damage Assessment — full dark page */}
          <Route
            path="/damage-assessment"
            element={
              <div style={{ ...darkPage, padding: '40px 20px' }}>
                <DamageAssessment />
              </div>
            }
          />

          {/* Report Disaster — its own dedicated page */}
          <Route
            path="/report-disaster"
            element={
              <div style={darkPage}>
                <ReportDisaster />
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

          {/* Auth pages */}
          <Route path="/signup" element={<div style={darkPage}><SignUp /></div>} />
          <Route
            path="/signIn"
            element={
              <div style={darkPage}>
                <SignIn onSignIn={() => setIsAuthenticated(true)} />
              </div>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Officer Routes */}
          <Route path="/officer/register" element={<div style={darkPage}><OfficerRegister /></div>} />
          <Route path="/officer/login"    element={<div style={darkPage}><OfficerLogin /></div>} />
          <Route path="/officer/dashboard" element={<OfficerDashboard />} />

          {/* Admin Routes */}
          <Route path="/admin/disaster" element={<AdminDisaster />} />

        </Routes>
      </div>
    </Router>
  );
}

export default App;