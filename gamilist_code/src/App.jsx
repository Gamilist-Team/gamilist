import { useEffect, useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Carousel from './components/Carousel';
import ForumPreview from './components/ForumPreview';
import { getTrending, getByGenre, getForumPreview } from './database/api';

export default function App() {
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
      setThreads(f);
    })();
  }, []);

  return (
    <>
      <Header />
      <div className="container">
        <Hero
          title="Hollow Knight: Silksong"
          tagline="Track, discuss, and discover your next favorite game."
          background="/covers/silksong-hero.jpg"
          onPrimary={() => alert('Added to your list!')}
        />
      </div>

      <div className="container grid">
        <div>
          <Carousel title="Trending" games={trending} />
          <Carousel title="Adventure" games={adventure} />
        </div>
        <ForumPreview threads={threads} />
      </div>
    </>
  );
}
