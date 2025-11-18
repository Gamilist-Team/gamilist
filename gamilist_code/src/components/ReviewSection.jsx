import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getGameReviews, createReview, deleteReview, markReviewHelpful } from '../database/api';

export default function ReviewSection({ gameId }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userReview, setUserReview] = useState(null);

  useEffect(() => {
    loadReviews();
  }, [gameId]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const data = await getGameReviews(gameId);
      setReviews(data);
      
      // Check if user has already reviewed
      if (user) {
        const existing = data.find(r => r.user_id === user.id);
        if (existing) {
          setUserReview(existing);
          setRating(existing.rating);
          setReviewText(existing.review_text);
        }
      }
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!rating || !reviewText) {
      alert('Please provide both rating and review text');
      return;
    }

    setSubmitting(true);
    try {
      await createReview(gameId, { 
        rating: parseFloat(rating), 
        review_text: reviewText 
      });
      setShowForm(false);
      loadReviews();
      alert('Review submitted successfully! 🎉');
    } catch (error) {
      console.error('Failed to submit review:', error);
      alert(error.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete your review?')) return;

    try {
      await deleteReview(gameId);
      setUserReview(null);
      setRating('');
      setReviewText('');
      loadReviews();
      alert('Review deleted');
    } catch (error) {
      console.error('Failed to delete review:', error);
      alert('Failed to delete review');
    }
  };

  const handleHelpful = async (reviewId) => {
    try {
      await markReviewHelpful(reviewId);
      loadReviews();
    } catch (error) {
      console.error('Failed to mark helpful:', error);
    }
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <h2>Reviews ({reviews.length})</h2>
        {user && !showForm && !userReview && (
          <button 
            className="btn primary"
            onClick={() => setShowForm(true)}
          >
            Write a Review
          </button>
        )}
      </div>

      {/* Review Form */}
      {showForm && (
        <form onSubmit={handleSubmit} style={{
          background: '#1b1b25',
          padding: '1.5rem',
          borderRadius: '8px',
          marginBottom: '2rem'
        }}>
          <h3 style={{ marginBottom: '1rem' }}>Your Review</h3>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Rating (0-10)
            </label>
            <input
              type="number"
              min="0"
              max="10"
              step="0.5"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              required
              style={{
                padding: '0.5rem',
                borderRadius: '4px',
                border: '1px solid #2f2f3a',
                background: 'var(--bg)',
                color: 'var(--text)',
                width: '200px'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Review
            </label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              required
              placeholder="Share your thoughts about this game..."
              style={{
                padding: '0.5rem',
                borderRadius: '4px',
                border: '1px solid #2f2f3a',
                background: 'var(--bg)',
                color: 'var(--text)',
                width: '100%',
                minHeight: '120px',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              type="submit" 
              className="btn primary"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
            <button 
              type="button" 
              className="btn"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* User's existing review */}
      {userReview && !showForm && (
        <div style={{
          background: '#1b1b25',
          padding: '1.5rem',
          borderRadius: '8px',
          marginBottom: '2rem',
          border: '2px solid var(--primary)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <strong>Your Review</strong>
              <div style={{ color: 'var(--primary)', marginTop: '0.5rem' }}>
                ⭐ {userReview.rating}/10
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                className="btn"
                onClick={() => setShowForm(true)}
              >
                Edit
              </button>
              <button 
                className="btn"
                onClick={handleDelete}
              >
                Delete
              </button>
            </div>
          </div>
          <p style={{ color: 'var(--muted)', lineHeight: '1.6' }}>
            {userReview.review_text}
          </p>
          <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '1rem' }}>
            {userReview.helpful_count} {userReview.helpful_count === 1 ? 'person' : 'people'} found this helpful
          </div>
        </div>
      )}

      {/* All Reviews */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
          Loading reviews...
        </div>
      ) : reviews.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: 'var(--muted)' }}>No reviews yet. Be the first to review!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {reviews.filter(r => !user || r.user_id !== user.id).map((review) => (
            <div 
              key={review.id}
              style={{
                background: '#1b1b25',
                padding: '1.5rem',
                borderRadius: '8px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <img 
                    src={review.avatar_url}
                    alt={review.username}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%'
                    }}
                  />
                  <div>
                    <strong>{review.username}</strong>
                    <div style={{ color: 'var(--primary)', marginTop: '0.25rem' }}>
                      ⭐ {review.rating}/10
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                  {new Date(review.created_at).toLocaleDateString()}
                </div>
              </div>
              
              <p style={{ color: 'var(--muted)', lineHeight: '1.6', marginBottom: '1rem' }}>
                {review.review_text}
              </p>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                  {review.helpful_count} {review.helpful_count === 1 ? 'person' : 'people'} found this helpful
                </div>
                {user && user.id !== review.user_id && (
                  <button 
                    className="btn ghost"
                    onClick={() => handleHelpful(review.id)}
                    style={{ fontSize: '0.9rem', padding: '0.3rem 0.8rem' }}
                  >
                    👍 Helpful
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

