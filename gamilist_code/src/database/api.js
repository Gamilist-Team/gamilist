const API = import.meta.env.VITE_API_URL;

async function j(url) {
  const r = await fetch(url);
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`${r.status} ${url} – ${text.slice(0,120)}`);
  }
  return r.json();
}

// IGDB-backed data
export const getTrending   = () => j(`${API}/api/igdb/trending`);
export const getByGenre    = (name) => j(`${API}/api/igdb/genre/${encodeURIComponent(name)}`);

// Forum preview (Postgres)
export const getForumPreview = () => j(`${API}/api/threads`);

// Optional: single game
// export const getGameDetails = (id) => j(`${API}/api/igdb/games/${id}`);
