import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { addGameToMyList } from '../database/api';

export default function GameCard({ game, onHover }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const handleCardClick = () => {
    navigate(`/games/${game.id}`);
  };

  const handleMouseEnter = (e) => {
    const btn = e.currentTarget.querySelector('.quick-add-btn');
    if (btn) btn.style.opacity = '1';
    
    // Notify parent about hover
    if (onHover) onHover(game);
  };

  const handleMouseLeave = (e) => {
    const btn = e.currentTarget.querySelector('.quick-add-btn');
    if (btn && !isAdded) btn.style.opacity = '0';
    
    // Clear hover
    if (onHover) onHover(null);
  };

  const handleQuickAdd = async (e) => {
    e.stopPropagation(); // Prevent card click
    
    if (!user) {
      navigate('/login');
      return;
    }

    if (isAdded || isAdding) return;

    setIsAdding(true);
    try {
      await addGameToMyList({
        game_id: parseInt(game.id),
        status: 'plan_to_play'
      });
      setIsAdded(true);
      
      // Show feedback
      setTimeout(() => {
        // Keep the checkmark visible
      }, 1000);
    } catch (error) {
      console.error('Failed to add game:', error);
      setIsAdding(false);
    }
  };

  return (
    <article 
      className="card game-card-wrapper" 
      tabIndex={0} 
      aria-label={game.title}
      onClick={handleCardClick}
      style={{ cursor: 'pointer', position: 'relative' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Quick Add Button */}
      <button
        onClick={handleQuickAdd}
        disabled={isAdding || isAdded}
        className="quick-add-btn"
        title={isAdded ? 'Added to Plan to Play' : 'Quick add to Plan to Play'}
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          border: 'none',
          background: isAdded ? '#22c55e' : 'rgba(139, 92, 246, 0.9)',
          color: 'white',
          fontSize: '18px',
          fontWeight: 'bold',
          cursor: isAdded ? 'default' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isAdded ? '1' : '0',
          transition: 'opacity 0.2s, transform 0.2s, background 0.2s',
          zIndex: 10,
          backdropFilter: 'blur(4px)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
        }}
        onMouseEnter={(e) => {
          if (!isAdded && !isAdding) {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.background = 'var(--primary)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          if (!isAdded) {
            e.currentTarget.style.background = 'rgba(139, 92, 246, 0.9)';
          }
        }}
      >
        {isAdding ? '⋯' : isAdded ? '✓' : '+'}
      </button>

      <div className="thumb">
        <img src={game.cover} alt={game.title} />
      </div>
      <div className="meta">
        <div className="title">{game.title}</div>
        <div className="sub">★ {game.rating}</div>
      </div>
    </article>
  );
}
