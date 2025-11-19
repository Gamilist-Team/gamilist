import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import GameSearch from "./GameSearch";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showSearch, setShowSearch] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Keyboard shortcut for search (Ctrl/Cmd + K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setShowSearch(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const linkStyle = (path) => ({
    color: isActive(path) ? "var(--primary)" : "inherit",
    fontWeight: isActive(path) ? "600" : "400",
    borderBottom: isActive(path) ? "2px solid var(--primary)" : "none",
    paddingBottom: "4px",
  });

  return (
    <>
      <header className="hdr">
        <div className="container hdr-row">
          <Link to="/" className="brand">
            Gamilist
          </Link>

          {/* Desktop Navigation */}
          <nav
            className="nav"
            style={{ display: window.innerWidth >= 768 ? "flex" : "none" }}
          >
            <Link to="/" style={linkStyle("/")}>
              🎮 Games
            </Link>
            <Link to="/forum" style={linkStyle("/forum")}>
              💬 Community
            </Link>
            {user && (
              <Link to="/recommendations" style={linkStyle("/recommendations")}>
                ✨ For You
              </Link>
            )}
            {user && (
              <Link to="/profile" style={linkStyle("/profile")}>
                📚 My Lists
              </Link>
            )}
          </nav>

          {/* Mobile Menu Toggle */}
          <button
            className="btn ghost"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ display: window.innerWidth < 768 ? "block" : "none" }}
          >
            ☰
          </button>

          <div className="hdr-actions">
            <div className="search-bar-container">
              <button
                className="search-bar-btn"
                onClick={() => setShowSearch(true)}
              >
                <span className="search-icon">🔍</span>
                <span className="search-text">Search games...</span>
                <span className="search-shortcut">Ctrl+K</span>
              </button>
            </div>

            <div
              style={{
                marginLeft: "auto",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              {user ? (
                <>
                  <Link to="/profile" className="user-profile-link">
                    <span className="user-avatar">👤</span>
                    <span className="user-name">{user.username}</span>
                  </Link>
                  <button className="btn ghost" onClick={handleLogout}>
                    🚪 Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="btn ghost"
                    onClick={() => navigate("/login")}
                  >
                    🔐 Login
                  </button>
                  <button className="btn" onClick={() => navigate("/register")}>
                    ✨ Register
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div
            style={{
              background: "var(--panel)",
              padding: "1rem",
              borderTop: "1px solid #2f2f3a",
            }}
          >
            <nav
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                style={linkStyle("/")}
              >
                Games
              </Link>
              <Link
                to="/forum"
                onClick={() => setMobileMenuOpen(false)}
                style={linkStyle("/forum")}
              >
                Community
              </Link>
              {user && (
                <Link
                  to="/recommendations"
                  onClick={() => setMobileMenuOpen(false)}
                  style={linkStyle("/recommendations")}
                >
                  For You
                </Link>
              )}
              {user && (
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  style={linkStyle("/profile")}
                >
                  My Lists
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Search Modal */}
      {showSearch && <GameSearch onClose={() => setShowSearch(false)} />}
    </>
  );
}
