import React from "react";
import { useNavigate, Link } from "react-router-dom";
import "./SignUp.css";

function SignUp({ onSignIn }) {
  const navigate = useNavigate();

  const handleSignUp = (e) => {
    e.preventDefault();
    onSignIn();
    navigate("/officer/dashboard");
  };

  return (
    <div className="signup-page">

      {/* Left panel — branding */}
      <div className="signup-brand" aria-hidden="true">
        <div className="signup-brand__inner">
          <div className="signup-brand__logo">
            <span className="signup-brand__mark">RV</span>
            <span className="signup-brand__name">RescueVision</span>
          </div>

          <div className="signup-brand__stats">
            <div className="signup-brand__stat">
              <span className="signup-brand__stat-number">500+</span>
              <span className="signup-brand__stat-label">Disasters managed</span>
            </div>
            <div className="signup-brand__stat">
              <span className="signup-brand__stat-number">10,000+</span>
              <span className="signup-brand__stat-label">Lives protected</span>
            </div>
            <div className="signup-brand__stat">
              <span className="signup-brand__stat-number">50+</span>
              <span className="signup-brand__stat-label">Rescue teams</span>
            </div>
          </div>

          <blockquote className="signup-brand__quote">
            "RescueVision cut our coordination time by 67% during the last regional flood response."
            <cite className="signup-brand__cite">
              — Director of Emergency Management, Kerala State
            </cite>
          </blockquote>

          <div className="signup-brand__meta">
            <span className="signup-brand__dot" />
            All systems operational
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <main className="signup-main">
        <div className="signup-card">

          {/* Back */}
          <button
            className="signup-back"
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
          <header className="signup-header">
            <h1 className="signup-title">Create your account</h1>
            <p className="signup-subtitle">
              Register as a field officer to access the RescueVision operations platform.
            </p>
          </header>

          {/* Form */}
          <form className="signup-form" onSubmit={handleSignUp} noValidate>

            <div className="signup-form__row">
              <div className="form-field">
                <label className="form-label" htmlFor="first-name">
                  First name
                </label>
                <input
                  className="form-input"
                  type="text"
                  id="first-name"
                  name="firstName"
                  placeholder="Jane"
                  autoComplete="given-name"
                  required
                />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="last-name">
                  Last name
                </label>
                <input
                  className="form-input"
                  type="text"
                  id="last-name"
                  name="lastName"
                  placeholder="Smith"
                  autoComplete="family-name"
                  required
                />
              </div>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="email">
                Work email address
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
              <label className="form-label" htmlFor="agency">
                Agency / Organisation
              </label>
              <input
                className="form-input"
                type="text"
                id="agency"
                name="agency"
                placeholder="State Emergency Management Agency"
                autoComplete="organization"
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <input
                className="form-input"
                type="password"
                id="password"
                name="password"
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="confirm-password">
                Confirm password
              </label>
              <input
                className="form-input"
                type="password"
                id="confirm-password"
                name="confirmPassword"
                placeholder="Re-enter your password"
                autoComplete="new-password"
                required
              />
            </div>

            <button className="signup-submit" type="submit">
              Create account
            </button>

          </form>

          {/* Footer */}
          <p className="signup-footer">
            Already have an account?{" "}
            <Link to="/officer/login" className="signup-footer__link">
              Sign in
            </Link>
          </p>

        </div>
      </main>

    </div>
  );
}

export default SignUp;