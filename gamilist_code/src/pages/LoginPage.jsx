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

          <p style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--muted)' }}>
            Don't have an account? <Link to="/register" style={{ color: 'var(--primary)' }}>Register</Link>
          </p>

          <div style={{ marginTop: '2rem', padding: '1rem', background: '#1b1b25', borderRadius: '8px' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
              <strong>Test accounts:</strong>
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
              Username: <strong>rashad</strong> / Password: <strong>password123</strong><br/>
              Username: <strong>guest</strong> / Password: <strong>password123</strong><br/>
              Username: <strong>jing</strong> / Password: <strong>password123</strong>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

