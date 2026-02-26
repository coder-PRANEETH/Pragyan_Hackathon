import { Link, useSearchParams, useLocation } from 'react-router-dom';
import '../styles/Navbar.css';

function Navbar() {
  const [searchParams] = useSearchParams();
  const location = useLocation();

  // Get userName from URL if available
  const userName = searchParams.get('userName');

  // Build profile link with userName if available
  const profileLink = userName
    ? `/profile?userName=${encodeURIComponent(userName)}`
    : '/profile';

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <Link to={userName ? `/dashboard?userName=${encodeURIComponent(userName)}` : '/'}>
            <span className="logo-icon">🏥</span>
            <span className="logo-text">Medical Triage</span>
          </Link>
        </div>

        <div className="navbar-links">
          <Link to={userName ? `/dashboard?userName=${encodeURIComponent(userName)}` : '/dashboard'} className="nav-link">
            Dashboard
          </Link>
          {!userName && (
            <Link to="/create-user" className="nav-link">
              Create User
            </Link>
          )}
          <Link to={userName ? `/chat?userName=${encodeURIComponent(userName)}` : '/chat'} className="nav-link">
            Chat
          </Link>
        </div>

        {userName ? (
          <Link to={profileLink} className="profile-icon">
            <img
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
              alt="Profile"
            />
          </Link>
        ) : (
          <Link to="/" className="nav-link login-link">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
