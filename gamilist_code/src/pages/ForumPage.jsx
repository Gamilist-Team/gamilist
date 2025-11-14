import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getThreads, createThread, deleteThread, likeThread } from '../database/api';

const CURRENT_USER_ID = 1; // Simulated logged-in user

export default function ForumPage() {
  const navigate = useNavigate();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newThread, setNewThread] = useState({ title: '', body: '', game_id: null });

  useEffect(() => {
    loadThreads();
  }, []);

  const loadThreads = async () => {
    setLoading(true);
    try {
      const data = await getThreads();
      setThreads(data);
    } catch (error) {
      console.error('Failed to load threads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateThread = async (e) => {
    e.preventDefault();
    try {
      await createThread({
        user_id: CURRENT_USER_ID,
        ...newThread
      });
      setShowCreateForm(false);
      setNewThread({ title: '', body: '', game_id: null });
      loadThreads();
    } catch (error) {
      console.error('Failed to create thread:', error);
      alert('Failed to create thread');
    }
  };

  const handleDeleteThread = async (threadId) => {
    if (!confirm('Are you sure you want to delete this thread?')) return;
    try {
      await deleteThread(threadId);
      loadThreads();
    } catch (error) {
      console.error('Failed to delete thread:', error);
    }
  };

  const handleLikeThread = async (threadId) => {
    try {
      await likeThread(threadId, CURRENT_USER_ID);
      loadThreads();
    } catch (error) {
      console.error('Failed to like thread:', error);
    }
  };

  if (loading) return <div className="container" style={{ marginTop: '2rem' }}>Loading...</div>;

  return (
    <main className="page">
      <div className="container" style={{ marginTop: '2rem', maxWidth: '900px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem' }}>Community Forums</h1>
          <button className="btn primary" onClick={() => setShowCreateForm(!showCreateForm)}>
            {showCreateForm ? 'Cancel' : 'New Thread'}
          </button>
        </div>

        {showCreateForm && (
          <form onSubmit={handleCreateThread} className="panel" style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Create New Thread</h3>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Title</label>
              <input
                type="text"
                value={newThread.title}
                onChange={(e) => setNewThread({ ...newThread, title: e.target.value })}
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
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Content</label>
              <textarea
                value={newThread.body}
                onChange={(e) => setNewThread({ ...newThread, body: e.target.value })}
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
            <button type="submit" className="btn primary">Create Thread</button>
          </form>
        )}

        <div style={{ display: 'grid', gap: '1rem' }}>
          {threads.map((thread) => (
            <div key={thread.id} className="panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <img
                    src={thread.avatar_url}
                    alt={thread.username}
                    style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                  />
                  <div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                      {thread.username} • {new Date(thread.created_at).toLocaleDateString()}
                    </div>
                    {thread.game_title && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>
                        {thread.game_title}
                      </div>
                    )}
                  </div>
                </div>
                {thread.user_id === CURRENT_USER_ID && (
                  <button
                    className="btn ghost"
                    onClick={() => handleDeleteThread(thread.id)}
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
                  >
                    Delete
                  </button>
                )}
              </div>
              
              <h3
                style={{ marginBottom: '0.5rem', cursor: 'pointer', fontWeight: 700 }}
                onClick={() => navigate(`/forum/${thread.id}`)}
              >
                {thread.title}
              </h3>
              
              <p
                style={{ color: 'var(--muted)', marginBottom: '1rem', lineHeight: 1.6, cursor: 'pointer' }}
                onClick={() => navigate(`/forum/${thread.id}`)}
              >
                {thread.body?.substring(0, 200)}
                {thread.body?.length > 200 ? '...' : ''}
              </p>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  className="btn ghost"
                  onClick={() => handleLikeThread(thread.id)}
                  style={{ padding: '0.25rem 0.75rem' }}
                >
                  👍 {thread.likes_count || 0}
                </button>
                <button
                  className="btn ghost"
                  onClick={() => navigate(`/forum/${thread.id}`)}
                  style={{ padding: '0.25rem 0.75rem' }}
                >
                  💬 Reply
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

