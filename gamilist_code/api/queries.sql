-- api/queries.sql
DROP TABLE IF EXISTS user_game_lists, list_items, user_lists, forum_threads, game_genres, genres, games, users CASCADE;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  password_hash TEXT DEFAULT '',
  avatar_url TEXT DEFAULT 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
  bio TEXT,
  github_id TEXT UNIQUE,
  github_username TEXT,
  created_at TIMESTAMP DEFAULT now()
);
CREATE TABLE games ( id SERIAL PRIMARY KEY, title TEXT NOT NULL, cover TEXT, rating NUMERIC );
CREATE TABLE genres ( id SERIAL PRIMARY KEY, name TEXT UNIQUE NOT NULL );
CREATE TABLE game_genres (
  game_id INT REFERENCES games(id) ON DELETE CASCADE,
  genre_id INT REFERENCES genres(id) ON DELETE CASCADE,
  PRIMARY KEY (game_id, genre_id)
);
CREATE TABLE forum_threads (
  id SERIAL PRIMARY KEY,
  game_id INT REFERENCES games(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT,
  created_at TIMESTAMP DEFAULT now()
);
-- User game lists (simpler structure - one table instead of two)
CREATE TABLE user_game_lists (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  game_id INT REFERENCES games(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('completed', 'playing', 'plan_to_play', 'dropped', 'on_hold')) DEFAULT 'plan_to_play',
  rating NUMERIC CHECK (rating >= 0 AND rating <= 10),
  notes TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE (user_id, game_id)
);

-- Password for test accounts: password123
INSERT INTO users (username, email, password_hash, bio) VALUES 
('rashad', 'rashad@gamilist.com', '$2b$10$aKwzw80eZeSBz/y1s6PQr..TFp/xjHpaAgnV1CrIYH84DR4v3ES6W', 'Indie game enthusiast'),
('guest', 'guest@gamilist.com', '$2b$10$aKwzw80eZeSBz/y1s6PQr..TFp/xjHpaAgnV1CrIYH84DR4v3ES6W', 'Just browsing!');

INSERT INTO games (title, cover, rating) VALUES
('Hollow Knight: Silksong', NULL, 9.5),
('Hades', NULL, 9.2),
('Balatro', NULL, 8.9);

-- Add some games to user lists for testing
INSERT INTO user_game_lists (user_id, game_id, status, rating, notes, completed_at)
SELECT 1, g.id, 'completed', 9.5, 'Amazing platformer!', now() - INTERVAL '10 days'
FROM games g WHERE g.title = 'Hollow Knight: Silksong'
UNION ALL
SELECT 1, g.id, 'playing', 8.5, 'Very addictive', NULL
FROM games g WHERE g.title = 'Hades'
UNION ALL
SELECT 2, g.id, 'plan_to_play', NULL, 'Looks interesting', NULL
FROM games g WHERE g.title = 'Balatro';

INSERT INTO forum_threads (game_id, user_id, title, body)
SELECT g.id, 1, 'THIS GAME IS ASS!!', 'I played for 5 min and died too many times…'
FROM games g WHERE g.title='Hollow Knight: Silksong' LIMIT 1;
