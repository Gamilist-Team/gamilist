import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import Carousel from "../components/Carousel";
import { getTrending, getByGenre } from "../database/api";

export default function GamesPage() {
  const [trending, setTrending] = useState([]);
  const [adventure, setAdventure] = useState([]);
  const [rpg, setRpg] = useState([]);
  const [shooter, setShooter] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchParams] = useSearchParams();
  const searchQuery = (searchParams.get("search") || "").trim();
  const filter = (searchParams.get("filter") || "").toLowerCase();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [t, a, r, s] = await Promise.all([
          getTrending(),
          getByGenre("Adventure"),
          getByGenre("RPG"),
          getByGenre("Shooter"),
        ]);
        if (cancelled) return;
        setTrending(t);
        setAdventure(a);
        setRpg(r);
        setShooter(s);
      } catch (e) {
        if (!cancelled) setError("Failed to load games.");
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Combine all games so search can work without a new API
  const allGames = useMemo(() => {
    const map = new Map();
    [trending, adventure, rpg, shooter].forEach((list) => {
      list.forEach((g) => {
        if (g && !map.has(g.id)) map.set(g.id, g);
      });
    });
    return Array.from(map.values());
  }, [trending, adventure, rpg, shooter]);

  let rows = [
    { key: "recommended", title: "Recommended Based on Your List", games: trending },
    { key: "trending", title: "Trending", games: trending },
    { key: "adventure", title: "Adventure", games: adventure },
    { key: "rpg", title: "RPG", games: rpg },
    { key: "shooter", title: "Shooter", games: shooter },
  ];

  // Apply filter from ?filter=...
  if (filter) {
    rows = rows.filter((row) => row.key === filter);
  }

  // Apply search from ?search=...
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    const matches = allGames.filter(
      (g) => g.title && g.title.toLowerCase().includes(q)
    );
    rows = [
      {
        key: "search",
        title: `Search results for “${searchQuery}”`,
        games: matches,
      },
    ];
  }

  return (
    <main className="page">
      <div className="container">
        <h1 style={{ fontSize: "1.6rem", margin: "16px 0 8px" }}>Browse Games</h1>

        {loading && <p>Loading games…</p>}
        {error && <p>{error}</p>}

        {!loading &&
          !error &&
          rows.map((row) =>
            row.games && row.games.length ? (
              <Carousel
                key={row.key}
                title={row.title}
                games={row.games}
                // No viewAllHref here; we're already on the full page
              />
            ) : null
          )}

        {!loading && !error && rows.every((r) => !r.games || r.games.length === 0) && (
          <p>No games found.</p>
        )}
      </div>
    </main>
  );
}
