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
    const { game_id, gameId, status, rating, notes } = req.body;
    const actualGameId = game_id || gameId; // Support both formats
    
    if (!actualGameId) {
      return res.status(400).json({ error: 'Game ID is required' });
    }
    
    // Check if game exists in database, if not, fetch from IGDB and insert
    const checkGame = await pool.query('SELECT id FROM games WHERE id = $1', [actualGameId]);
    
    if (checkGame.rows.length === 0) {
      // Game doesn't exist, fetch from IGDB and insert
      try {
        const gameData = await getGameById(actualGameId);
        if (!gameData) {
          console.error(`Game ${actualGameId} not found in IGDB`);
          return res.status(404).json({ error: 'Game not found in IGDB' });
        }
        
        await pool.query(
          'INSERT INTO games (id, title, cover, rating) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING',
          [actualGameId, gameData.title, gameData.cover || null, gameData.rating || null]
        );
      } catch (igdbError) {
        console.error('Failed to fetch from IGDB:', igdbError.message || igdbError);
        // Don't fail - try to create a minimal game record
        try {
          await pool.query(
            'INSERT INTO games (id, title) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING',
            [actualGameId, `Game ${actualGameId}`]
          );
        } catch (fallbackError) {
          console.error('Failed to create fallback game:', fallbackError);
          return res.status(500).json({ error: 'Failed to fetch game data' });
        }
      }
    }
    
    const { rows } = await pool.query(
      `INSERT INTO user_game_lists (user_id, game_id, status, rating, notes, updated_at)
       VALUES ($1, $2, $3, $4, $5, now())
       ON CONFLICT (user_id, game_id) 
       DO UPDATE SET status = $3, rating = $4, notes = $5, updated_at = now()
       RETURNING *`,
      [req.session.userId, actualGameId, status || 'plan_to_play', rating, notes]
    );
    
    // Check and award achievements
    await checkAndAwardAchievements(req.session.userId);
    
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
    
    // Check and award achievements
    await checkAndAwardAchievements(req.session.userId);
    
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

// ========== REVIEWS ROUTES ==========

