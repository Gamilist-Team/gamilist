import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="hdr">
      <div className="container hdr-row">
        <Link to="/" className="brand">Gamilist</Link>
        <nav className="nav">
          <Link to="/">Games</Link>
          <Link to="/forum">Community</Link>
          {user && <Link to="/profile">My Lists</Link>}
        </nav>
        <div className="hdr-actions">
          <button className="btn ghost">Search</button>
          {user ? (
            <>
              <Link to="/profile" style={{ marginRight: '1rem', color: 'var(--primary)', textDecoration: 'none' }}>
                👤 {user.username}
              </Link>
              <button className="btn ghost" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <button className="btn ghost" onClick={() => navigate('/login')}>Login</button>
              <button className="btn" onClick={() => navigate('/register')}>Register</button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
