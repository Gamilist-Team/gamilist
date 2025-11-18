import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getMyGames, removeGameFromMyList, updateGameInMyList } from '../database/api';
import AchievementsSection from '../components/AchievementsSection';

export default function UserProfilePage() {
  const { user, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const loadGames = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyGames(filter === 'all' ? null : filter);
      console.log('Loaded games:', data);
      setGames(data);
    } catch (error) {
      console.error('Failed to load games:', error);
      // Don't show error alert, just log it
      setGames([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;
    
    if (!user) {
      navigate('/login');
      return;
    }
    loadGames();
  }, [user, authLoading, loadGames, navigate]);

  const handleRemoveGame = async (gameId) => {
    if (!confirm('Remove this game from your list?')) return;

    try {
      await removeGameFromMyList(gameId);
      setGames(games.filter(g => g.game_id !== gameId));
    } catch (error) {
      console.error('Failed to remove game:', error);
      alert('Failed to remove game');
    }
  };

  const handleStatusChange = async (gameId, newStatus) => {
    try {
      await updateGameInMyList(gameId, { status: newStatus });
      loadGames();
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status');
    }
  };

  if (authLoading) {
    return (
      <main className="page">
        <div className="container" style={{ textAlign: 'center', padding: '4rem 0' }}>
          <div>Loading your profile...</div>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="page">
      <div className="container" style={{ marginTop: '2rem' }}>
        {/* Profile Header */}
        <div className="panel" style={{ marginBottom: '2rem' }}>
          <h1>Welcome, {user.username}!</h1>
          <p style={{ color: 'var(--muted)', marginTop: '0.5rem' }}>
            {user.email}
          </p>
          <button 
            className="btn" 
            onClick={logout}
            style={{ marginTop: '1rem' }}
          >
            Logout
          </button>
        </div>

        {/* My Games */}
        <div className="panel">
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <h2>My Game Lists</h2>
            
            {/* Filter Buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button 
                className={filter === 'all' ? 'btn primary' : 'btn'}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button 
                className={filter === 'playing' ? 'btn primary' : 'btn'}
                onClick={() => setFilter('playing')}
              >
                Playing
              </button>
              <button 
                className={filter === 'completed' ? 'btn primary' : 'btn'}
                onClick={() => setFilter('completed')}
              >
                Completed
              </button>
              <button 
                className={filter === 'plan_to_play' ? 'btn primary' : 'btn'}
                onClick={() => setFilter('plan_to_play')}
              >
                Plan to Play
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
              Loading games...
            </div>
          ) : games.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p style={{ color: 'var(--muted)', marginBottom: '1rem' }}>
                No games in your list yet.
              </p>
              <button 
                className="btn primary"
                onClick={() => navigate('/')}
              >
                Browse Games
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {games.map((game) => (
                <div 
                  key={game.game_id}
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    padding: '1rem',
                    background: '#1b1b25',
                    borderRadius: '8px',
                    alignItems: 'flex-start'
                  }}
                >
                  {/* Game Info */}
                  <div 
                    style={{ 
                      flex: 1, 
                      cursor: 'pointer',
                      display: 'flex',
                      gap: '1rem',
                      alignItems: 'center'
                    }}
                    onClick={() => navigate(`/games/${game.game_id}`)}
                  >
                    {game.cover && (
                      <img 
                        src={game.cover} 
                        alt={game.title}
                        style={{
                          width: '80px',
                          height: '106px',
                          objectFit: 'cover',
                          borderRadius: '4px'
                        }}
                      />
                    )}
                    <div>
                      <h3 style={{ marginBottom: '0.5rem' }}>{game.title || `Game #${game.game_id}`}</h3>
                      <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                        <div>Status: <strong>{game.status?.replace(/_/g, ' ') || 'Unknown'}</strong></div>
                        {game.rating && <div>Your Rating: <strong>{game.rating}/10</strong></div>}
                        {game.game_rating && <div>IGDB Rating: <strong>{parseFloat(game.game_rating).toFixed(1)}/10</strong></div>}
                        {game.notes && (
                          <div style={{ marginTop: '0.5rem' }}>
                            Notes: {game.notes}
                          </div>
                        )}
                        <div style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                          Added: {new Date(game.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <select 
                      value={game.status}
                      onChange={(e) => handleStatusChange(game.game_id, e.target.value)}
                      style={{
                        padding: '0.4rem',
                        borderRadius: '4px',
                        border: '1px solid #2f2f3a',
                        background: 'var(--bg)',
                        color: 'var(--text)',
                        fontSize: '0.9rem'
                      }}
                    >
                      <option value="playing">Playing</option>
                      <option value="completed">Completed</option>
                      <option value="plan_to_play">Plan to Play</option>
                    </select>

                    <button 
                      className="btn"
                      onClick={() => navigate(`/games/${game.game_id}`)}
                      style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}
                    >
                      Rate & Review
                    </button>

                    <button 
                      className="btn"
                      onClick={() => handleRemoveGame(game.game_id)}
                      style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Achievements Section */}
        <div className="panel" style={{ marginTop: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>🏆 Achievements & Trophies</h2>
          <AchievementsSection userId={user.id} />
        </div>
      </div>
    </main>
  );
}

