import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyRecommendations, addGameToMyList } from '../database/api';
import { useAuth } from '../contexts/AuthContext';
import './RecommendationsPage.css';

function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState([]);
  const [basedOn, setBasedOn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingGames, setAddingGames] = useState(new Set());
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadRecommendations();
  }, [user, navigate]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const data = await getMyRecommendations();
      setRecommendations(data.recommendations || []);
      setBasedOn(data.basedOn || null);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
      if (error.message.includes('401')) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddToList = async (game) => {
    if (addingGames.has(game.id)) return;

    try {
      setAddingGames(new Set([...addingGames, game.id]));
      await addGameToMyList({
        gameId: game.id,
        status: 'plan_to_play'
      });
      
      // Remove from recommendations after adding
      setRecommendations(recommendations.filter(g => g.id !== game.id));
    } catch (error) {
      console.error('Failed to add game:', error);
      alert('Failed to add game to your list');
    } finally {
      setAddingGames(prev => {
        const next = new Set(prev);
        next.delete(game.id);
        return next;
      });
    }
  };

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
        <h1> Personalized Recommendations</h1>
        <p>Games you might enjoy based on your gaming preferences</p>
      </div>

      {basedOn && basedOn.games && basedOn.games.length > 0 && (
        <div className="based-on-section">
          <h3> Recommended based on:</h3>
          <div className="based-on-content">
            {basedOn.genres && basedOn.genres.length > 0 && (
              <div className="based-on-item">
                <span className="label">Your favorite genres:</span>
                <div className="tags">
                  {basedOn.genres.map((genre, idx) => (
                    <span key={idx} className="tag">{genre}</span>
                  ))}
                </div>
              </div>
            )}
            {basedOn.games.length > 0 && (
              <div className="based-on-item">
                <span className="label">Games you enjoyed:</span>
                <div className="games-list">
                  {basedOn.games.slice(0, 5).map((game, idx) => (
                    <span key={idx} className="game-name">{game}</span>
                  ))}
                  {basedOn.games.length > 5 && (
                    <span className="more">+{basedOn.games.length - 5} more</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {recommendations.length === 0 ? (
        <div className="no-recommendations">
          <div className="empty-state">
            <span className="icon">🎮</span>
            <h3>No recommendations yet</h3>
            <p>Start adding games to your list and rating them to get personalized recommendations!</p>
            <button onClick={() => navigate('/')} className="browse-btn">
              Browse Games
            </button>
          </div>
        </div>
      ) : (
        <div className="recommendations-grid">
          {recommendations.map(game => (
            <div key={game.id} className="recommendation-card">
              <div 
                className="game-cover"
                style={{ 
                  backgroundImage: game.cover ? `url(${game.cover})` : 'none',
                  backgroundColor: game.cover ? 'transparent' : '#2d2d2d'
                }}
                onClick={() => navigate(`/games/${game.id}`)}
              >
                {!game.cover && (
                  <div className="no-cover">
                    <span>🎮</span>
                  </div>
                )}
                <div className="rating-badge">
                  ⭐ {game.rating ? game.rating.toFixed(0) : 'N/A'}
                </div>
              </div>
              
              <div className="game-info">
                <h3 
                  className="game-title"
                  onClick={() => navigate(`/games/${game.id}`)}
                >
                  {game.title}
                </h3>
                
                <button
                  className={`add-btn ${addingGames.has(game.id) ? 'adding' : ''}`}
                  onClick={() => handleAddToList(game)}
                  disabled={addingGames.has(game.id)}
                >
                  {addingGames.has(game.id) ? '✓ Added' : '+ Add to Plan to Play'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default RecommendationsPage;