// Get reviews for a game
app.get('/api/games/:gameId/reviews', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT r.*, u.username, u.avatar_url
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.game_id = $1
       ORDER BY r.created_at DESC`,
      [req.params.gameId]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Create or update a review
app.post('/api/games/:gameId/reviews', requireAuth, async (req, res) => {
  try {
    const { rating, review_text } = req.body;
    const gameId = req.params.gameId;
    
    if (!rating || !review_text) {
      return res.status(400).json({ error: 'Rating and review text required' });
    }
    
    // Ensure game exists in database
    const { rows: existingGame } = await pool.query(
      'SELECT id FROM games WHERE id = $1',
      [gameId]
    );
    
    if (existingGame.length === 0) {
      try {
        const gameDetails = await getGameById(gameId);
        if (gameDetails) {
          await pool.query(
            'INSERT INTO games (id, title, cover, rating) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING',
            [gameDetails.id, gameDetails.title, gameDetails.cover, gameDetails.rating]
          );
        }
      } catch (err) {
        console.error('Failed to fetch game from IGDB:', err);
      }
    }
    
    const { rows } = await pool.query(
      `INSERT INTO reviews (user_id, game_id, rating, review_text, updated_at)
       VALUES ($1, $2, $3, $4, now())
       ON CONFLICT (user_id, game_id)
       DO UPDATE SET rating = $3, review_text = $4, updated_at = now()
       RETURNING *`,
      [req.session.userId, gameId, rating, review_text]
    );
    
    // Check and award achievements
    await checkAndAwardAchievements(req.session.userId);
    
    res.json(rows[0]);
  } catch (e) {
    console.error('Failed to create review:', e);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

// Delete a review
app.delete('/api/games/:gameId/reviews', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM reviews WHERE user_id = $1 AND game_id = $2 RETURNING *',
      [req.session.userId, req.params.gameId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    res.json({ ok: true, deleted: rows[0] });
  } catch (e) {
    console.error('Failed to delete review:', e);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// Mark review as helpful
app.post('/api/reviews/:reviewId/helpful', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = $1 RETURNING *',
      [req.params.reviewId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    res.json(rows[0]);
  } catch (e) {
    console.error('Failed to mark helpful:', e);
    res.status(500).json({ error: 'Failed to mark helpful' });
  }
});

// ========== FORUM ROUTES ==========

// Get all forum threads
app.get('/api/forum/threads', async (req, res) => {
  try {
    const { gameId } = req.query;
    let query = `
      SELECT 
        ft.*,
        u.username as author_username,
        g.title as game_title,
        g.cover as game_cover,
        (SELECT COUNT(*) FROM forum_posts WHERE thread_id = ft.id) as post_count
      FROM forum_threads ft
      LEFT JOIN users u ON ft.user_id = u.id
      LEFT JOIN games g ON ft.game_id = g.id
    `;
    
    const params = [];
    if (gameId) {
      query += ' WHERE ft.game_id = $1';
      params.push(gameId);
    }
    
    query += ' ORDER BY ft.created_at DESC';
    
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (e) {
    console.error('Failed to fetch threads:', e);
    res.status(500).json({ error: 'Failed to fetch threads' });
  }
});

// Get single thread with details
app.get('/api/forum/threads/:threadId', async (req, res) => {
  try {
    const { threadId } = req.params;
    
    const { rows } = await pool.query(`
      SELECT 
        ft.*,
        u.username as author_username,
        g.title as game_title,
        g.cover as game_cover
      FROM forum_threads ft
      LEFT JOIN users u ON ft.user_id = u.id
      LEFT JOIN games g ON ft.game_id = g.id
      WHERE ft.id = $1
    `, [threadId]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Thread not found' });
    }
    
    res.json(rows[0]);
  } catch (e) {
    console.error('Failed to fetch thread:', e);
    res.status(500).json({ error: 'Failed to fetch thread' });
  }
});

// Create new thread
app.post('/api/forum/threads', requireAuth, async (req, res) => {
  try {
    const { gameId, title, body } = req.body;
    const userId = req.session.userId;
    
    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }
    
    // If gameId is provided, ensure it exists in our database
    if (gameId) {
      const { rows: existingGame } = await pool.query(
        'SELECT id FROM games WHERE id = $1',
        [gameId]
      );
      
      // If game doesn't exist locally, fetch from IGDB and insert
      if (existingGame.length === 0) {
        try {
          const gameDetails = await getGameById(gameId);
          if (gameDetails) {
            await pool.query(
              'INSERT INTO games (id, title, cover, rating) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING',
              [gameDetails.id, gameDetails.title, gameDetails.cover, gameDetails.rating]
            );
          }
        } catch (err) {
          console.error('Failed to fetch game from IGDB:', err);
          // Continue even if we can't fetch the game - just create thread without game link
        }
      }
    }
    
    const { rows } = await pool.query(`
      INSERT INTO forum_threads (game_id, user_id, title, body)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [gameId || null, userId, title, body]);
    
    res.json(rows[0]);
  } catch (e) {
    console.error('Failed to create thread:', e);
    res.status(500).json({ error: 'Failed to create thread' });
  }
});

