import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getForumThreads, createThread, getTrending } from '../database/api';
import { useAuth } from '../contexts/AuthContext';
import './ForumPage.css';

function ForumPage() {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewThreadForm, setShowNewThreadForm] = useState(false);
  const [newThreadData, setNewThreadData] = useState({
    title: '',
    body: '',
    gameId: ''
  });
  const [trendingGames, setTrendingGames] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadThreads();
    loadTrendingGames();
  }, []);

  const loadTrendingGames = async () => {
    try {
      const games = await getTrending();
      setTrendingGames(games.slice(0, 20)); // Top 20 games for selection
    } catch (error) {
      console.error('Failed to load games:', error);
    }
  };

  const loadThreads = async () => {
    try {
      setLoading(true);
      const data = await getForumThreads();
      setThreads(data);
    } catch (error) {
      console.error('Failed to load threads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateThread = async (e) => {
    e.preventDefault();
    
    if (!user) {
      navigate('/login');
      return;
    }

    if (!newThreadData.title.trim() || !newThreadData.body.trim()) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const thread = await createThread({
        title: newThreadData.title,
        body: newThreadData.body,
        gameId: newThreadData.gameId || null
      });
      setThreads([thread, ...threads]);
      setNewThreadData({ title: '', body: '', gameId: '' });
      setShowNewThreadForm(false);
      navigate(`/forum/${thread.id}`);
    } catch (error) {
      console.error('Failed to create thread:', error);
      alert('Failed to create thread');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    
    // If time is in the future or just now
    if (diffMs < 0 || diffMs < 60000) return 'just now';
    
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
              navigate('/login');
            } else {
              setShowNewThreadForm(!showNewThreadForm);
            }
          }}
        >
          {showNewThreadForm ? '✕ Cancel' : '+ New Discussion'}
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
              onChange={(e) => setNewThreadData({ ...newThreadData, title: e.target.value })}
              required
            />
            <select
              value={newThreadData.gameId}
              onChange={(e) => setNewThreadData({ ...newThreadData, gameId: e.target.value })}
              className="game-selector"
            >
              <option value="">💬 General Discussion (No specific game)</option>
              {trendingGames.map(game => (
                <option key={game.id} value={game.id}>
                  🎮 {game.title}
                </option>
              ))}
            </select>
            <textarea
              placeholder="What would you like to discuss?"
              value={newThreadData.body}
              onChange={(e) => setNewThreadData({ ...newThreadData, body: e.target.value })}
              rows="6"
              required
            />
            <button type="submit">Post Discussion</button>
          </form>
        </div>
      )}

      <div className="threads-list">
        {threads.length === 0 ? (
          <div className="no-threads">
            <p>No discussions yet. Be the first to start one!</p>
          </div>
        ) : (
          threads.map(thread => (
            <Link 
              to={`/forum/${thread.id}`} 
              key={thread.id}
              className="thread-card"
            >
              <div className="thread-content">
                <h3>{thread.title}</h3>
                <div className="thread-meta">
                  <span className="thread-author">
                    by {thread.author_username || 'Unknown'}
                  </span>
                  {thread.game_title && (
                    <>
                      <span className="meta-separator">•</span>
                      <span className="thread-game">{thread.game_title}</span>
                    </>
                  )}
                  <span className="meta-separator">•</span>
                  <span className="thread-date">{formatDate(thread.created_at)}</span>
                </div>
                {thread.body && (
                  <p className="thread-excerpt">
                    {thread.body.length > 200 ? thread.body.substring(0, 200) + '...' : thread.body}
                  </p>
                )}
              </div>
              <div className="thread-stats">
                <div className="stat-item">
                  <span className="stat-icon">💬</span>
                  <span className="stat-count">{thread.post_count || 0}</span>
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

