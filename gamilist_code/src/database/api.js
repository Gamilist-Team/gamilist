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
export const getGameDetails = (id) => request(`${API}/api/igdb/games/${id}`);

// ========== USER API ==========
export const getUser = (id) => request(`${API}/api/users/${id}`);
export const getUserGames = (userId, status) => {
  const url = status 
    ? `${API}/api/users/${userId}/games?status=${status}`
    : `${API}/api/users/${userId}/games`;
  return request(url);
};

// ========== MY GAMES API (requires auth) ==========
export const getMyGames = (status) => {
  const url = status 
    ? `${API}/api/my/games?status=${status}` 
    : `${API}/api/my/games`;
  return request(url);
};

export const addGameToMyList = (data) => request(`${API}/api/my/games`, {
  method: 'POST',
  body: JSON.stringify(data)
});

export const updateGameInMyList = (gameId, data) => request(`${API}/api/my/games/${gameId}`, {
  method: 'PATCH',
  body: JSON.stringify(data)
});

export const removeGameFromMyList = (gameId) => request(`${API}/api/my/games/${gameId}`, {
  method: 'DELETE'
});

// ========== FORUM API ==========
export const getForumPreview = () => request(`${API}/api/threads`);
