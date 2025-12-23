import React from "react";
import "./SignUp.css";

function SignUp() {
  return (
    <div className="signup-container">
      <div className="signup-card">
        <button className="back-button" onClick={() => window.history.back()}>
          ← Back
        </button>
        <div className="signup-content">
          <div className="signup-text-logo">Rescueplex</div> {/* Text-based logo */}
          <h2>Create an Account</h2>
          <p>
            Join Rescueplex and streamline your disaster recovery with advanced
            tools and features.
          </p>
          <form className="signup-form">
            <div className="form-group">
              <label htmlFor="name">Name*</label>
              <input type="text" id="name" placeholder="Enter your name" />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email*</label>
              <input type="email" id="email" placeholder="Enter your email" />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password*</label>
              <input
                type="password"
                id="password"
                placeholder="Enter your password"
              />
            </div>
            <button type="submit" className="signup-button">
              Register
            </button>
          </form>
          <p className="signin-text">
            Already have an account? <a href="/signin">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
