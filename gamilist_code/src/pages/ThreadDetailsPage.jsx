import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getThread,
  createReply,
  updateReply,
  deleteReply,
  updateThread,
  deleteThread,
  likeThread
} from '../database/api';

const CURRENT_USER_ID = 1; // Simulated logged-in user

export default function ThreadDetailsPage() {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyBody, setReplyBody] = useState('');
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editingReplyBody, setEditingReplyBody] = useState('');
  const [editingThread, setEditingThread] = useState(false);
  const [editThreadForm, setEditThreadForm] = useState({ title: '', body: '' });

  useEffect(() => {
    loadThread();
  }, [threadId]);

  const loadThread = async () => {
    setLoading(true);
    try {
      const data = await getThread(threadId);
      setThread(data);
      setEditThreadForm({ title: data.title, body: data.body });
    } catch (error) {
      console.error('Failed to load thread:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReply = async (e) => {
    e.preventDefault();
    if (!replyBody.trim()) return;
    try {
      await createReply(threadId, {
        user_id: CURRENT_USER_ID,
        body: replyBody
      });
      setReplyBody('');
      loadThread();
    } catch (error) {
      console.error('Failed to create reply:', error);
      alert('Failed to create reply');
    }
  };

  const handleUpdateReply = async (replyId) => {
    try {
      await updateReply(replyId, editingReplyBody);
      setEditingReplyId(null);
      setEditingReplyBody('');
      loadThread();
    } catch (error) {
      console.error('Failed to update reply:', error);
      alert('Failed to update reply');
    }
  };

  const handleDeleteReply = async (replyId) => {
    if (!confirm('Are you sure you want to delete this reply?')) return;
    try {
      await deleteReply(replyId);
      loadThread();
    } catch (error) {
      console.error('Failed to delete reply:', error);
    }
  };

  const handleUpdateThread = async (e) => {
    e.preventDefault();
    try {
      await updateThread(threadId, editThreadForm);
      setEditingThread(false);
      loadThread();
    } catch (error) {
      console.error('Failed to update thread:', error);
      alert('Failed to update thread');
    }
  };

  const handleDeleteThread = async () => {
    if (!confirm('Are you sure you want to delete this thread?')) return;
    try {
      await deleteThread(threadId);
      navigate('/forum');
    } catch (error) {
      console.error('Failed to delete thread:', error);
    }
  };

  const handleLikeThread = async () => {
    try {
      await likeThread(threadId, CURRENT_USER_ID);
      loadThread();
    } catch (error) {
      console.error('Failed to like thread:', error);
    }
  };

  if (loading) return <div className="container" style={{ marginTop: '2rem' }}>Loading...</div>;
  if (!thread) return <div className="container" style={{ marginTop: '2rem' }}>Thread not found</div>;

  return (
    <main className="page">
      <div className="container" style={{ marginTop: '2rem', maxWidth: '900px' }}>
        <button className="btn ghost" onClick={() => navigate('/forum')} style={{ marginBottom: '1rem' }}>
          ← Back to Forum
        </button>

        <div className="panel" style={{ marginBottom: '2rem' }}>
          {editingThread ? (
            <form onSubmit={handleUpdateThread}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Title</label>
                <input
                  type="text"
                  value={editThreadForm.title}
                  onChange={(e) => setEditThreadForm({ ...editThreadForm, title: e.target.value })}
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
                  value={editThreadForm.body}
                  onChange={(e) => setEditThreadForm({ ...editThreadForm, body: e.target.value })}
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
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" className="btn primary">Save</button>
                <button type="button" className="btn ghost" onClick={() => setEditingThread(false)}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <img
                    src={thread.avatar_url}
                    alt={thread.username}
                    style={{ width: '40px', height: '40px', borderRadius: '50%' }}
                  />
                  <div>
                    <div style={{ fontWeight: 600 }}>{thread.username}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                      {new Date(thread.created_at).toLocaleDateString()}
                    </div>
                    {thread.game_title && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--primary)' }}>
                        {thread.game_title}
                      </div>
                    )}
                  </div>
                </div>
                {thread.user_id === CURRENT_USER_ID && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn ghost" onClick={() => setEditingThread(true)}>
                      Edit
                    </button>
                    <button className="btn ghost" onClick={handleDeleteThread}>
                      Delete
                    </button>
                  </div>
                )}
              </div>

              <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{thread.title}</h1>
              <p style={{ color: 'var(--muted)', lineHeight: 1.6, marginBottom: '1rem' }}>
                {thread.body}
              </p>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn ghost" onClick={handleLikeThread}>
                  👍 {thread.likes_count || 0}
                </button>
              </div>
            </>
          )}
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>
            Replies ({thread.replies?.length || 0})
          </h2>

          <form onSubmit={handleCreateReply} className="panel" style={{ marginBottom: '1rem' }}>
            <textarea
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder="Write a reply..."
              required
              rows={4}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #2f2f3a',
                borderRadius: '8px',
                background: 'var(--bg)',
                color: 'var(--text)',
                resize: 'vertical',
                marginBottom: '0.5rem',
              }}
            />
            <button type="submit" className="btn primary">Post Reply</button>
          </form>

          <div style={{ display: 'grid', gap: '1rem' }}>
            {thread.replies?.map((reply) => (
              <div key={reply.id} className="panel">
                {editingReplyId === reply.id ? (
                  <div>
                    <textarea
                      value={editingReplyBody}
                      onChange={(e) => setEditingReplyBody(e.target.value)}
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #2f2f3a',
                        borderRadius: '8px',
                        background: 'var(--bg)',
                        color: 'var(--text)',
                        resize: 'vertical',
                        marginBottom: '0.5rem',
                      }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn primary" onClick={() => handleUpdateReply(reply.id)}>
                        Save
                      </button>
                      <button
                        className="btn ghost"
                        onClick={() => {
                          setEditingReplyId(null);
                          setEditingReplyBody('');
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <img
                          src={reply.avatar_url}
                          alt={reply.username}
                          style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                        />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{reply.username}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                            {new Date(reply.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      {reply.user_id === CURRENT_USER_ID && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn ghost"
                            onClick={() => {
                              setEditingReplyId(reply.id);
                              setEditingReplyBody(reply.body);
                            }}
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
                          >
                            Edit
                          </button>
                          <button
                            className="btn ghost"
                            onClick={() => handleDeleteReply(reply.id)}
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                    <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>{reply.body}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

