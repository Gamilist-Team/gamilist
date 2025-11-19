import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const API_URL = import.meta.env.VITE_API_URL || "";

  return (
    <main className="page">
      <div className="container" style={{ marginTop: '4rem', maxWidth: '400px' }}>
        <div className="panel">
          <h1 style={{ marginBottom: '2rem', textAlign: 'center' }}>Login to Gamilist</h1>
          
          {error && (
            <div style={{ padding: '1rem', marginBottom: '1rem', background: '#ff4444', borderRadius: '8px', color: 'white' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #2f2f3a',
                  borderRadius: '8px',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #2f2f3a',
                  borderRadius: '8px',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: '1rem'
                }}
              />
            </div>

            <button 
              type="submit" 
              className="btn primary" 
              disabled={loading}
              style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div style={{ margin: '1.5rem 0', textAlign: 'center', position: 'relative' }}>
            <div style={{ 
              position: 'absolute', 
              top: '50%', 
              left: 0, 
              right: 0, 
              height: '1px', 
              background: '#2f2f3a' 
            }}></div>
            <span style={{ 
              position: 'relative', 
              background: 'var(--bg-secondary)', 
              padding: '0 1rem', 
              color: 'var(--muted)',
              fontSize: '0.9rem'
            }}>or</span>
          </div>

          <a 
            href={`${API_URL}/api/auth/github`}
            className="btn"
            style={{ 
              width: '100%', 
              padding: '0.75rem', 
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              background: '#24292e',
              color: 'white',
              border: 'none',
              textDecoration: 'none'
            }}
          >
            <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
            </svg>
            Login with GitHub
          </a>

          <p style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--muted)' }}>
            Don't have an account? <Link to="/register" style={{ color: 'var(--primary)' }}>Register</Link>
          </p>

          <div style={{ marginTop: '2rem', padding: '1rem', background: '#1b1b25', borderRadius: '8px' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
              <strong>Test accounts:</strong>
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
              Username: <strong>rashad</strong> / Password: <strong>password123</strong><br/>
              Username: <strong>guest</strong> / Password: <strong>password123</strong>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

