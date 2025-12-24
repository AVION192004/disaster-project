import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Header from "./components/Header";
import HeroSection from "./components/HeroSection";
import HowItWorks from "./components/HowItWorks";
import DamageAssessment from './components/DamageAssessment';
import Features from "./components/Features";
import SignUp from "./components/SignUp";
import SignIn from "./components/SignIn";
import Dashboard from "./components/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";

import OfficerRegister from "./pages/OfficerRegister";
import OfficerLogin from "./pages/OfficerLogin";
import OfficerDashboard from "./pages/OfficerDashboard";
import AdminDisaster from "./pages/AdminDisaster";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <Router>
      <div className="App">
        <Header />
        <Routes>
          <Route
            path="/"
            element={
              <>
                <HeroSection />
                <HowItWorks />
                <DamageAssessment />
              </>
            }
          />
          <Route path="/damage-assessment" element={<DamageAssessment />} />
          <Route path="/features" element={<Features />} />
          <Route path="/signup" element={<SignUp />} />
          <Route
            path="/signIn"
            element={<SignIn onSignIn={() => setIsAuthenticated(true)} />}
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
          <Route path="/officer/register" element={<OfficerRegister />} />
          <Route path="/officer/login" element={<OfficerLogin />} />
          <Route path="/officer/dashboard" element={<OfficerDashboard />} />

          {/* Admin Routes */}
          <Route path="/admin/disaster" element={<AdminDisaster />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
