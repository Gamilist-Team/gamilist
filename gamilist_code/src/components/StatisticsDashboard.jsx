import { useState, useEffect, useCallback } from "react";
import { InlineLoader } from "./LoadingStates";

export default function StatisticsDashboard({ userId }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const API = import.meta.env.VITE_API_URL || "http://localhost:10000";
      const url = userId
        ? `${API}/api/users/${userId}/stats`
        : `${API}/api/my/stats`;

      const response = await fetch(url, { credentials: "include" });

      if (!response.ok) {
        throw new Error("Failed to fetch statistics");
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error("Failed to load statistics:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <InlineLoader />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div style={{ padding: "1rem", textAlign: "center", color: "#ef4444" }}>
        Failed to load statistics
      </div>
    );
  }

  const StatCard = ({ icon, label, value, color = "var(--primary)" }) => (
    <div
      style={{
        padding: "1.5rem",
        background: "#1b1b25",
        borderRadius: "8px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{icon}</div>
      <div
        style={{
          fontSize: "2rem",
          fontWeight: "bold",
          color,
          marginBottom: "0.25rem",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: "0.9rem", color: "var(--muted)" }}>{label}</div>
    </div>
  );

  return (
    <div>
      {/* Main Stats Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <StatCard
          icon="🎮"
          label="Total Games"
          value={stats.total_games || 0}
          color="var(--primary)"
        />
        <StatCard
          icon="▶️"
          label="Playing"
          value={stats.playing || 0}
          color="#3b82f6"
        />
        <StatCard
          icon="✅"
          label="Completed"
          value={stats.completed || 0}
          color="#22c55e"
        />
        <StatCard
          icon="📅"
          label="Plan to Play"
          value={stats.plan_to_play || 0}
          color="#f59e0b"
        />
      </div>

      {/* Secondary Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "1rem",
        }}
      >
        <StatCard
          icon="⭐"
          label="Avg Rating"
          value={stats.average_rating ? stats.average_rating.toFixed(1) : "N/A"}
          color="#eab308"
        />
        <StatCard
          icon="✍️"
          label="Reviews Written"
          value={stats.reviews_written || 0}
          color="#8b5cf6"
        />
        <StatCard
          icon="🏆"
          label="Achievements"
          value={stats.achievements_unlocked || 0}
          color="#f97316"
        />
        <StatCard
          icon="🔥"
          label="Day Streak"
          value={stats.day_streak || 0}
          color="#ef4444"
        />
      </div>

      {/* Favorite Genres */}
      {stats.favorite_genres && stats.favorite_genres.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <h3 style={{ marginBottom: "1rem" }}>Favorite Genres</h3>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {stats.favorite_genres.map((genre, idx) => (
              <span
                key={idx}
                style={{
                  padding: "0.5rem 1rem",
                  background: "var(--primary)",
                  borderRadius: "20px",
                  fontSize: "0.9rem",
                }}
              >
                {genre.name} ({genre.count})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recently Completed */}
      {stats.recently_completed && stats.recently_completed.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <h3 style={{ marginBottom: "1rem" }}>Recently Completed</h3>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
          >
            {stats.recently_completed.map((game, idx) => (
              <div
                key={idx}
                style={{
                  padding: "0.75rem",
                  background: "#1b1b25",
                  borderRadius: "4px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>{game.title}</span>
                <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                  {new Date(game.completed_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
