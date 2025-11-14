import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import GameDetailsPage from './pages/GameDetailsPage';
import UserProfilePage from './pages/UserProfilePage';
import './App.css';

export default function App() {
  return (
    <AuthProvider>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/games/:id" element={<GameDetailsPage />} />
        <Route path="/profile" element={<UserProfilePage />} />
      </Routes>
    </AuthProvider>
  );
}
