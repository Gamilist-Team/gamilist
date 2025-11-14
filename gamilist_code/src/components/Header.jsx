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
          <a href="#">Community</a>
          <a href="#">Lists</a>
        </nav>
        <div className="hdr-actions">
          <button className="btn ghost">Search</button>
          {user ? (
            <>
              <span style={{ marginRight: '1rem', color: 'var(--muted)' }}>
                {user.username}
              </span>
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
