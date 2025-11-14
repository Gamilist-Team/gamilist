import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUser, getUserStats, getUserGames, getMyGames, removeGameFromMyList } from '../database/api';

export default function UserProfilePage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [games, setGames] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);

  // Check if viewing own profile
  const isOwnProfile = location.pathname === '/profile' || (id && currentUser && parseInt(id) === currentUser.id);
  const userId = isOwnProfile ? currentUser?.id : id;

  useEffect(() => {
    if (isOwnProfile && !currentUser) {
      navigate('/login');
      return;
    }
    loadUserData();
  }, [userId, activeTab, currentUser]);

  const loadUserData = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const statsData = await getUserStats(userId);
      setStats(statsData);
      
      if (isOwnProfile) {
        // Load own games
        const gamesData = await getMyGames(activeTab === 'all' ? null : activeTab);
        setGames(gamesData);
        setProfileUser(currentUser);
      } else {
        // Load other user's data
        const [userData, gamesData] = await Promise.all([
          getUser(userId),
          getUserGames(userId, activeTab === 'all' ? null : activeTab)
        ]);
        setProfileUser(userData);
        setGames(gamesData);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveGame = async (gameId) => {
    if (!confirm('Remove this game from your list?')) return;
    try {
      await removeGameFromMyList(gameId);
      loadUserData();
    } catch (error) {
      console.error('Failed to remove game:', error);
    }
  };

  if (loading) return <div className="container" style={{ marginTop: '2rem' }}>Loading...</div>;
  if (!profileUser) return <div className="container" style={{ marginTop: '2rem' }}>User not found</div>;

  return (
    <main className="page">
      <div className="container" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
          <img
            src={profileUser.avatar_url}
            alt={profileUser.username}
            style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover' }}
          />
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
              {profileUser.username}
              {isOwnProfile && <span style={{ fontSize: '1rem', color: 'var(--muted)', marginLeft: '1rem' }}>(You)</span>}
            </h1>
            <p style={{ color: 'var(--muted)', marginBottom: '1rem' }}>{profileUser.bio || 'No bio yet'}</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
              Member since {new Date(profileUser.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div className="panel" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                {stats.completed_count || 0}
              </div>
              <div style={{ color: 'var(--muted)' }}>Games Completed</div>
            </div>
            <div className="panel" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent)' }}>
                {stats.playing_count || 0}
              </div>
              <div style={{ color: 'var(--muted)' }}>Currently Playing</div>
            </div>
            <div className="panel" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text)' }}>
                {stats.plan_to_play_count || 0}
              </div>
              <div style={{ color: 'var(--muted)' }}>Plan to Play</div>
            </div>
            <div className="panel" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ffd700' }}>
                {stats.avg_rating ? parseFloat(stats.avg_rating).toFixed(1) : 'N/A'}
              </div>
              <div style={{ color: 'var(--muted)' }}>Average Rating</div>
            </div>
          </div>
        )}

        <div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid #2f2f3a', paddingBottom: '0.5rem' }}>
            <button
              className={`btn ${activeTab === 'all' ? 'primary' : 'ghost'}`}
              onClick={() => setActiveTab('all')}
            >
              All Games
            </button>
            <button
              className={`btn ${activeTab === 'playing' ? 'primary' : 'ghost'}`}
              onClick={() => setActiveTab('playing')}
            >
              Playing
            </button>
            <button
              className={`btn ${activeTab === 'completed' ? 'primary' : 'ghost'}`}
              onClick={() => setActiveTab('completed')}
            >
              Completed
            </button>
            <button
              className={`btn ${activeTab === 'plan_to_play' ? 'primary' : 'ghost'}`}
              onClick={() => setActiveTab('plan_to_play')}
            >
              Plan to Play
            </button>
          </div>

          {games.length === 0 ? (
            <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '2rem' }}>
              No games in this list yet
            </p>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {games.map((item) => (
                <div
                  key={item.id}
                  className="panel"
                  style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}
                >
                  <img
                    src={item.cover}
                    alt={item.title}
                    style={{ width: '80px', height: '106px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer' }}
                    onClick={() => navigate(`/games/${item.igdb_id}`)}
                  />
                  <div style={{ flex: 1 }}>
                    <h3
                      style={{ marginBottom: '0.25rem', cursor: 'pointer' }}
                      onClick={() => navigate(`/games/${item.igdb_id}`)}
                    >
                      {item.title}
                    </h3>
                    <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                      Status:{' '}
                      <span style={{ color: 'var(--primary)' }}>
                        {item.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                    {item.rating && (
                      <div style={{ fontSize: '0.9rem' }}>
                        Your Rating: <span style={{ color: 'var(--accent)' }}>★ {item.rating}/10</span>
                      </div>
                    )}
                    {item.notes && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.5rem' }}>
                        {item.notes}
                      </p>
                    )}
                  </div>
                  {isOwnProfile && (
                    <button
                      className="btn ghost"
                      onClick={() => handleRemoveGame(item.game_id)}
                      style={{ padding: '0.5rem 1rem' }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

