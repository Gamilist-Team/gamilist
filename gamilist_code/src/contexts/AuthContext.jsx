import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const API =
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined" ? window.location.origin : "");


export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch(`${API}/api/auth/me`, {
        credentials: 'include',
      });

      if (response.status === 401) {
        // Not logged in – this is normal, no error
        setUser(null);
        return;
      }

      if (!response.ok) {
        // Some other server error – log it but don't crash the app
        const text = await response.text();
        console.error('Auth check error:', response.status, text.slice(0, 120));
        return;
      }

      const data = await response.json();
      setUser(data.user);
    } catch (error) {
      // Only network / fetch failures land here
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };


  const login = async (username, password) => {
    const response = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      credentials: 'include'
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Login failed');
    }

    const data = await response.json();
    setUser(data.user);
    return data.user;
  };

  const register = async (username, email, password) => {
    const response = await fetch(`${API}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
      credentials: 'include'
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Registration failed');
    }

    const data = await response.json();
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    await fetch(`${API}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

