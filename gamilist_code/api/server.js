// api/server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { getTrendingGames, getByGenreName, getGameById, searchGames as igdbSearch } from './igdb.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'gamilist-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
  connectionTimeoutMillis: 5000,
});

// Auth middleware
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// Routes
app.get('/', (_req, res) => res.send('✅ Gamilist API is running locally'));

// ========== AUTH ROUTES ==========
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Validation
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    
    // Check if user exists
    const existing = await pool.query('SELECT id FROM users WHERE username = $1 OR email = $2', [username, email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create user
    const { rows } = await pool.query(
      `INSERT INTO users (username, email, password_hash, avatar_url, bio) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, avatar_url, bio`,
      [username, email, passwordHash, `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`, '']
    );
    
    req.session.userId = rows[0].id;
    res.json({ user: rows[0] });
  } catch (e) {
    console.error('Register error:', e);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    
    // Find user
    const { rows } = await pool.query(
      'SELECT id, username, email, password_hash, avatar_url, bio FROM users WHERE username = $1',
      [username]
    );
    
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = rows[0];
    
    // Verify password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    req.session.userId = user.id;
    delete user.password_hash;
    res.json({ user });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ ok: true });
  });
});

app.get('/api/auth/me', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  
  try {
    const { rows } = await pool.query(
      'SELECT id, username, email, avatar_url, bio, created_at FROM users WHERE id = $1',
      [req.session.userId]
    );
    
    if (rows.length === 0) {
      req.session.destroy();
      return res.status(401).json({ error: 'User not found' });
    }
    
    res.json({ user: rows[0] });
  } catch (e) {
    console.error('Get user error:', e);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

app.get('/api/health', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT NOW() AS time;');
    res.json({ ok: true, time: rows[0].time });
  } catch (err) {
    console.error('Database connection error:', err);
    res.status(500).json({ ok: false, error: err.message, details: err.toString() });
  }
});

app.post('/api/reset', async (_req, res) => {
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'queries.sql'), 'utf8');
    await pool.query(sql);
    res.json({ ok: true, message: 'Database reset & seeded.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/migrate', async (_req, res) => {
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'migration.sql'), 'utf8');
    await pool.query(sql);
    res.json({ ok: true, message: 'Database migrated successfully. All existing data preserved.' });
  } catch (err) {
    console.error('Migration error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ========== IGDB ROUTES ==========
app.get('/api/igdb/trending', async (_req, res) => {
  try {
    const data = await getTrendingGames();
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'IGDB trending failed' });
  }
});

app.get('/api/igdb/genre/:name', async (req, res) => {
  try {
    const data = await getByGenreName(req.params.name);
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'IGDB genre failed' });
  }
});

app.get('/api/igdb/games/:id', async (req, res) => {
  try {
    const game = await getGameById(req.params.id);
    if (!game) return res.status(404).json({ error: 'Not found' });
    res.json(game);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'IGDB game failed' });
  }
});

// IGDB: Search games
app.get('/api/igdb/search', async (req, res) => {
  try {
    const { q } = req.query;
    const games = await igdbSearch(q || '');
    res.json(games);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'IGDB search failed' });
  }
});

// ========== GAMES ROUTES ==========
app.get('/api/games', async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT * FROM games';
    const params = [];
    
    if (search) {
      query += ' WHERE title ILIKE $1';
      params.push(`%${search}%`);
    }
    
    query += ' ORDER BY rating DESC LIMIT 50';
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

app.get('/api/games/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT g.*, 
        COALESCE(json_agg(DISTINCT jsonb_build_object('id', ge.id, 'name', ge.name)) 
          FILTER (WHERE ge.id IS NOT NULL), '[]') as genres
       FROM games g
       LEFT JOIN game_genres gg ON g.id = gg.game_id
       LEFT JOIN genres ge ON gg.genre_id = ge.id
       WHERE g.id = $1
       GROUP BY g.id`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Game not found' });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch game' });
  }
});

// ========== USER ROUTES ==========
app.get('/api/users/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

app.get('/api/users/:id/stats', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT 
        COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
        COUNT(*) FILTER (WHERE status = 'playing') as playing_count,
        COUNT(*) FILTER (WHERE status = 'plan_to_play') as plan_to_play_count,
        AVG(rating) FILTER (WHERE rating IS NOT NULL) as avg_rating
       FROM user_game_lists
       WHERE user_id = $1`,
      [req.params.id]
    );
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});

