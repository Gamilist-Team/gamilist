// api/server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { getTrendingGames, getByGenreName, getGameById } from './igdb.js';

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'gamilist-dev-secret',
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
});

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, username, email, avatar_url, bio FROM users WHERE id = $1',
      [id]
    );
    done(null, rows[0]);
  } catch (error) {
    done(error);
  }
});

// GitHub OAuth Strategy (optional - only if credentials are configured)
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(new GitHubStrategy({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:10000/api/auth/github/callback'
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists with this GitHub ID
        let result = await pool.query('SELECT * FROM users WHERE github_id = $1', [profile.id]);
        
        if (result.rows.length > 0) {
          // User exists, update their info
          const updateResult = await pool.query(
            `UPDATE users 
             SET username = $1, email = $2, avatar_url = $3, github_username = $4
             WHERE github_id = $5
             RETURNING id, username, email, avatar_url, bio`,
            [
              profile.username || profile.displayName,
              profile.emails?.[0]?.value || null,
              profile.photos?.[0]?.value || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`,
              profile.username,
              profile.id
            ]
          );
          return done(null, updateResult.rows[0]);
        } else {
          // Create new user
          const insertResult = await pool.query(
            `INSERT INTO users (username, email, avatar_url, github_id, github_username, password_hash)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, username, email, avatar_url, bio`,
            [
              profile.username || profile.displayName,
              profile.emails?.[0]?.value || null,
              profile.photos?.[0]?.value || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`,
              profile.id,
              profile.username,
              ''
            ]
          );
          return done(null, insertResult.rows[0]);
        }
      } catch (error) {
        console.error('GitHub OAuth error:', error);
        return done(error);
      }
    }
  ));
  console.log('✅ GitHub OAuth enabled');
} else {
  console.log('⚠️  GitHub OAuth disabled (no credentials configured)');
}

// Auth middleware
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

app.get('/api/threads', async (_req, res) => {
  try {
    const q = `
      SELECT t.id, t.title, t.body, t.created_at,
             u.username,
             g.title AS game_title
      FROM forum_threads t
      LEFT JOIN users u ON u.id = t.user_id
      LEFT JOIN games g ON g.id = t.game_id
      ORDER BY t.created_at DESC
      LIMIT 10;`;
    const { rows } = await pool.query(q);
    res.json(rows);
  } catch (e) {
    console.error('/api/threads error:', e);
    res.status(500).json({ error: 'threads failed' });
  }
});


// Routes
app.get('/', (_req, res) => res.send('✅ Gamilist API is running locally'));

// ========== AUTHENTICATION ROUTES ==========

// Register new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, avatar_url, bio',
      [username, email, hashedPassword]
    );
    
    req.session.userId = rows[0].id;
    res.json({ user: rows[0] });
  } catch (e) {
    console.error('Register error:', e);
    if (e.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login with username/password
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = rows[0];
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

// Logout
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ ok: true });
  });
});

// Get current user
app.get('/api/auth/me', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  
  try {
    const { rows } = await pool.query(
      'SELECT id, username, email, avatar_url, bio FROM users WHERE id = $1',
      [req.session.userId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user: rows[0] });
  } catch (e) {
    console.error('Get user error:', e);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// GitHub OAuth routes (only if configured)
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  app.get('/api/auth/github',
    passport.authenticate('github', { scope: ['user:email'] })
  );

  app.get('/api/auth/github/callback',
    passport.authenticate('github', { failureRedirect: process.env.FRONTEND_URL || 'http://localhost:5173/login' }),
    (req, res) => {
      req.session.userId = req.user.id;
      res.redirect(process.env.FRONTEND_URL || 'http://localhost:5173');
    }
  );
}

// ========== GAME LISTS ROUTES ==========

// Get user's game list
app.get('/api/users/:userId/games', async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT ugl.*, g.title, g.cover, g.rating as game_rating
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

// Get current user's game list (requires auth)
app.get('/api/my/games', requireAuth, async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT ugl.*, g.title, g.cover, g.rating as game_rating
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

// Add game to current user's list
app.post('/api/my/games', requireAuth, async (req, res) => {
  try {
    const { game_id, status, rating, notes } = req.body;
    
    // Check if game exists in database, if not, fetch from IGDB and insert
    const checkGame = await pool.query('SELECT id FROM games WHERE id = $1', [game_id]);
    
    if (checkGame.rows.length === 0) {
      // Game doesn't exist, fetch from IGDB and insert
      try {
        const gameData = await getGameById(game_id);
        if (gameData) {
          await pool.query(
            'INSERT INTO games (id, title, cover, rating) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING',
            [game_id, gameData.title, gameData.cover, gameData.rating]
          );
        } else {
          return res.status(404).json({ error: 'Game not found in IGDB' });
        }
      } catch (igdbError) {
        console.error('Failed to fetch from IGDB:', igdbError);
        return res.status(500).json({ error: 'Failed to fetch game data' });
      }
    }
    
    const { rows } = await pool.query(
      `INSERT INTO user_game_lists (user_id, game_id, status, rating, notes, updated_at)
       VALUES ($1, $2, $3, $4, $5, now())
       ON CONFLICT (user_id, game_id) 
       DO UPDATE SET status = $3, rating = $4, notes = $5, updated_at = now()
       RETURNING *`,
      [req.session.userId, game_id, status || 'plan_to_play', rating, notes]
    );
    res.json(rows[0]);
  } catch (e) {
    console.error('Failed to add game:', e);
    res.status(500).json({ error: 'Failed to add/update game' });
  }
});

// Update game status/rating
app.patch('/api/my/games/:gameId', requireAuth, async (req, res) => {
  try {
    const { status, rating, notes } = req.body;
    const updates = [];
    const params = [];
    let paramIndex = 1;
    
    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      params.push(status);
    }
    if (rating !== undefined) {
      updates.push(`rating = $${paramIndex++}`);
      params.push(rating);
    }
    if (notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      params.push(notes);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    updates.push(`updated_at = now()`);
    params.push(req.session.userId, req.params.gameId);
    
    const { rows } = await pool.query(
      `UPDATE user_game_lists SET ${updates.join(', ')}
       WHERE user_id = $${paramIndex} AND game_id = $${paramIndex + 1}
       RETURNING *`,
      params
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Game not in list' });
    }
    
    res.json(rows[0]);
  } catch (e) {
    console.error('Failed to update game:', e);
    res.status(500).json({ error: 'Failed to update game' });
  }
});

// Remove game from list
app.delete('/api/my/games/:gameId', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM user_game_lists WHERE user_id = $1 AND game_id = $2 RETURNING *',
      [req.session.userId, req.params.gameId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Game not in list' });
    }
    
    res.json({ ok: true, deleted: rows[0] });
  } catch (e) {
    console.error('Failed to remove game:', e);
    res.status(500).json({ error: 'Failed to remove game' });
  }
});

// IGDB routes
// IGDB: Trending list
app.get('/api/igdb/trending', async (_req, res) => {
  try {
    const data = await getTrendingGames();
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'IGDB trending failed' });
  }
});

// IGDB: By genre
app.get('/api/igdb/genre/:name', async (req, res) => {
  try {
    const data = await getByGenreName(req.params.name);
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'IGDB genre failed' });
  }
});

// IGDB: Single game details (for /games/:id in React)
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

app.get('/api/health', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT NOW() AS time;');
    res.json({ ok: true, time: rows[0].time });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Example reset route
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Listen
const port = process.env.PORT || 10000;
app.listen(port, () => console.log(`🚀 Gamilist API running on port ${port}`));
