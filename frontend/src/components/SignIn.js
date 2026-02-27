import React from "react";
import { useNavigate, Link } from "react-router-dom";
import "./SignIn.css";

function SignIn({ onSignIn }) {
  const navigate = useNavigate();

  const handleSignIn = (e) => {
    e.preventDefault();
    onSignIn();
    navigate("/officer/dashboard");
  };

  return (
    <div className="signin-page">

      {/* Left panel — branding */}
      <div className="signin-brand" aria-hidden="true">
        <div className="signin-brand__inner">
          <div className="signin-brand__logo">
            <span className="signin-brand__mark">RV</span>
            <span className="signin-brand__name">RescueVision</span>
          </div>
          <blockquote className="signin-brand__quote">
            "Coordinating disaster response across 12 state agencies — in real time."
          </blockquote>
          <div className="signin-brand__meta">
            <span className="signin-brand__dot" />
            All systems operational
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <main className="signin-main">
        <div className="signin-card">

          {/* Back */}
          <button
            className="signin-back"
            type="button"
            onClick={() => window.history.back()}
            aria-label="Go back"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Back
          </button>

          {/* Header */}
          <header className="signin-header">
            <h1 className="signin-title">Sign in to your account</h1>
            <p className="signin-subtitle">
              Enter your credentials to access the operations dashboard.
            </p>
          </header>

          {/* Form */}
          <form className="signin-form" onSubmit={handleSignIn} noValidate>

            <div className="form-field">
              <label className="form-label" htmlFor="email">
                Email address
              </label>
              <input
                className="form-input"
                type="email"
                id="email"
                name="email"
                placeholder="officer@agency.gov"
                autoComplete="email"
                required
              />
            </div>

            <div className="form-field">
              <div className="form-label-row">
                <label className="form-label" htmlFor="password">
                  Password
                </label>
                <a className="form-forgot" href="/forgot-password">
                  Forgot password?
                </a>
              </div>
              <input
                className="form-input"
                type="password"
                id="password"
                name="password"
                placeholder="Min. 8 characters"
                autoComplete="current-password"
                required
              />
            </div>

            <button className="signin-submit" type="submit">
              Sign in
            </button>

          </form>

          {/* Footer */}
          <p className="signin-footer">
            Don't have an account?{" "}
            <Link to="/officer/register" className="signin-footer__link">
              Create one
            </Link>
          </p>

        </div>
      </main>

    </div>
  );
}

export default SignIn;