// ========== USER GAME LISTS ROUTES ==========
app.get('/api/users/:userId/games', async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT ugl.*, g.title, g.cover, g.igdb_id, ROUND(g.rating) as game_rating
      FROM user_game_lists ugl
      JOIN games g ON g.id = ugl.game_id
      WHERE ugl.user_id = $1`;
    const params = [req.params.userId];
    
    if (status) {
      query += ' AND ugl.status = $2';
      params.push(status);
    }
    
    query += ' ORDER BY ugl.updated_at DESC';
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch user games' });
  }
});

// My games list (for logged in user)
app.get('/api/my/games', requireAuth, async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT ugl.*, g.title, g.cover, g.igdb_id, ROUND(g.rating) as game_rating
      FROM user_game_lists ugl
      JOIN games g ON g.id = ugl.game_id
      WHERE ugl.user_id = $1`;
    const params = [req.session.userId];
    
    if (status) {
      query += ' AND ugl.status = $2';
      params.push(status);
    }
    
    query += ' ORDER BY ugl.updated_at DESC';
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

app.post('/api/my/games', requireAuth, async (req, res) => {
  try {
    const { igdb_id, status, rating, notes, title, cover, game_rating, summary, genres } = req.body;
    
    // First, check if game exists in our database
    let gameResult = await pool.query(
      'SELECT id FROM games WHERE igdb_id = $1',
      [igdb_id]
    );
    
    let gameId;
    if (gameResult.rows.length === 0) {
      // Game doesn't exist, create it
      console.log(`Creating new game record for IGDB ID ${igdb_id}: ${title}`);
      const insertResult = await pool.query(
        `INSERT INTO games (igdb_id, title, cover, rating, summary, created_at)
         VALUES ($1, $2, $3, $4, $5, now())
         RETURNING id`,
        [igdb_id, title, cover, Math.round(game_rating || 0), summary || '']
      );
      gameId = insertResult.rows[0].id;
      
      // Add genres if provided
      if (genres && Array.isArray(genres)) {
        for (const genreName of genres) {
          // Find or create genre
          let genreResult = await pool.query(
            'SELECT id FROM genres WHERE name = $1',
            [genreName]
          );
          let genreId;
          if (genreResult.rows.length === 0) {
            const newGenre = await pool.query(
              'INSERT INTO genres (name) VALUES ($1) RETURNING id',
              [genreName]
            );
            genreId = newGenre.rows[0].id;
          } else {
            genreId = genreResult.rows[0].id;
          }
          
          // Link game to genre
          await pool.query(
            'INSERT INTO game_genres (game_id, genre_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [gameId, genreId]
          );
        }
      }
    } else {
      gameId = gameResult.rows[0].id;
    }
    
    // Now add/update in user's list
    const { rows } = await pool.query(
      `INSERT INTO user_game_lists (user_id, game_id, status, rating, notes, updated_at)
       VALUES ($1, $2, $3, $4, $5, now())
       ON CONFLICT (user_id, game_id) 
       DO UPDATE SET status = $3, rating = $4, notes = $5, updated_at = now()
       RETURNING *`,
      [req.session.userId, gameId, status, rating, notes]
    );
    res.json(rows[0]);
  } catch (e) {
    console.error('Failed to add game to list:', e);
    res.status(500).json({ error: 'Failed to add/update game' });
  }
});

app.delete('/api/my/games/:gameId', requireAuth, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM user_game_lists WHERE user_id = $1 AND game_id = $2',
      [req.session.userId, req.params.gameId]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to remove game' });
  }
});

