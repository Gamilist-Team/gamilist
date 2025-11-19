import { useRef } from 'react';
import { Link } from 'react-router-dom';
import GameCard from './GameCard';

export default function Carousel({ title, games = [], viewAllHref = '#' }) {
  const trackRef = useRef(null);
  const step = 220;

  const scrollBy = (dir) => {
    trackRef.current?.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  return (
    <section className="section">
      <div className="section-header">
        <h2>{title}</h2>
        <Link className="muted" to={viewAllHref}>
          View all →
        </Link>
      </div>

      <div className="scroller">
        <button
          className="arrow left"
          aria-label="Scroll left"
          onClick={() => scrollBy(-1)}
        >
          ‹
        </button>
        <div
          ref={trackRef}
          className="track"
          aria-label={`${title} carousel`}
        >
          {games.map((g) => (
            <GameCard key={g.id} game={g} />
          ))}
        </div>
        <button
          className="arrow right"
          aria-label="Scroll right"
          onClick={() => scrollBy(1)}
        >
          ›
        </button>
      </div>
    </section>
  );
}
