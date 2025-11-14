import { useNavigate } from 'react-router-dom';

export default function GameCard({ game }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/games/${game.id}`);
  };

  return (
    <article 
      className="card" 
      tabIndex={0} 
      aria-label={game.title}
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
    >
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