// ========== REVIEWS ROUTES ==========
app.get('/api/games/:gameId/reviews', async (req, res) => {
  try {
    const igdbId = req.params.gameId;
    
    // Find the database game_id from igdb_id
    const gameResult = await pool.query(
      'SELECT id FROM games WHERE igdb_id = $1',
      [igdbId]
    );
    
    if (gameResult.rows.length === 0) {
      // Game not in database yet, return empty reviews
      return res.json([]);
    }
    
    const gameId = gameResult.rows[0].id;
    
    const { rows } = await pool.query(
      `SELECT r.*, u.username, u.avatar_url
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.game_id = $1
       ORDER BY r.created_at DESC`,
      [gameId]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

app.post('/api/games/:gameId/reviews', requireAuth, async (req, res) => {
  try {
    const { title, body, rating } = req.body;
    const igdbId = req.params.gameId;
    
    // Find the database game_id from igdb_id
    const gameResult = await pool.query(
      'SELECT id FROM games WHERE igdb_id = $1',
      [igdbId]
    );
    
    if (gameResult.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found in database' });
    }
    
    const gameId = gameResult.rows[0].id;
    
    const { rows } = await pool.query(
      `INSERT INTO reviews (user_id, game_id, title, body, rating)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.session.userId, gameId, title, body, rating]
    );
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

app.patch('/api/reviews/:id', async (req, res) => {
  try {
    const { title, body, rating } = req.body;
    const { rows } = await pool.query(
      `UPDATE reviews SET title = $1, body = $2, rating = $3, updated_at = now()
       WHERE id = $4 RETURNING *`,
      [title, body, rating, req.params.id]
    );
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

app.delete('/api/reviews/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM reviews WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

app.post('/api/reviews/:id/like', async (req, res) => {
  try {
    const { user_id } = req.body;
    await pool.query(
      'INSERT INTO review_likes (user_id, review_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [user_id, req.params.id]
    );
    await pool.query(
      'UPDATE reviews SET likes_count = likes_count + 1 WHERE id = $1',
      [req.params.id]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to like review' });
  }
});

// ========== FORUM ROUTES ==========
app.get('/api/threads', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT t.*, u.username, u.avatar_url, g.title AS game_title
       FROM forum_threads t
       LEFT JOIN users u ON u.id = t.user_id
       LEFT JOIN games g ON g.id = t.game_id
       ORDER BY t.created_at DESC
       LIMIT 50`
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch threads' });
  }
});

app.get('/api/threads/:id', async (req, res) => {
  try {
    const { rows: threads } = await pool.query(
      `SELECT t.*, u.username, u.avatar_url, g.title AS game_title
       FROM forum_threads t
       LEFT JOIN users u ON u.id = t.user_id
       LEFT JOIN games g ON g.id = t.game_id
       WHERE t.id = $1`,
      [req.params.id]
    );
    
    if (threads.length === 0) return res.status(404).json({ error: 'Thread not found' });
    
    const { rows: replies } = await pool.query(
      `SELECT r.*, u.username, u.avatar_url
       FROM forum_replies r
       JOIN users u ON u.id = r.user_id
       WHERE r.thread_id = $1
       ORDER BY r.created_at ASC`,
      [req.params.id]
    );
    
    res.json({ ...threads[0], replies });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch thread' });
  }
});

app.post('/api/threads', requireAuth, async (req, res) => {
  try {
    const { game_id, title, body } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO forum_threads (user_id, game_id, title, body)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.session.userId, game_id, title, body]
    );
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create thread' });
  }
});

app.patch('/api/threads/:id', async (req, res) => {
  try {
    const { title, body } = req.body;
    const { rows } = await pool.query(
      `UPDATE forum_threads SET title = $1, body = $2, updated_at = now()
       WHERE id = $3 RETURNING *`,
      [title, body, req.params.id]
    );
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update thread' });
  }
});

app.delete('/api/threads/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM forum_threads WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete thread' });
  }
});

app.post('/api/threads/:id/like', async (req, res) => {
  try {
    const { user_id } = req.body;
    await pool.query(
      'INSERT INTO forum_thread_likes (user_id, thread_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [user_id, req.params.id]
    );
    await pool.query(
      'UPDATE forum_threads SET likes_count = likes_count + 1 WHERE id = $1',
      [req.params.id]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to like thread' });
  }
});

app.post('/api/threads/:id/replies', requireAuth, async (req, res) => {
  try {
    const { body } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO forum_replies (thread_id, user_id, body)
       VALUES ($1, $2, $3) RETURNING *`,
      [req.params.id, req.session.userId, body]
    );
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create reply' });
  }
});

app.patch('/api/replies/:id', async (req, res) => {
  try {
    const { body } = req.body;
    const { rows } = await pool.query(
      `UPDATE forum_replies SET body = $1, updated_at = now()
       WHERE id = $2 RETURNING *`,
      [body, req.params.id]
    );
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update reply' });
  }
});

app.delete('/api/replies/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM forum_replies WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete reply' });
  }
});

// Listen
const port = process.env.PORT || 10000;
app.listen(port, () => console.log(`🚀 Gamilist API running on port ${port}`));
