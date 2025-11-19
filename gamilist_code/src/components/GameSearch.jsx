import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import GameCard from "./GameCard";

// Debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function GameSearch({ onClose }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recentSearches, setRecentSearches] = useState([]);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("recentSearches");
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse recent searches:", e);
      }
    }
  }, []);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Perform search when debounced term changes
  const performSearchCallback = useCallback(async (term) => {
    setLoading(true);
    setError(null);

    try {
      const API = import.meta.env.VITE_API_URL || "http://localhost:10000";
      const response = await fetch(
        `${API}/api/igdb/search?q=${encodeURIComponent(term)}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();
      setResults(data);

      // Save to recent searches
      setRecentSearches((prev) => {
        const updated = [term, ...prev.filter((s) => s !== term)].slice(0, 5);
        localStorage.setItem("recentSearches", JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      console.error("Search error:", err);
      setError("Failed to search games. Please try again.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!debouncedSearchTerm || debouncedSearchTerm.length < 2) {
      setResults([]);
      return;
    }

    performSearchCallback(debouncedSearchTerm);
  }, [debouncedSearchTerm, performSearchCallback]);

  const handleClear = () => {
    setSearchTerm("");
    setResults([]);
    setError(null);
    inputRef.current?.focus();
  };

  const handleRecentSearchClick = (term) => {
    setSearchTerm(term);
  };

  const handleGameClick = (gameId) => {
    navigate(`/games/${gameId}`);
    if (onClose) onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.9)",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        padding: "2rem",
        overflowY: "auto",
      }}
    >
      {/* Search Header */}
      <div
        style={{
          maxWidth: "800px",
          width: "100%",
          margin: "0 auto",
          marginBottom: "2rem",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "1rem",
            alignItems: "center",
            marginBottom: "1rem",
          }}
        >
          <div style={{ flex: 1, position: "relative" }}>
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for games..."
              style={{
                width: "100%",
                padding: "1rem 3rem 1rem 1rem",
                fontSize: "1.1rem",
                background: "var(--panel)",
                border: "2px solid var(--primary)",
                borderRadius: "8px",
                color: "var(--text)",
              }}
            />
            {searchTerm && (
              <button
                onClick={handleClear}
                style={{
                  position: "absolute",
                  right: "1rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "var(--muted)",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  padding: "0.25rem",
                }}
              >
                ×
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="btn ghost"
            style={{ fontSize: "1rem" }}
          >
            Close (Esc)
          </button>
        </div>

        {/* Recent Searches */}
        {!searchTerm && recentSearches.length > 0 && (
          <div style={{ marginTop: "1rem" }}>
            <p
              style={{
                color: "var(--muted)",
                marginBottom: "0.5rem",
                fontSize: "0.9rem",
              }}
            >
              Recent searches:
            </p>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {recentSearches.map((term, idx) => (
                <button
                  key={idx}
                  onClick={() => handleRecentSearchClick(term)}
                  style={{
                    padding: "0.5rem 1rem",
                    background: "var(--panel)",
                    border: "1px solid #2f2f3a",
                    borderRadius: "20px",
                    color: "var(--text)",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                  }}
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Search Results */}
      <div
        style={{
          maxWidth: "1200px",
          width: "100%",
          margin: "0 auto",
        }}
      >
        {loading && (
          <div
            style={{
              textAlign: "center",
              padding: "2rem",
              color: "var(--muted)",
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🔍</div>
            Searching...
          </div>
        )}

        {error && (
          <div
            style={{
              textAlign: "center",
              padding: "2rem",
              color: "#ef4444",
              background: "rgba(239, 68, 68, 0.1)",
              borderRadius: "8px",
            }}
          >
            {error}
          </div>
        )}

        {!loading && !error && debouncedSearchTerm && results.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "2rem",
              color: "var(--muted)",
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>😞</div>
            No games found for "{debouncedSearchTerm}"
          </div>
        )}

        {results.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {results.map((game) => (
              <div key={game.id} onClick={() => handleGameClick(game.id)}>
                <GameCard game={game} />
              </div>
            ))}
          </div>
        )}

        {!searchTerm && !loading && (
          <div
            style={{
              textAlign: "center",
              padding: "3rem",
              color: "var(--muted)",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎮</div>
            <p>Start typing to search for games</p>
          </div>
        )}
      </div>
    </div>
  );
}
