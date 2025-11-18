import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  getThread, 
  getThreadPosts, 
  createPost, 
  updateThread, 
  deleteThread,
  updatePost,
  deletePost 
} from '../database/api';
import { useAuth } from '../contexts/AuthContext';
import './ThreadDetailsPage.css';

function ThreadDetailsPage() {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [thread, setThread] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [editingThread, setEditingThread] = useState(false);
  const [editThreadData, setEditThreadData] = useState({ title: '', body: '' });
  const [editingPost, setEditingPost] = useState(null);
  const [editPostContent, setEditPostContent] = useState('');

  useEffect(() => {
    loadThreadData();
  }, [threadId]);

  const loadThreadData = async () => {
    try {
      setLoading(true);
      const [threadData, postsData] = await Promise.all([
        getThread(threadId),
        getThreadPosts(threadId)
      ]);
      setThread(threadData);
      setPosts(postsData);
      setEditThreadData({ title: threadData.title, body: threadData.body });
    } catch (error) {
      console.error('Failed to load thread:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostReply = async (e) => {
    e.preventDefault();
    
    if (!user) {
      navigate('/login');
      return;
    }

    if (!replyContent.trim()) {
      return;
    }

    try {
      const newPost = await createPost(threadId, { content: replyContent });
      setPosts([...posts, { ...newPost, author_username: user.username }]);
      setReplyContent('');
    } catch (error) {
      console.error('Failed to post reply:', error);
      alert('Failed to post reply');
    }
  };

  const handleUpdateThread = async (e) => {
    e.preventDefault();
    
    try {
      const updated = await updateThread(threadId, editThreadData);
      setThread(updated);
      setEditingThread(false);
    } catch (error) {
      console.error('Failed to update thread:', error);
      alert('Failed to update thread');
    }
  };

  const handleDeleteThread = async () => {
    if (!window.confirm('Are you sure you want to delete this discussion?')) {
      return;
    }

    try {
      await deleteThread(threadId);
      navigate('/forum');
    } catch (error) {
      console.error('Failed to delete thread:', error);
      alert('Failed to delete thread');
    }
  };

  const handleUpdatePost = async (postId) => {
    try {
      const updated = await updatePost(postId, { content: editPostContent });
      setPosts(posts.map(p => p.id === postId ? updated : p));
      setEditingPost(null);
      setEditPostContent('');
    } catch (error) {
      console.error('Failed to update post:', error);
      alert('Failed to update post');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this reply?')) {
      return;
    }

    try {
      await deletePost(postId);
      setPosts(posts.filter(p => p.id !== postId));
    } catch (error) {
      console.error('Failed to delete post:', error);
      alert('Failed to delete post');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    
    // If time is in the future or just now
    if (diffMs < 0 || diffMs < 60000) return 'just now';
    
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="thread-details-page">
        <div className="thread-loading">Loading discussion...</div>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="thread-details-page">
        <div className="thread-error">Discussion not found</div>
        <Link to="/forum" className="back-link">← Back to Forum</Link>
      </div>
    );
  }

  const isThreadAuthor = user && thread.user_id === user.id;

  return (
    <div className="thread-details-page">
      <Link to="/forum" className="back-link">← Back to Forum</Link>

      <div className="thread-main">
        {editingThread ? (
          <div className="edit-thread-form">
            <h2>Edit Discussion</h2>
            <form onSubmit={handleUpdateThread}>
              <input
                type="text"
                value={editThreadData.title}
                onChange={(e) => setEditThreadData({ ...editThreadData, title: e.target.value })}
                required
              />
              <textarea
                value={editThreadData.body}
                onChange={(e) => setEditThreadData({ ...editThreadData, body: e.target.value })}
                rows="6"
                required
              />
              <div className="form-actions">
                <button type="submit">Save Changes</button>
                <button type="button" onClick={() => setEditingThread(false)}>Cancel</button>
              </div>
            </form>
          </div>
        ) : (
          <>
            <div className="thread-header-section">
              <h1>{thread.title}</h1>
              <div className="thread-meta">
                <span className="thread-author">by {thread.author_username || 'Unknown'}</span>
                <span className="meta-separator">•</span>
                <span className="thread-date">{formatRelativeTime(thread.created_at)}</span>
                {thread.game_title && (
                  <>
                    <span className="meta-separator">•</span>
                    <span className="thread-game">🎮 {thread.game_title}</span>
                  </>
                )}
              </div>
              {isThreadAuthor && (
                <div className="thread-actions">
                  <button onClick={() => setEditingThread(true)} className="edit-btn">Edit</button>
                  <button onClick={handleDeleteThread} className="delete-btn">Delete</button>
                </div>
              )}
            </div>

            <div className="thread-body">
              <p>{thread.body}</p>
            </div>
          </>
        )}
      </div>

      <div className="posts-section">
        <h2>💬 Replies ({posts.length})</h2>

        {posts.map(post => {
          const isPostAuthor = user && post.user_id === user.id;
          const isEditing = editingPost === post.id;

          return (
            <div key={post.id} className="post-card">
              <div className="post-header">
                <span className="post-author">{post.author_username || 'Unknown'}</span>
                <span className="post-date">{formatRelativeTime(post.created_at)}</span>
                {isPostAuthor && !isEditing && (
                  <div className="post-actions">
                    <button 
                      onClick={() => {
                        setEditingPost(post.id);
                        setEditPostContent(post.content);
                      }}
                      className="edit-btn-small"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeletePost(post.id)}
                      className="delete-btn-small"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {isEditing ? (
                <div className="edit-post-form">
                  <textarea
                    value={editPostContent}
                    onChange={(e) => setEditPostContent(e.target.value)}
                    rows="4"
                  />
                  <div className="form-actions">
                    <button onClick={() => handleUpdatePost(post.id)}>Save</button>
                    <button onClick={() => {
                      setEditingPost(null);
                      setEditPostContent('');
                    }}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="post-content">
                  <p>{post.content}</p>
                </div>
              )}
            </div>
          );
        })}

        {posts.length === 0 && (
          <div className="no-posts">
            <p>No replies yet. Be the first to reply!</p>
          </div>
        )}
      </div>

      <div className="reply-section">
        <h3>Add a Reply</h3>
        {user ? (
          <form onSubmit={handlePostReply}>
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Share your thoughts..."
              rows="4"
              required
            />
            <button type="submit">Post Reply</button>
          </form>
        ) : (
          <div className="login-prompt">
            <p>Please <Link to="/login">log in</Link> to reply to this discussion.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ThreadDetailsPage;

