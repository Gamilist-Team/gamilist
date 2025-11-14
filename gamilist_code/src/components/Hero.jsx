import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { addGameToMyList } from '../database/api';

export default function Hero({ game, title, tagline, background }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isTracking, setIsTracking] = useState(false);
  const [tracked, setTracked] = useState(false);

  const handleTrackGame = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!game?.id || isTracking || tracked) return;

    setIsTracking(true);
    try {
      await addGameToMyList({
        game_id: parseInt(game.id),
        status: 'plan_to_play'
      });
      setTracked(true);
      
      // Reset after 2 seconds
      setTimeout(() => {
        setTracked(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to track game:', error);
    } finally {
      setIsTracking(false);
    }
  };

  const handleDetails = () => {
    if (game?.id) {
      navigate(`/games/${game.id}`);
    }
  };

  return (
    <section className="hero" aria-label="Featured game">
      {background && <img className="hero-bg" src={background} alt="" aria-hidden="true" />}
      <div className="hero-grad" />
      <div className="container hero-content">
        <p className="eyebrow">Popular</p>
        <h1>{title}</h1>
        {tagline && <p className="muted">{tagline}</p>}
        <div className="actions">
          <button 
            className="btn primary" 
            onClick={handleTrackGame}
            disabled={isTracking || tracked}
          >
            {isTracking ? 'Tracking...' : tracked ? '✓ Tracked!' : 'Track Game'}
          </button>
          <button 
            className="btn ghost" 
            onClick={handleDetails}
            disabled={!game?.id}
          >
            Details
          </button>
        </div>
      </div>
    </section>
  );
}
