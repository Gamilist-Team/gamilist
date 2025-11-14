const API = import.meta.env.VITE_API_URL || 'http://localhost:10000';

async function request(url, options = {}) {
  const r = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
    ...options,
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`${r.status} ${url} – ${text.slice(0, 120)}`);
  }
  return r.json();
}

// ========== IGDB API ==========
export const getTrending = () => request(`${API}/api/igdb/trending`);
export const getByGenre = (name) => request(`${API}/api/igdb/genre/${encodeURIComponent(name)}`);
export const searchIGDB = (query) => request(`${API}/api/igdb/search?q=${encodeURIComponent(query || '')}`);
export const getIGDBGameDetails = (id) => request(`${API}/api/igdb/games/${id}`);

// ========== GAMES API ==========
export const searchGames = (query) => request(`${API}/api/games?search=${encodeURIComponent(query)}`);
export const getGames = () => request(`${API}/api/games`);
export const getGameDetails = (id) => request(`${API}/api/games/${id}`);

// ========== USER API ==========
export const getUser = (id) => request(`${API}/api/users/${id}`);
export const getUserStats = (id) => request(`${API}/api/users/${id}/stats`);
export const getUserGames = (userId, status) => {
  const url = status 
    ? `${API}/api/users/${userId}/games?status=${status}` 
    : `${API}/api/users/${userId}/games`;
  return request(url);
};

// Current user (requires authentication)
export const getMyGames = (status) => {
  const url = status 
    ? `${API}/api/my/games?status=${status}` 
    : `${API}/api/my/games`;
  return request(url);
};
export const addGameToMyList = (gameData) => 
  request(`${API}/api/my/games`, {
    method: 'POST',
    body: JSON.stringify(gameData),
  });
export const removeGameFromMyList = (gameId) =>
  request(`${API}/api/my/games/${gameId}`, { method: 'DELETE' });

// ========== REVIEWS API ==========
export const getReviews = (gameId) => request(`${API}/api/games/${gameId}/reviews`);
export const createReview = (gameId, reviewData) =>
  request(`${API}/api/games/${gameId}/reviews`, {
    method: 'POST',
    body: JSON.stringify(reviewData),
  });
export const updateReview = (reviewId, reviewData) =>
  request(`${API}/api/reviews/${reviewId}`, {
    method: 'PATCH',
    body: JSON.stringify(reviewData),
  });
export const deleteReview = (reviewId) =>
  request(`${API}/api/reviews/${reviewId}`, { method: 'DELETE' });
export const likeReview = (reviewId, userId) =>
  request(`${API}/api/reviews/${reviewId}/like`, {
    method: 'POST',
    body: JSON.stringify({ user_id: userId }),
  });

// ========== FORUM API ==========
export const getForumPreview = () => request(`${API}/api/threads`);
export const getThreads = () => request(`${API}/api/threads`);
export const getThread = (id) => request(`${API}/api/threads/${id}`);
export const createThread = (threadData) =>
  request(`${API}/api/threads`, {
    method: 'POST',
    body: JSON.stringify(threadData),
  });
export const updateThread = (threadId, threadData) =>
  request(`${API}/api/threads/${threadId}`, {
    method: 'PATCH',
    body: JSON.stringify(threadData),
  });
export const deleteThread = (threadId) =>
  request(`${API}/api/threads/${threadId}`, { method: 'DELETE' });
export const likeThread = (threadId, userId) =>
  request(`${API}/api/threads/${threadId}/like`, {
    method: 'POST',
    body: JSON.stringify({ user_id: userId }),
  });
export const createReply = (threadId, replyData) =>
  request(`${API}/api/threads/${threadId}/replies`, {
    method: 'POST',
    body: JSON.stringify(replyData),
  });
export const updateReply = (replyId, body) =>
  request(`${API}/api/replies/${replyId}`, {
    method: 'PATCH',
    body: JSON.stringify({ body }),
  });
export const deleteReply = (replyId) =>
  request(`${API}/api/replies/${replyId}`, { method: 'DELETE' });
