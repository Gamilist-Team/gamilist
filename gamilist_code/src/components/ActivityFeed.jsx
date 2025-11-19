import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { InlineLoader } from "./LoadingStates";

export default function ActivityFeed({ userId, limit = 10 }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const loadActivities = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const API = import.meta.env.VITE_API_URL || "http://localhost:10000";
      const url = userId
        ? `${API}/api/users/${userId}/activities?limit=${limit}`
        : `${API}/api/activities?limit=${limit}`;

      const response = await fetch(url, { credentials: "include" });

      if (!response.ok) {
        throw new Error("Failed to fetch activities");
      }

      const data = await response.json();
      setActivities(data);
    } catch (err) {
      console.error("Failed to load activities:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId, limit]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const getActivityIcon = (type) => {
    switch (type) {
      case "game_added":
        return "📝";
      case "game_completed":
        return "🏆";
      case "review_posted":
        return "✍️";
      case "rating_updated":
        return "⭐";
      case "achievement_unlocked":
        return "🎖️";
      default:
        return "🎮";
    }
  };

  const getActivityText = (activity) => {
    switch (activity.activity_type) {
      case "game_added":
        return `added ${activity.game_title || "a game"} to ${
          activity.list_status?.replace(/_/g, " ") || "their list"
        }`;
      case "game_completed":
        return `completed ${activity.game_title || "a game"}`;
      case "review_posted":
        return `posted a review for ${activity.game_title || "a game"}`;
      case "rating_updated":
        return `rated ${activity.game_title || "a game"} ${activity.rating}/10`;
      case "achievement_unlocked":
        return `unlocked achievement: ${
          activity.achievement_name || "Unknown"
        }`;
      default:
        return activity.description || "performed an activity";
    }
  };

  const handleActivityClick = (activity) => {
    if (activity.game_id) {
      navigate(`/games/${activity.game_id}`);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "1rem", textAlign: "center" }}>
        <InlineLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "1rem", textAlign: "center", color: "#ef4444" }}>
        Failed to load activity feed
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div
        style={{ padding: "2rem", textAlign: "center", color: "var(--muted)" }}
      >
        <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📭</div>
        <p>No recent activity</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {activities.map((activity) => (
        <div
          key={activity.id}
          onClick={() => handleActivityClick(activity)}
          style={{
            padding: "1rem",
            background: "#1b1b25",
            borderRadius: "8px",
            display: "flex",
            gap: "1rem",
            alignItems: "flex-start",
            cursor: activity.game_id ? "pointer" : "default",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => {
            if (activity.game_id) {
              e.currentTarget.style.background = "#2f2f3a";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#1b1b25";
          }}
        >
          <div style={{ fontSize: "1.5rem", flexShrink: 0 }}>
            {getActivityIcon(activity.activity_type)}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ marginBottom: "0.25rem" }}>
              <strong>{activity.username || "User"}</strong>{" "}
              <span style={{ color: "var(--muted)" }}>
                {getActivityText(activity)}
              </span>
            </p>
            <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
              {new Date(activity.created_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
