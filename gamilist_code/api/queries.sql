-- api/queries.sql
DROP TABLE IF EXISTS user_achievements, achievements, reviews, user_game_lists, list_items, user_lists, forum_threads, game_genres, genres, games, users CASCADE;

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

-- Game reviews
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  game_id INT REFERENCES games(id) ON DELETE CASCADE,
  rating NUMERIC CHECK (rating >= 0 AND rating <= 10) NOT NULL,
  review_text TEXT NOT NULL,
  helpful_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE (user_id, game_id)
);

-- Achievements definitions
CREATE TABLE achievements (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT,
  category TEXT CHECK (category IN ('games', 'reviews', 'social', 'special')) DEFAULT 'games',
  requirement_type TEXT NOT NULL, -- 'games_completed', 'reviews_written', 'ratings_given', etc.
  requirement_count INT DEFAULT 1,
  points INT DEFAULT 10,
  created_at TIMESTAMP DEFAULT now()
);

-- User achievements (unlocked)
CREATE TABLE user_achievements (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  achievement_id INT REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP DEFAULT now(),
  UNIQUE (user_id, achievement_id)
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

-- Add sample achievements
INSERT INTO achievements (name, description, icon, category, requirement_type, requirement_count, points) VALUES
('First Steps', 'Add your first game to your list', '🎮', 'games', 'games_added', 1, 10),
('Getting Started', 'Add 5 games to your list', '📝', 'games', 'games_added', 5, 25),
('Dedicated Gamer', 'Add 20 games to your list', '🎯', 'games', 'games_added', 20, 50),
('First Victory', 'Complete your first game', '🏆', 'games', 'games_completed', 1, 15),
('Achievement Hunter', 'Complete 10 games', '⭐', 'games', 'games_completed', 10, 50),
('Completionist', 'Complete 50 games', '👑', 'games', 'games_completed', 50, 150),
('Critic''s Corner', 'Write your first review', '✍️', 'reviews', 'reviews_written', 1, 15),
('Prolific Reviewer', 'Write 10 reviews', '📚', 'reviews', 'reviews_written', 10, 50),
('Rating Master', 'Rate 25 games', '⭐', 'reviews', 'ratings_given', 25, 40),
('Community Voice', 'Have a review marked helpful 10 times', '💬', 'social', 'helpful_reviews', 10, 30);

-- Add sample reviews
INSERT INTO reviews (user_id, game_id, rating, review_text, helpful_count)
SELECT 1, g.id, 9.5, 'Absolutely stunning platformer with tight controls and beautiful art. The combat is challenging but fair. Highly recommend!', 5
FROM games g WHERE g.title = 'Hollow Knight: Silksong'
UNION ALL
SELECT 2, g.id, 9.0, 'Great roguelike with amazing story and progression. The music is fantastic and each run feels unique!', 3
FROM games g WHERE g.title = 'Hades';
