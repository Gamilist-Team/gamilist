import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchIGDB, getTrending } from '../database/api';
import GameCard from '../components/GameCard';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Load trending games initially
    loadTrendingGames();
  }, []);

  const loadTrendingGames = async () => {
    setLoading(true);
    try {
      const data = await getTrending();
      setGames(data);
    } catch (error) {
      console.error('Failed to load trending games:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) {
      loadTrendingGames();
      return;
    }

    setLoading(true);
    try {
      const data = await searchIGDB(query);
      setGames(data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page">
      <div className="container" style={{ marginTop: '2rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Search Games</h1>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for a game..."
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                fontSize: '1rem',
                border: '1px solid #2f2f3a',
                borderRadius: '8px',
                background: 'var(--surface)',
                color: 'var(--text)',
              }}
            />
            <button type="submit" className="btn primary">
              Search
            </button>
          </form>
        </div>

        {loading ? (
          <p style={{ color: 'var(--muted)' }}>Loading...</p>
        ) : (
          <>
            <p style={{ color: 'var(--muted)', marginBottom: '1rem' }}>
              {games.length} game{games.length !== 1 ? 's' : ''} found
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '1rem',
              }}
            >
              {games.map((game) => (
                <div
                  key={game.id}
                  onClick={() => navigate(`/games/${game.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <GameCard game={game} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

