import { useNavigate } from "react-router-dom";
import './SignIn.css';

function SignIn({ onSignIn }) {
  const navigate = useNavigate();

  const handleSignIn = (e) => {
    e.preventDefault(); // Prevent page reload
    onSignIn(); // Call the onSignIn function to mark the user as authenticated
    navigate("/dashboard"); // Redirect to Dashboard after successful login
  };

  return (
    <div className="signin-container">
      <div className="signin-card">
        <button className="back-button" onClick={() => window.history.back()}>
          ← Back
        </button>
        <div className="signin-content">
          <div className="signin-text-logo">Rescueplex</div> {/* Text-based logo */}
          <h2>Login</h2>
          <p>
            Welcome back! <span role="img" aria-label="wave">👋</span> Login to get started!
          </p>
          <form className="signin-form" onSubmit={handleSignIn}>
            <div className="form-group">
              <label htmlFor="email">Email*</label>
              <input
                type="email"
                id="email"
                placeholder="Enter your email"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password*</label>
              <input
                type="password"
                id="password"
                placeholder="Min. 8 characters"
                required
              />
              <div className="forgot-password">
                <a href="/forgot-password">Forgot Password?</a>
              </div>
            </div>
            <button type="submit" className="signin-button">
              Login
            </button>
          </form>
          <p className="signup-text">
            Not registered yet? <a href="/signup">Create an Account</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignIn;
