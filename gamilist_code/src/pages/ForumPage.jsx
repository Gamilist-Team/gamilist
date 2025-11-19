import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getForumThreads, createThread, getTrending } from "../database/api";
import { useAuth } from "../contexts/AuthContext";
import "./ForumPage.css";

function ForumPage() {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewThreadForm, setShowNewThreadForm] = useState(false);
  const [newThreadData, setNewThreadData] = useState({
    title: "",
    body: "",
    gameId: "",
  });
  const [trendingGames, setTrendingGames] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const { user } = useAuth();
  const navigate = useNavigate();

  // Dummy threads for empty state
  const dummyThreads = [
    {
      id: "dummy-1",
      title: "🔥 Best RPG hidden gems you've never heard of",
      author_username: "GameMaster42",
      game_title: "Elden Ring",
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      body: "I've been diving deep into some lesser-known RPGs lately and found some absolute treasures! Let me share some recommendations that completely flew under the radar but deserve way more attention...",
      post_count: 27,
      isDummy: true,
    },
    {
      id: "dummy-2",
      title: "💡 Tips for beginners: How to improve your gaming skills",
      author_username: "ProGamer2024",
      created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      body: "After years of competitive gaming, I wanted to share some fundamental tips that helped me improve. These apply to most games and can really level up your gameplay...",
      post_count: 15,
      isDummy: true,
    },
    {
      id: "dummy-3",
      title: "🎮 What are you playing this weekend?",
      author_username: "CasualGamer",
      game_title: "Baldur's Gate 3",
      created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      body: "Weekend is almost here! What games are you planning to dive into? I'm finally starting my playthrough of BG3 and super excited!",
      post_count: 43,
      isDummy: true,
    },
    {
      id: "dummy-4",
      title: "🏆 Just finished my first souls-like game!",
      author_username: "NewbieAdventurer",
      game_title: "Dark Souls III",
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      body: "After countless deaths and almost giving up multiple times, I finally beat Dark Souls III! The sense of accomplishment is unreal. Any recommendations for what to play next?",
      post_count: 8,
      isDummy: true,
    },
    {
      id: "dummy-5",
      title: "📊 Gaming setup showcase - share yours!",
      author_username: "TechEnthusiast",
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      body: "Let's see those beautiful gaming setups! Just finished upgrading mine and would love to see what everyone else is working with.",
      post_count: 31,
      isDummy: true,
    },
  ];

  useEffect(() => {
    loadThreads();
    loadTrendingGames();
  }, []);

  const loadTrendingGames = async () => {
    try {
      const games = await getTrending();
      setTrendingGames(games.slice(0, 20)); // Top 20 games for selection
    } catch (error) {
      console.error("Failed to load games:", error);
    }
  };

  const loadThreads = async () => {
    try {
      setLoading(true);
      const data = await getForumThreads();
      // If no threads from API, use dummy data
      setThreads(data.length > 0 ? data : dummyThreads);
    } catch (error) {
      console.error("Failed to load threads:", error);
      // On error, show dummy data instead of empty state
      setThreads(dummyThreads);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateThread = async (e) => {
    e.preventDefault();

    if (!user) {
      navigate("/login");
      return;
    }

    if (!newThreadData.title.trim() || !newThreadData.body.trim()) {
      alert("Please fill in all fields");
      return;
    }

    try {
      const thread = await createThread({
        title: newThreadData.title,
        body: newThreadData.body,
        gameId: newThreadData.gameId || null,
      });
      setThreads([thread, ...threads]);
      setNewThreadData({ title: "", body: "", gameId: "" });
      setShowNewThreadForm(false);
      navigate(`/forum/${thread.id}`);
    } catch (error) {
      console.error("Failed to create thread:", error);
      alert("Failed to create thread");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;

    // If time is in the future or just now
    if (diffMs < 0 || diffMs < 60000) return "just now";

    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="forum-page">
        <div className="forum-loading">Loading forum threads...</div>
      </div>
    );
  }

  return (
    <div className="forum-page">
      <div className="forum-header">
        <div className="forum-title-section">
          <h1>🎮 Community Forums</h1>
          <p>Discuss games, share tips, and connect with other gamers</p>
        </div>
        <button
          className="new-thread-btn"
          onClick={() => {
            if (!user) {
              navigate("/login");
            } else {
              setShowNewThreadForm(!showNewThreadForm);
            }
          }}
        >
          {showNewThreadForm ? "✕ Cancel" : "+ New Discussion"}
        </button>
      </div>

      {showNewThreadForm && (
        <div className="new-thread-form">
          <h2>Start a New Discussion</h2>
          <form onSubmit={handleCreateThread}>
            <input
              type="text"
              placeholder="Title"
              value={newThreadData.title}
              onChange={(e) =>
                setNewThreadData({ ...newThreadData, title: e.target.value })
              }
              required
            />
            <select
              value={newThreadData.gameId}
              onChange={(e) =>
                setNewThreadData({ ...newThreadData, gameId: e.target.value })
              }
              className="game-selector"
            >
              <option value="">💬 General Discussion (No specific game)</option>
              {trendingGames.map((game) => (
                <option key={game.id} value={game.id}>
                  🎮 {game.title}
                </option>
              ))}
            </select>
            <textarea
              placeholder="What would you like to discuss?"
              value={newThreadData.body}
              onChange={(e) =>
                setNewThreadData({ ...newThreadData, body: e.target.value })
              }
              rows="6"
              required
            />
            <button type="submit">Post Discussion</button>
          </form>
        </div>
      )}

      <div className="forum-filters">
        <button
          className={`filter-btn ${activeFilter === "all" ? "active" : ""}`}
          onClick={() => setActiveFilter("all")}
        >
          🌐 All Discussions
        </button>
        <button
          className={`filter-btn ${
            activeFilter === "trending" ? "active" : ""
          }`}
          onClick={() => setActiveFilter("trending")}
        >
          🔥 Trending
        </button>
        <button
          className={`filter-btn ${activeFilter === "recent" ? "active" : ""}`}
          onClick={() => setActiveFilter("recent")}
        >
          🆕 Recent
        </button>
        <button
          className={`filter-btn ${
            activeFilter === "my-posts" ? "active" : ""
          }`}
          onClick={() => setActiveFilter("my-posts")}
        >
          👤 My Posts
        </button>
      </div>

      <div className="threads-list">
        {threads.length === 0 ? (
          <div className="no-threads">
            <div className="empty-state-icon">💬</div>
            <h3>No discussions yet</h3>
            <p>Be the first to start a conversation!</p>
          </div>
        ) : (
          threads.map((thread) => (
            <Link
              to={thread.isDummy ? "#" : `/forum/${thread.id}`}
              key={thread.id}
              className="thread-card"
              onClick={(e) => {
                if (thread.isDummy) {
                  e.preventDefault();
                  alert(
                    "This is a preview thread. Create a real discussion to start chatting!"
                  );
                }
              }}
            >
              <div className="thread-content">
                <div className="thread-header-row">
                  <h3>{thread.title}</h3>
                  {thread.isDummy && <span className="demo-badge">Demo</span>}
                </div>
                <div className="thread-meta">
                  <span className="thread-author">
                    👤 {thread.author_username || "Unknown"}
                  </span>
                  {thread.game_title && (
                    <>
                      <span className="meta-separator">•</span>
                      <span className="thread-game">
                        🎮 {thread.game_title}
                      </span>
                    </>
                  )}
                  <span className="meta-separator">•</span>
                  <span className="thread-date">
                    🕒 {formatDate(thread.created_at)}
                  </span>
                </div>
                {thread.body && (
                  <p className="thread-excerpt">
                    {thread.body.length > 200
                      ? thread.body.substring(0, 200) + "..."
                      : thread.body}
                  </p>
                )}
              </div>
              <div className="thread-stats">
                <div className="stat-item">
                  <span className="stat-icon">💬</span>
                  <span className="stat-count">{thread.post_count || 0}</span>
                  <span className="stat-label">replies</span>
                </div>
              </div>
            </Link>
          ))
        )}
        
      </div>
    </div>
  );
}

export default ForumPage;
