import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMyRecommendations, addGameToMyList } from "../database/api";
import { useAuth } from "../contexts/AuthContext";
import "./RecommendationsPage.css";

function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState([]);
  const [basedOn, setBasedOn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingGames, setAddingGames] = useState(new Set());
  const [selectedGenre, setSelectedGenre] = useState("all");
  const { user } = useAuth();
  const navigate = useNavigate();

  // Dummy recommendations for empty state
  const dummyRecommendations = [
    {
      id: "dummy-1",
      title: "The Witcher 3: Wild Hunt",
      rating: 9.5,
      cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co5ume.jpg",
      genres: ["RPG", "Adventure"],
      isDummy: true,
    },
    {
      id: "dummy-2",
      title: "Hades",
      rating: 9.3,
      cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co2i0r.jpg",
      genres: ["Roguelike", "Action"],
      isDummy: true,
    },
    {
      id: "dummy-3",
      title: "Hollow Knight",
      rating: 9.0,
      cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1rgi.jpg",
      genres: ["Metroidvania", "Platformer"],
      isDummy: true,
    },
    {
      id: "dummy-4",
      title: "Celeste",
      rating: 8.8,
      cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1tmu.jpg",
      genres: ["Platformer", "Indie"],
      isDummy: true,
    },
    {
      id: "dummy-5",
      title: "Stardew Valley",
      rating: 8.9,
      cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co2w4b.jpg",
      genres: ["Simulation", "RPG"],
      isDummy: true,
    },
    {
      id: "dummy-6",
      title: "Dark Souls III",
      rating: 9.2,
      cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1vcz.jpg",
      genres: ["Action RPG", "Souls-like"],
      isDummy: true,
    },
  ];

  const dummyBasedOn = {
    genres: ["RPG", "Action", "Adventure", "Indie"],
    games: [
      "Elden Ring",
      "Baldur's Gate 3",
      "Cyberpunk 2077",
      "Red Dead Redemption 2",
    ],
  };

  const allGenres = [
    "all",
    "RPG",
    "Action",
    "Adventure",
    "Indie",
    "Platformer",
    "Simulation",
    "Roguelike",
  ];

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    loadRecommendations();
  }, [user, navigate]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const data = await getMyRecommendations();
      // If no recommendations, use dummy data
      if (!data.recommendations || data.recommendations.length === 0) {
        setRecommendations(dummyRecommendations);
        setBasedOn(dummyBasedOn);
      } else {
        setRecommendations(data.recommendations);
        setBasedOn(data.basedOn || null);
      }
    } catch (error) {
      console.error("Failed to load recommendations:", error);
      // On error, show dummy data
      setRecommendations(dummyRecommendations);
      setBasedOn(dummyBasedOn);
      if (error.message.includes("401")) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddToList = async (game) => {
    if (game.isDummy) {
      alert(
        "This is a demo recommendation! Add games to your list and rate them to get real personalized recommendations."
      );
      return;
    }

    if (addingGames.has(game.id)) return;

    try {
      setAddingGames(new Set([...addingGames, game.id]));
      await addGameToMyList({
        gameId: game.id,
        status: "plan_to_play",
      });

      // Remove from recommendations after adding
      setRecommendations(recommendations.filter((g) => g.id !== game.id));
    } catch (error) {
      console.error("Failed to add game:", error);
      alert("Failed to add game to your list");
    } finally {
      setAddingGames((prev) => {
        const next = new Set(prev);
        next.delete(game.id);
        return next;
      });
    }
  };

  const filteredRecommendations =
    selectedGenre === "all"
      ? recommendations
      : recommendations.filter(
          (game) =>
            game.genres &&
            game.genres.some((g) =>
              g.toLowerCase().includes(selectedGenre.toLowerCase())
            )
        );

  if (loading) {
    return (
      <div className="recommendations-page">
        <div className="loading">Loading recommendations...</div>
      </div>
    );
  }

  return (
    <div className="recommendations-page">
      <div className="recommendations-header">
        <h1>✨ Personalized Recommendations</h1>
        <p>Games you might enjoy based on your gaming preferences</p>
      </div>

      {basedOn && basedOn.games && basedOn.games.length > 0 && (
        <div className="based-on-section">
          <h3>🎯 Recommended based on:</h3>
          <div className="based-on-content">
            {basedOn.genres && basedOn.genres.length > 0 && (
              <div className="based-on-item">
                <span className="label">Your favorite genres:</span>
                <div className="tags">
                  {basedOn.genres.map((genre, idx) => (
                    <span key={idx} className="tag">
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {basedOn.games.length > 0 && (
              <div className="based-on-item">
                <span className="label">Games you enjoyed:</span>
                <div className="games-list">
                  {basedOn.games.slice(0, 5).map((game, idx) => (
                    <span key={idx} className="game-name">
                      🎮 {game}
                    </span>
                  ))}
                  {basedOn.games.length > 5 && (
                    <span className="more">
                      +{basedOn.games.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="genre-filters">
          {allGenres.map((genre) => (
            <button
              key={genre}
              className={`genre-filter-btn ${
                selectedGenre === genre ? "active" : ""
              }`}
              onClick={() => setSelectedGenre(genre)}
            >
              {genre === "all" ? "🌐 All" : `🎮 ${genre}`}
            </button>
          ))}
        </div>
      )}

      {filteredRecommendations.length === 0 && recommendations.length > 0 ? (
        <div className="no-recommendations">
          <div className="empty-state">
            <span className="icon">🔍</span>
            <h3>No games found in this genre</h3>
            <p>Try selecting a different genre filter</p>
          </div>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="no-recommendations">
          <div className="empty-state">
            <span className="icon">🎮</span>
            <h3>No recommendations yet</h3>
            <p>
              Start adding games to your list and rating them to get
              personalized recommendations!
            </p>
            <button onClick={() => navigate("/")} className="browse-btn">
              Browse Games
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="recommendations-count">
            <span>
              Showing {filteredRecommendations.length} recommendation
              {filteredRecommendations.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="recommendations-grid">
            {filteredRecommendations.map((game) => (
              <div key={game.id} className="recommendation-card">
                {game.isDummy && <div className="demo-ribbon">Demo</div>}
                <div
                  className="game-cover"
                  style={{
                    backgroundImage: game.cover ? `url(${game.cover})` : "none",
                    backgroundColor: game.cover
                      ? "transparent"
                      : "var(--surface)",
                  }}
                  onClick={() => !game.isDummy && navigate(`/games/${game.id}`)}
                >
                  {!game.cover && (
                    <div className="no-cover">
                      <span>🎮</span>
                    </div>
                  )}
                  <div className="rating-badge">
                    ⭐{" "}
                    {game.rating
                      ? (game.rating > 10
                          ? game.rating / 10
                          : game.rating
                        ).toFixed(1)
                      : "N/A"}
                  </div>
                </div>

                <div className="game-info">
                  <h3
                    className="game-title"
                    onClick={() =>
                      !game.isDummy && navigate(`/games/${game.id}`)
                    }
                  >
                    {game.title}
                  </h3>

                  {game.genres && game.genres.length > 0 && (
                    <div className="game-genres">
                      {game.genres.slice(0, 2).map((genre, idx) => (
                        <span key={idx} className="genre-tag">
                          {genre}
                        </span>
                      ))}
                    </div>
                  )}

                  <button
                    className={`add-btn ${
                      addingGames.has(game.id) ? "adding" : ""
                    }`}
                    onClick={() => handleAddToList(game)}
                    disabled={addingGames.has(game.id)}
                  >
                    {addingGames.has(game.id)
                      ? "✓ Added"
                      : "+ Add to Plan to Play"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default RecommendationsPage;
