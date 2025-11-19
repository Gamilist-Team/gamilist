import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getGameDetails, addGameToMyList } from '../database/api';
import ReviewSection from '../components/ReviewSection';

export default function GameDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState(null);

  useEffect(() => {
    loadGameData();
  }, [id]);

  const loadGameData = async () => {
    setLoading(true);
    try {
      const data = await getGameDetails(id);
      setGame(data);
    } catch (error) {
      console.error('Failed to load game:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToList = async (status) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      await addGameToMyList({
        game_id: parseInt(id),
        status
      });
      setSelectedStatus(status);
      alert(`✓ Added to ${status.replace(/_/g, ' ')} list!`);
    } catch (error) {
      console.error('Failed to add to list:', error);
      alert('Failed to add game to list.');
    }
  };

  if (loading) {
    return (
      <main className="page">
        <div className="container" style={{ textAlign: 'center', padding: '4rem 0' }}>
          <div>Loading game details...</div>
        </div>
      </main>
    );
  }

  if (!game) {
    return (
      <main className="page">
        <div className="container">
          <div className="panel" style={{ textAlign: 'center', padding: '2rem' }}>
            <h2>Game not found</h2>
            <p style={{ color: 'var(--muted)' }}>The game you're looking for doesn't exist.</p>
            <button className="btn primary" onClick={() => navigate('/')}>
              Go Home
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="container" style={{ marginTop: '2rem' }}>
        <div className="panel" style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          {/* Game Cover */}
          {game.cover && (
            <img 
              src={game.cover} 
              alt={game.title}
              style={{
                width: '264px',
                height: '352px',
                objectFit: 'cover',
                borderRadius: '8px'
              }}
            />
          )}

          {/* Game Info */}
          <div style={{ flex: 1 }}>
            <h1 style={{ marginBottom: '1rem' }}>{game.title}</h1>
            
            {game.rating && (
              <div style={{ marginBottom: '1rem' }}>
                <span style={{ 
                  fontSize: '2rem', 
                  fontWeight: 'bold', 
                  color: 'var(--primary)' 
                }}>
                  {game.rating.toFixed(1)}
                </span>
                <span style={{ color: 'var(--muted)', marginLeft: '0.5rem' }}>/ 10</span>
              </div>
            )}

            {game.summary && (
              <p style={{ 
                color: 'var(--muted)', 
                lineHeight: '1.6',
                marginBottom: '2rem' 
              }}>
                {game.summary}
              </p>
            )}

            {/* Add to List Section */}
            {user && (
              <div style={{ marginTop: '2rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>Add to Your List</h3>
                
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <button 
                    className="btn primary" 
                    onClick={() => handleAddToList('playing')}
                    disabled={selectedStatus === 'playing'}
                  >
                    {selectedStatus === 'playing' ? '✓ Playing' : 'Playing'}
                  </button>
                  <button 
                    className="btn" 
                    onClick={() => handleAddToList('completed')}
                    disabled={selectedStatus === 'completed'}
                  >
                    {selectedStatus === 'completed' ? '✓ Completed' : 'Completed'}
                  </button>
                  <button 
                    className="btn" 
                    onClick={() => handleAddToList('plan_to_play')}
                    disabled={selectedStatus === 'plan_to_play'}
                  >
                    {selectedStatus === 'plan_to_play' ? '✓ Plan to Play' : 'Plan to Play'}
                  </button>
                </div>
              </div>
            )}

            {!user && (
              <div style={{ 
                marginTop: '2rem', 
                padding: '1rem', 
                background: '#1b1b25', 
                borderRadius: '8px' 
              }}>
                <p style={{ color: 'var(--muted)', marginBottom: '1rem' }}>
                  Want to track this game?
                </p>
                <button 
                  className="btn primary" 
                  onClick={() => navigate('/login')}
                >
                  Login to Add to List
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="panel" style={{ marginTop: '2rem' }}>
          <ReviewSection gameId={id} />
        </div>
      </div>
    </main>
  );
}

