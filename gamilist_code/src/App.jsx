import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import GameDetailsPage from './pages/GameDetailsPage';
import UserProfilePage from './pages/UserProfilePage';
import ForumPage from './pages/ForumPage';
import ThreadDetailsPage from './pages/ThreadDetailsPage';
import SearchPage from './pages/SearchPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import './App.css';

export default function App() {
import Hero from './components/Hero';
import Carousel from './components/Carousel';
import ForumPreview from './components/ForumPreview';
import { getTrending, getByGenre, getForumPreview } from './database/api';
import './App.css';

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
      setThreads(f.slice(0, 6));
    })();
  }, []);

  const heroBg =
    trending[0]?.hero || '/covers/silksong-hero.jpg';

  const heroTitle = trending[0]?.title || 'Hollow Knight: Silksong';

  return (
    <AuthProvider>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/games/:id" element={<GameDetailsPage />} />
        <Route path="/users/:id" element={<UserProfilePage />} />
        <Route path="/profile" element={<UserProfilePage />} />
        <Route path="/forum" element={<ForumPage />} />
        <Route path="/forum/:threadId" element={<ThreadDetailsPage />} />
      </Routes>
    </AuthProvider>

      {/* container + page together so ALL main content shares the same width */}
      <main className="container page">
        {/* hero sits at top of page grid */}
        <Hero
          title={heroTitle}
          tagline="Track, discuss, and discover your next favorite game."
          background={heroBg}
          onPrimary={() => alert('Added to your list!')}
        />

        {/* carousels + sidebar in 2-column grid, still inside same container */}
        <div className="grid">
          <div>
            <Carousel title="Recommended Based on Your List" games={trending} />
            <Carousel title="Trending" games={adventure} />
          </div>

          {/* make sure ForumPreview's root has className="sidebar" inside it */}
          <ForumPreview threads={threads} />
        </div>
      </main>
    </>
  );
}
