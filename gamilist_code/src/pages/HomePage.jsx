import { useEffect, useState } from 'react';
import Hero from '../components/Hero';
import Carousel from '../components/Carousel';
import ForumPreview from '../components/ForumPreview';
import { getTrending, getByGenre, getForumPreview } from '../database/api';

export default function HomePage() {
  const [trending, setTrending] = useState([]);
  const [adventure, setAdventure] = useState([]);
  const [threads, setThreads] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [t, a, f] = await Promise.all([
          getTrending(),
          getByGenre('Adventure'),
          getForumPreview()
        ]);
        setTrending(t);
        setAdventure(a);
        setThreads(f.slice(0, 6));
      } catch (error) {
        console.error('Failed to load homepage data:', error);
      }
    })();
  }, []);

  const heroBg =
    trending[0]?.hero ||
    '/covers/silksong-hero.jpg';

  const heroTitle = trending[0]?.title || 'Hollow Knight: Silksong';
  const heroGameId = trending[0]?.id;

  return (
    <main className="page">
      <div className="container">
        <Hero
          title={heroTitle}
          tagline="Track, discuss, and discover your next favorite game."
          background={heroBg}
          gameId={heroGameId}
          onPrimary={() => alert('Added to your list!')}
        />
      </div>

      <div className="container grid">
        <div>
          <Carousel title="Recommended Based on Your List" games={trending} />
          <Carousel title="Trending" games={adventure} />
        </div>
        <ForumPreview threads={threads} />
      </div>
    </main>
  );
}

