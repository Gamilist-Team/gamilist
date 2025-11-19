import { useEffect, useState } from "react";
import Hero from "../components/Hero";
import Carousel from "../components/Carousel";
import ForumPreview from "../components/ForumPreview";
import { GameGridSkeleton } from "../components/LoadingStates";
import { getTrending, getByGenre, getForumPreview } from "../database/api";

export default function HomePage() {
  const [trending, setTrending] = useState([]);
  const [adventure, setAdventure] = useState([]);
  const [threads, setThreads] = useState([]);
  const [hoveredGame, setHoveredGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [t, a, f] = await Promise.all([
        getTrending(),
        getByGenre("Adventure"),
        getForumPreview(),
      ]);

      setTrending(t);
      setAdventure(a);
      setThreads(f.slice(0, 6));
    } catch (err) {
      console.error("Failed to load homepage data:", err);
      setError("Failed to load content. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Use hovered game if available, otherwise default to first trending game
  const displayGame = hoveredGame || trending[0];
  const heroBg =
    displayGame?.hero || displayGame?.cover || "/covers/silksong-hero.jpg";
  const heroTitle = displayGame?.title || "Hollow Knight: Silksong";

  return (
    <main className="container page">
      <Hero
        game={displayGame}
        title={heroTitle}
        tagline="Track, discuss, and discover your next favorite game."
        background={heroBg}
      />

      {error && (
        <div
          style={{
            padding: "2rem",
            background: "rgba(239, 68, 68, 0.1)",
            borderRadius: "8px",
            color: "#ef4444",
            textAlign: "center",
            marginBottom: "2rem",
          }}
        >
          <p>{error}</p>
          <button
            className="btn primary"
            onClick={loadData}
            style={{ marginTop: "1rem" }}
          >
            Try Again
          </button>
        </div>
      )}

      <div className="grid">
        <div>
          {loading ? (
            <>
              <div style={{ marginBottom: "2rem" }}>
                <h2 style={{ marginBottom: "1rem" }}>
                  Recommended Based on Your List
                </h2>
                <GameGridSkeleton count={6} />
              </div>
              <div>
                <h2 style={{ marginBottom: "1rem" }}>Trending</h2>
                <GameGridSkeleton count={6} />
              </div>
            </>
          ) : (
            <>
              <Carousel
                title="Recommended Based on Your List"
                games={trending}
                onGameHover={setHoveredGame}
              />
              <Carousel
                title="Trending"
                games={adventure}
                onGameHover={setHoveredGame}
              />
            </>
          )}
        </div>

        {loading ? (
          <div
            style={{
              padding: "2rem",
              background: "var(--panel)",
              borderRadius: "8px",
              textAlign: "center",
              color: "var(--muted)",
            }}
          >
            Loading forum...
          </div>
        ) : (
          <ForumPreview threads={threads} />
        )}
      </div>
    </main>
  );
}
