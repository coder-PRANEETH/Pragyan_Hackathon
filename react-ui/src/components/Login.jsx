import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';

function Login() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      alert('Please enter your name');
      return;
    }

    try {
      setLoading(true);

      // Verify user exists in database
      const response = await fetch(
        `https://pragyan-hackathon.onrender.com/user-details/${encodeURIComponent(trimmedName)}`
      );

      if (!response.ok) {
        setLoading(false);
        alert('User not found. Please check your name or create a new account.');
        return;
      }

      const userData = await response.json();

      // Redirect to dashboard with userName in URL
      navigate(`/dashboard?userName=${encodeURIComponent(userData.name)}`);
    } catch (error) {
      setLoading(false);
      alert(`Error logging in: ${error.message}`);
    }
  };

  const handleCreateAccount = () => {
    navigate('/create-user');
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <span className="login-icon">🏥</span>
          <h1>Medical Triage</h1>
          <p>Access your health dashboard</p>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="name">Enter Your Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
              autoFocus
              disabled={loading}
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-small"></span>
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </button>

          <div className="divider">
            <span>or</span>
          </div>

          <button
            type="button"
            className="create-account-btn"
            onClick={handleCreateAccount}
            disabled={loading}
          >
            Create New Account
          </button>
        </form>

        <div className="login-footer">
          <p>No password required - your name is your identity</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
