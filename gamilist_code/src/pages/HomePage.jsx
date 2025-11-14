import { useEffect, useState } from 'react';
import Hero from '../components/Hero';
import Carousel from '../components/Carousel';
import ForumPreview from '../components/ForumPreview';
import { getTrending, getByGenre, getForumPreview } from '../database/api';

export default function HomePage() {
  const [trending, setTrending] = useState([]);
  const [adventure, setAdventure] = useState([]);
  const [threads, setThreads] = useState([]);
  const [hoveredGame, setHoveredGame] = useState(null);

  useEffect(() => {
    (async () => {
      const [t, a, f] = await Promise.all([
        getTrending(),
        getByGenre('Adventure'),
        getForumPreview()
      ]);
      setTrending(t);
      setAdventure(a);
      setThreads(f.slice(0, 6));
    })();
  }, []);

  // Use hovered game if available, otherwise default to first trending game
  const displayGame = hoveredGame || trending[0];
  const heroBg = displayGame?.hero || displayGame?.cover || '/covers/silksong-hero.jpg';
  const heroTitle = displayGame?.title || 'Hollow Knight: Silksong';

  return (
    <main className="container page">
      <Hero
        game={displayGame}
        title={heroTitle}
        tagline="Track, discuss, and discover your next favorite game."
        background={heroBg}
      />

      <div className="grid">
        <div>
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
        </div>

        <ForumPreview threads={threads} />
      </div>
    </main>
  );
}
