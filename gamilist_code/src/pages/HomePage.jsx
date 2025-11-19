import { useEffect, useState } from 'react';
import Hero from '../components/Hero';
import Carousel from '../components/Carousel';
import ForumPreview from '../components/ForumPreview';
import { getTrending, getByGenre, getForumPreview } from '../database/api';

export default function HomePage() {
  const [trending, setTrending] = useState([]);
  const [adventure, setAdventure] = useState([]);
  const [threads, setThreads] = useState([]);
  const [heroIndex, setHeroIndex] = useState(0);

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
      setHeroIndex(0); // start from the first trending game
    })();
  }, []);

  // autoplay through trending games
  useEffect(() => {
    if (!trending.length) return;

    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % trending.length);
    }, 7000); // 7 seconds per hero slide

    return () => clearInterval(interval);
  }, [trending]);

  const displayGame = trending[heroIndex] || trending[0];
  const heroBg = displayGame?.hero || displayGame?.cover;
  const heroTitle = displayGame?.title;

  return (
    <main className="page">
      <div className="container">
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
              viewAllHref="/games?filter=recommended"
            />

            <Carousel
              title="Trending"
              games={adventure}
              viewAllHref="/games?filter=trending"
            />

          </div>

          <ForumPreview threads={threads} />
        </div>
      </div>
    </main>
  );
}
