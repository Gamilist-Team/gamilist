// api/server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import { getTrendingGames, getByGenreName, getGameById } from './igdb.js';

const app = express();
app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

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
