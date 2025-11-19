import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getGameDetails, addGameToMyList } from "../database/api";
import ReviewSection from "../components/ReviewSection";
import { PageLoader } from "../components/LoadingStates";

export default function GameDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [addingToList, setAddingToList] = useState(false);

  const loadGameData = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getGameDetails(id);
      setGame(data);
    } catch (err) {
      console.error("Failed to load game:", err);
      setError(err.message || "Failed to load game details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadGameData();
  }, [loadGameData]);

  const handleAddToList = async (status) => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (addingToList) return;

    setAddingToList(true);
    try {
      await addGameToMyList({
        game_id: parseInt(id),
        status,
      });
      setSelectedStatus(status);

      // Show success feedback
      const statusLabel = status.replace(/_/g, " ");
      alert(`✓ Added to ${statusLabel} list!`);
    } catch (err) {
      console.error("Failed to add to list:", err);
      alert("Failed to add game to list. Please try again.");
    } finally {
      setAddingToList(false);
    }
  };

  if (loading) {
    return (
      <main className="page">
        <div className="container">
          <PageLoader message="Loading game details..." />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="page">
        <div className="container" style={{ marginTop: "2rem" }}>
          <div
            className="panel"
            style={{ textAlign: "center", padding: "2rem" }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>😞</div>
            <h2>Failed to Load Game</h2>
            <p style={{ color: "var(--muted)", marginBottom: "2rem" }}>
              {error}
            </p>
            <div
              style={{ display: "flex", gap: "1rem", justifyContent: "center" }}
            >
              <button className="btn primary" onClick={loadGameData}>
                Try Again
              </button>
              <button className="btn ghost" onClick={() => navigate("/")}>
                Go Home
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!game) {
    return (
      <main className="page">
        <div className="container" style={{ marginTop: "2rem" }}>
          <div
            className="panel"
            style={{ textAlign: "center", padding: "2rem" }}
          >
            <h2>Game not found</h2>
            <p style={{ color: "var(--muted)", marginBottom: "2rem" }}>
              The game you're looking for doesn't exist.
            </p>
            <button className="btn primary" onClick={() => navigate("/")}>
              Go Home
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="container" style={{ marginTop: "2rem" }}>
        <div
          className="panel"
          style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}
        >
          {/* Game Cover */}
          {game.cover && (
            <img
              src={game.cover}
              alt={game.title}
              style={{
                width: "264px",
                height: "352px",
                objectFit: "cover",
                borderRadius: "8px",
              }}
              loading="lazy"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          )}

          {/* Game Info */}
          <div style={{ flex: 1, minWidth: "300px" }}>
            <h1 style={{ marginBottom: "1rem" }}>{game.title}</h1>

            {game.genres && game.genres.length > 0 && (
              <div
                style={{
                  marginBottom: "1rem",
                  display: "flex",
                  gap: "0.5rem",
                  flexWrap: "wrap",
                }}
              >
                {game.genres.map((genre, idx) => (
                  <span
                    key={idx}
                    style={{
                      padding: "0.25rem 0.75rem",
                      background: "var(--primary)",
                      borderRadius: "12px",
                      fontSize: "0.85rem",
                    }}
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {game.rating && (
              <div style={{ marginBottom: "1rem" }}>
                <span
                  style={{
                    fontSize: "2rem",
                    fontWeight: "bold",
                    color: "var(--primary)",
                  }}
                >
                  {(game.rating > 10 ? game.rating / 10 : game.rating).toFixed(
                    1
                  )}
                </span>
                <span style={{ color: "var(--muted)", marginLeft: "0.5rem" }}>
                  / 10
                </span>
                {game.ratingCount && (
                  <span
                    style={{
                      color: "var(--muted)",
                      fontSize: "0.9rem",
                      marginLeft: "0.5rem",
                    }}
                  >
                    ({game.ratingCount} ratings)
                  </span>
                )}
              </div>
            )}

            {game.releaseDate && (
              <p style={{ color: "var(--muted)", marginBottom: "1rem" }}>
                Released: {new Date(game.releaseDate).toLocaleDateString()}
              </p>
            )}

            {game.summary && (
              <p
                style={{
                  color: "var(--muted)",
                  lineHeight: "1.6",
                  marginBottom: "2rem",
                }}
              >
                {game.summary}
              </p>
            )}

            {/* Add to List Section */}
            {user && (
              <div style={{ marginTop: "2rem" }}>
                <h3 style={{ marginBottom: "1rem" }}>Add to Your List</h3>

                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                  <button
                    className="btn primary"
                    onClick={() => handleAddToList("playing")}
                    disabled={selectedStatus === "playing" || addingToList}
                  >
                    {selectedStatus === "playing" ? "✓ Playing" : "Playing"}
                  </button>
                  <button
                    className="btn"
                    onClick={() => handleAddToList("completed")}
                    disabled={selectedStatus === "completed" || addingToList}
                  >
                    {selectedStatus === "completed"
                      ? "✓ Completed"
                      : "Completed"}
                  </button>
                  <button
                    className="btn"
                    onClick={() => handleAddToList("plan_to_play")}
                    disabled={selectedStatus === "plan_to_play" || addingToList}
                  >
                    {selectedStatus === "plan_to_play"
                      ? "✓ Plan to Play"
                      : "Plan to Play"}
                  </button>
                </div>
              </div>
            )}

            {!user && (
              <div
                style={{
                  marginTop: "2rem",
                  padding: "1rem",
                  background: "#1b1b25",
                  borderRadius: "8px",
                }}
              >
                <p style={{ color: "var(--muted)", marginBottom: "1rem" }}>
                  Want to track this game?
                </p>
                <button
                  className="btn primary"
                  onClick={() => navigate("/login")}
                >
                  Login to Add to List
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Screenshots */}
        {game.screenshots && game.screenshots.length > 0 && (
          <div className="panel" style={{ marginTop: "2rem" }}>
            <h2 style={{ marginBottom: "1rem" }}>Screenshots</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "1rem",
              }}
            >
              {game.screenshots.map((screenshot, idx) => (
                <img
                  key={idx}
                  src={screenshot}
                  alt={`Screenshot ${idx + 1}`}
                  style={{
                    width: "100%",
                    borderRadius: "8px",
                    objectFit: "cover",
                    aspectRatio: "16/9",
                  }}
                  loading="lazy"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div className="panel" style={{ marginTop: "2rem" }}>
          <ReviewSection gameId={id} />
        </div>
      </div>
    </main>
  );
}
