import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getIGDBGameDetails, getReviews, createReview, deleteReview, likeReview, addGameToMyList } from '../database/api';

export default function GameDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [game, setGame] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ title: '', body: '', rating: 5 });
  const [selectedStatus, setSelectedStatus] = useState('');
  const [personalRating, setPersonalRating] = useState('');

  useEffect(() => {
    loadGameData();
  }, [id]);

  const loadGameData = async () => {
    setLoading(true);
    try {
      // Always fetch from IGDB for game details
      const gameData = await getIGDBGameDetails(id);
      setGame(gameData);
      
      // Try to fetch reviews (may not exist if game not in DB yet)
      try {
        const reviewsData = await getReviews(id);
        setReviews(reviewsData);
      } catch (e) {
        console.log('No reviews yet:', e);
        setReviews([]);
      }
    } catch (error) {
      console.error('Failed to load game data:', error);
      setGame(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToList = async (status) => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      // Pass full game data so backend can create game if needed
      await addGameToMyList({ 
        igdb_id: parseInt(id),
        status,
        rating: personalRating ? parseFloat(personalRating) : null, // User's personal rating (0-10)
        // Include game info for auto-creation (game_rating is IGDB rating 0-100)
        title: game.title,
        cover: game.cover,
        game_rating: game.rating, // IGDB rating for game record
        summary: game.summary,
        genres: game.genres
      });
      setSelectedStatus(status);
      alert(`Added to ${status.replace('_', ' ')} list!`);
    } catch (error) {
      console.error('Failed to add to list:', error);
      alert('Failed to add game to list');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      // First ensure game exists in database
      await addGameToMyList({ 
        igdb_id: parseInt(id),
        status: 'completed', // Default status for reviewing
        title: game.title,
        cover: game.cover,
        game_rating: game.rating, // IGDB rating
        summary: game.summary,
        genres: game.genres
      });
      
      // Now create the review
      await createReview(id, reviewForm);
      setShowReviewForm(false);
      setReviewForm({ title: '', body: '', rating: 5 });
      loadGameData();
    } catch (error) {
      console.error('Failed to create review:', error);
      alert('Failed to create review');
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
      await deleteReview(reviewId);
      loadGameData();
    } catch (error) {
      console.error('Failed to delete review:', error);
    }
  };

  const handleLikeReview = async (reviewId) => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await likeReview(reviewId, user.id);
      loadGameData();
    } catch (error) {
      console.error('Failed to like review:', error);
    }
  };

  if (loading) return <div className="container" style={{ marginTop: '2rem' }}>Loading...</div>;
  if (!game) return <div className="container" style={{ marginTop: '2rem' }}>Game not found</div>;

  return (
    <main className="page">
      <div className="container" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
          <img
            src={game.cover}
            alt={game.title}
            style={{ width: '300px', height: '400px', objectFit: 'cover', borderRadius: '12px' }}
          />
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{game.title}</h1>
            <div style={{ color: 'var(--accent)', fontSize: '1.5rem', marginBottom: '1rem' }}>
              ★ {game.rating ? Math.round(game.rating) : 'N/A'}/100
            </div>
            {game.genres && game.genres.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                {game.genres.map((genre, idx) => (
                  <span
                    key={idx}
                    style={{
                      padding: '0.25rem 0.75rem',
                      background: '#2a2a36',
                      borderRadius: '999px',
                      fontSize: '0.9rem',
                    }}
                  >
                    {typeof genre === 'string' ? genre : genre.name}
                  </span>
                ))}
              </div>
            )}
            <p style={{ color: 'var(--muted)', marginBottom: '2rem', lineHeight: 1.6 }}>
              {game.summary || 'No description available.'}
            </p>
            
            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ marginBottom: '0.5rem' }}>Add to List</h3>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', color: 'var(--muted)' }}>
                  Your Personal Rating (0-10, optional)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  value={personalRating}
                  onChange={(e) => setPersonalRating(e.target.value)}
                  placeholder="e.g. 8.5"
                  style={{
                    width: '100px',
                    padding: '0.5rem',
                    border: '1px solid #2f2f3a',
                    borderRadius: '8px',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  className={`btn ${selectedStatus === 'playing' ? 'primary' : ''}`}
                  onClick={() => handleAddToList('playing')}
                >
                  Currently Playing
                </button>
                <button
                  className={`btn ${selectedStatus === 'completed' ? 'primary' : ''}`}
                  onClick={() => handleAddToList('completed')}
                >
                  Completed
                </button>
                <button
                  className={`btn ${selectedStatus === 'plan_to_play' ? 'primary' : ''}`}
                  onClick={() => handleAddToList('plan_to_play')}
                >
                  Plan to Play
                </button>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>Reviews ({reviews.length})</h2>
            <button className="btn primary" onClick={() => setShowReviewForm(!showReviewForm)}>
              {showReviewForm ? 'Cancel' : 'Write Review'}
            </button>
          </div>

          {showReviewForm && (
            <form onSubmit={handleSubmitReview} className="panel" style={{ marginBottom: '2rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Title</label>
                <input
                  type="text"
                  value={reviewForm.title}
                  onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #2f2f3a',
                    borderRadius: '8px',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                  }}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Rating (0-10)</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={reviewForm.rating}
                  onChange={(e) => setReviewForm({ ...reviewForm, rating: parseFloat(e.target.value) })}
                  required
                  style={{
                    width: '100px',
                    padding: '0.5rem',
                    border: '1px solid #2f2f3a',
                    borderRadius: '8px',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                  }}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Review</label>
                <textarea
                  value={reviewForm.body}
                  onChange={(e) => setReviewForm({ ...reviewForm, body: e.target.value })}
                  required
                  rows={6}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #2f2f3a',
                    borderRadius: '8px',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    resize: 'vertical',
                  }}
                />
              </div>
              <button type="submit" className="btn primary">Submit Review</button>
            </form>
          )}

          <div style={{ display: 'grid', gap: '1rem' }}>
            {reviews.map((review) => (
              <div key={review.id} className="panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <img
                      src={review.avatar_url}
                      alt={review.username}
                      style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600 }}>{review.username}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                        {new Date(review.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '1.2rem', color: 'var(--accent)' }}>
                    ★ {review.rating}/10
                  </div>
                </div>
                <h3 style={{ marginBottom: '0.5rem' }}>{review.title}</h3>
                <p style={{ color: 'var(--muted)', marginBottom: '1rem', lineHeight: 1.6 }}>
                  {review.body}
                </p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="btn ghost"
                    onClick={() => handleLikeReview(review.id)}
                  >
                    👍 {review.likes_count}
                  </button>
                  {user && review.user_id === user.id && (
                    <button
                      className="btn ghost"
                      onClick={() => handleDeleteReview(review.id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

