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

  const heroBg =
    trending[0]?.hero || '/covers/silksong-hero.jpg';

  const heroTitle = trending[0]?.title || 'Hollow Knight: Silksong';

  return (
    <main className="container page">
      <Hero
        title={heroTitle}
        tagline="Track, discuss, and discover your next favorite game."
        background={heroBg}
        onPrimary={() => alert('Added to your list!')}
      />

      <div className="grid">
        <div>
          <Carousel title="Recommended Based on Your List" games={trending} />
          <Carousel title="Trending" games={adventure} />
        </div>

        <ForumPreview threads={threads} />
      </div>
    </main>
  );
}

