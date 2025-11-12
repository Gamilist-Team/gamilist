export default function GameCard({ game }) {
  return (
    <article className="card" tabIndex={0} aria-label={game.title}>
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