// Update thread
app.patch('/api/forum/threads/:threadId', requireAuth, async (req, res) => {
  try {
    const { threadId } = req.params;
    const { title, body } = req.body;
    const userId = req.session.userId;
    
    // Check if user owns the thread
    const { rows: ownerCheck } = await pool.query(
      'SELECT user_id FROM forum_threads WHERE id = $1',
      [threadId]
    );
    
    if (ownerCheck.length === 0) {
      return res.status(404).json({ error: 'Thread not found' });
    }
    
    if (ownerCheck[0].user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const { rows } = await pool.query(`
      UPDATE forum_threads
      SET title = COALESCE($1, title),
          body = COALESCE($2, body),
          updated_at = now()
      WHERE id = $3
      RETURNING *
    `, [title, body, threadId]);
    
    res.json(rows[0]);
  } catch (e) {
    console.error('Failed to update thread:', e);
    res.status(500).json({ error: 'Failed to update thread' });
  }
});

// Delete thread
app.delete('/api/forum/threads/:threadId', requireAuth, async (req, res) => {
  try {
    const { threadId } = req.params;
    const userId = req.session.userId;
    
    // Check if user owns the thread
    const { rows: ownerCheck } = await pool.query(
      'SELECT user_id FROM forum_threads WHERE id = $1',
      [threadId]
    );
    
    if (ownerCheck.length === 0) {
      return res.status(404).json({ error: 'Thread not found' });
    }
    
    if (ownerCheck[0].user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    await pool.query('DELETE FROM forum_threads WHERE id = $1', [threadId]);
    res.json({ ok: true });
  } catch (e) {
    console.error('Failed to delete thread:', e);
    res.status(500).json({ error: 'Failed to delete thread' });
  }
});

// Get posts for a thread
app.get('/api/forum/threads/:threadId/posts', async (req, res) => {
  try {
    const { threadId } = req.params;
    
    const { rows } = await pool.query(`
      SELECT 
        fp.*,
        u.username as author_username
      FROM forum_posts fp
      LEFT JOIN users u ON fp.user_id = u.id
      WHERE fp.thread_id = $1
      ORDER BY fp.created_at ASC
    `, [threadId]);
    
    res.json(rows);
  } catch (e) {
    console.error('Failed to fetch posts:', e);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Create new post
app.post('/api/forum/threads/:threadId/posts', requireAuth, async (req, res) => {
  try {
    const { threadId } = req.params;
    const { content } = req.body;
    const userId = req.session.userId;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    const { rows } = await pool.query(`
      INSERT INTO forum_posts (thread_id, user_id, content)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [threadId, userId, content]);
    
    res.json(rows[0]);
  } catch (e) {
    console.error('Failed to create post:', e);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Update post
app.patch('/api/forum/posts/:postId', requireAuth, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.session.userId;
    
    // Check if user owns the post
    const { rows: ownerCheck } = await pool.query(
      'SELECT user_id FROM forum_posts WHERE id = $1',
      [postId]
    );
    
    if (ownerCheck.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    if (ownerCheck[0].user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const { rows } = await pool.query(`
      UPDATE forum_posts
      SET content = $1,
          updated_at = now()
      WHERE id = $2
      RETURNING *
    `, [content, postId]);
    
    res.json(rows[0]);
  } catch (e) {
    console.error('Failed to update post:', e);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// Delete post
app.delete('/api/forum/posts/:postId', requireAuth, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.session.userId;
    
    // Check if user owns the post
    const { rows: ownerCheck } = await pool.query(
      'SELECT user_id FROM forum_posts WHERE id = $1',
      [postId]
    );
    
    if (ownerCheck.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    if (ownerCheck[0].user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    await pool.query('DELETE FROM forum_posts WHERE id = $1', [postId]);
    res.json({ ok: true });
  } catch (e) {
    console.error('Failed to delete post:', e);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// ========== RECOMMENDATIONS ROUTES ==========

// Get personalized recommendations for current user
app.get('/api/my/recommendations', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    // Get user's completed and highly rated games
    const { rows: userGames } = await pool.query(`
      SELECT ugl.game_id, g.title, ugl.rating, ugl.status
      FROM user_game_lists ugl
      JOIN games g ON ugl.game_id = g.id
      WHERE ugl.user_id = $1 
        AND (ugl.status = 'completed' OR ugl.rating >= 8)
      ORDER BY ugl.rating DESC NULLS LAST
      LIMIT 10
    `, [userId]);
    
    if (userGames.length === 0) {
      // If user has no games, return trending games as recommendations
      const trending = await getTrendingGames();
      return res.json({
        recommendations: trending.slice(0, 10),
        reason: 'Based on trending games'
      });
    }
    
    // Get genres from user's favorite games
    const gameIds = userGames.map(g => g.game_id);
    const { rows: userGenres } = await pool.query(`
      SELECT g.name, COUNT(*) as count
      FROM game_genres gg
      JOIN genres g ON gg.genre_id = g.id
      WHERE gg.game_id = ANY($1)
      GROUP BY g.name
      ORDER BY count DESC
      LIMIT 3
    `, [gameIds]);
    
    // Get recommendations based on favorite genres
    let recommendations = [];
    if (userGenres.length > 0) {
      const topGenre = userGenres[0].name;
      recommendations = await getByGenreName(topGenre);
    } else {
      // Fallback to trending if no genres found
      recommendations = await getTrendingGames();
    }
    
    // Filter out games user already has
    const { rows: existingGames } = await pool.query(
      'SELECT game_id FROM user_game_lists WHERE user_id = $1',
      [userId]
    );
    const existingGameIds = new Set(existingGames.map(g => g.game_id));
    
    const filteredRecommendations = recommendations
      .filter(game => !existingGameIds.has(game.id))
      .slice(0, 12);
    
    res.json({
      recommendations: filteredRecommendations,
      basedOn: {
        games: userGames.map(g => g.title),
        genres: userGenres.map(g => g.name)
      }
    });
  } catch (e) {
    console.error('Failed to get recommendations:', e);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// ========== ACHIEVEMENTS ROUTES ==========

// Get all achievements
app.get('/api/achievements', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM achievements ORDER BY category, points');
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch achievements' });
  }
});

// Get user's achievements
app.get('/api/users/:userId/achievements', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT a.*, ua.unlocked_at
       FROM achievements a
       LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = $1
       ORDER BY 
         CASE WHEN ua.unlocked_at IS NULL THEN 1 ELSE 0 END,
         ua.unlocked_at DESC,
         a.points ASC`,
      [req.params.userId]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch user achievements' });
  }
});

// Get current user's achievements
app.get('/api/my/achievements', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT a.*, ua.unlocked_at
       FROM achievements a
       LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = $1
       ORDER BY 
         CASE WHEN ua.unlocked_at IS NULL THEN 1 ELSE 0 END,
         ua.unlocked_at DESC,
         a.points ASC`,
      [req.session.userId]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch achievements' });
  }
});

// Achievement checking function
async function checkAndAwardAchievements(userId) {
  try {
    // Get user stats
    const stats = await pool.query(
      `SELECT 
        (SELECT COUNT(*) FROM user_game_lists WHERE user_id = $1) as games_added,
        (SELECT COUNT(*) FROM user_game_lists WHERE user_id = $1 AND status = 'completed') as games_completed,
        (SELECT COUNT(*) FROM reviews WHERE user_id = $1) as reviews_written,
        (SELECT COUNT(*) FROM user_game_lists WHERE user_id = $1 AND rating IS NOT NULL) as ratings_given,
        (SELECT COALESCE(SUM(helpful_count), 0) FROM reviews WHERE user_id = $1) as helpful_reviews`,
      [userId]
    );
    
    const userStats = stats.rows[0];
    
    // Get all achievements
    const achievements = await pool.query('SELECT * FROM achievements');
    
    // Check each achievement
    for (const achievement of achievements.rows) {
      const statValue = userStats[achievement.requirement_type] || 0;
      
      if (statValue >= achievement.requirement_count) {
        // Award achievement if not already awarded
        await pool.query(
          `INSERT INTO user_achievements (user_id, achievement_id)
           VALUES ($1, $2)
           ON CONFLICT (user_id, achievement_id) DO NOTHING`,
          [userId, achievement.id]
        );
      }
    }
  } catch (e) {
    console.error('Failed to check achievements:', e);
  }
}

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
