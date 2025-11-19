import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Header from "./components/Header";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import GameDetailsPage from "./pages/GameDetailsPage";
import UserProfilePage from "./pages/UserProfilePage";
import ForumPage from "./pages/ForumPage";
import ThreadDetailsPage from "./pages/ThreadDetailsPage";
import RecommendationsPage from "./pages/RecommendationsPage";
import "./App.css";

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/games/:id" element={<GameDetailsPage />} />
          <Route path="/profile" element={<UserProfilePage />} />
          <Route path="/forum" element={<ForumPage />} />
          <Route path="/forum/:threadId" element={<ThreadDetailsPage />} />
          <Route path="/recommendations" element={<RecommendationsPage />} />
        </Routes>
      </AuthProvider>
    </ErrorBoundary>
  );
}
