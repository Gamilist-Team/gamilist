-- api/queries.sql
DROP TABLE IF EXISTS forum_replies, forum_thread_likes, review_likes, reviews, user_game_lists, game_genres, genres, forum_threads, games, users CASCADE;

-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  avatar_url TEXT DEFAULT 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
  bio TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Games table with more details
CREATE TABLE games (
  id SERIAL PRIMARY KEY,
  igdb_id INT UNIQUE,
  title TEXT NOT NULL,
  slug TEXT,
  cover TEXT,
  rating NUMERIC DEFAULT 0,
  summary TEXT,
  release_date DATE,
  created_at TIMESTAMP DEFAULT now()
);

-- Genres
CREATE TABLE genres (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

-- Game-Genre junction
CREATE TABLE game_genres (
  game_id INT REFERENCES games(id) ON DELETE CASCADE,
  genre_id INT REFERENCES genres(id) ON DELETE CASCADE,
  PRIMARY KEY (game_id, genre_id)
);

-- User game lists (replaces old user_lists and list_items)
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

-- Reviews table
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  game_id INT REFERENCES games(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  rating NUMERIC CHECK (rating >= 0 AND rating <= 10) NOT NULL,
  likes_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE (user_id, game_id)
);

-- Review likes
CREATE TABLE review_likes (
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  review_id INT REFERENCES reviews(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now(),
  PRIMARY KEY (user_id, review_id)
);

-- Forum threads
CREATE TABLE forum_threads (
  id SERIAL PRIMARY KEY,
  game_id INT REFERENCES games(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT,
  likes_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Forum thread likes
CREATE TABLE forum_thread_likes (
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  thread_id INT REFERENCES forum_threads(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now(),
  PRIMARY KEY (user_id, thread_id)
);

-- Forum replies
CREATE TABLE forum_replies (
  id SERIAL PRIMARY KEY,
  thread_id INT REFERENCES forum_threads(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Seed data
-- Password for all test accounts: password123
INSERT INTO users (username, email, password_hash, bio) VALUES 
('rashad', 'rashad@gamilist.com', '$2b$10$aKwzw80eZeSBz/y1s6PQr..TFp/xjHpaAgnV1CrIYH84DR4v3ES6W', 'Indie game enthusiast and speedrunner'),
('guest', 'guest@gamilist.com', '$2b$10$aKwzw80eZeSBz/y1s6PQr..TFp/xjHpaAgnV1CrIYH84DR4v3ES6W', 'Just browsing!'),
('jing', 'jing@gamilist.com', '$2b$10$aKwzw80eZeSBz/y1s6PQr..TFp/xjHpaAgnV1CrIYH84DR4v3ES6W', 'RPG lover and completionist');

INSERT INTO games (title, cover, rating, summary, igdb_id) VALUES
('Hollow Knight: Silksong', 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2g9s.jpg', 95, 'The sequel to Hollow Knight, featuring Hornet as the protagonist.', 151518),
('Hades', 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2i0f.jpg', 92, 'A rogue-like dungeon crawler where you defy the god of the dead.', 119171),
('Balatro', 'https://images.igdb.com/igdb/image/upload/t_cover_big/co7q3g.jpg', 89, 'A poker-inspired roguelike deck builder.', 290784),
('Celeste', 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1roi.jpg', 90, 'Help Madeline survive her inner demons on her journey to the top of Celeste Mountain.', 92076),
('Stardew Valley', 'https://images.igdb.com/igdb/image/upload/t_cover_big/co5w04.jpg', 88, 'You''ve inherited your grandfather''s old farm plot in Stardew Valley.', 7346);

INSERT INTO genres (name) VALUES ('Action'), ('Adventure'), ('RPG'), ('Platformer'), ('Roguelike'), ('Simulation');

INSERT INTO game_genres (game_id, genre_id)
SELECT g.id, ge.id FROM games g, genres ge
WHERE (g.title = 'Hollow Knight: Silksong' AND ge.name IN ('Action', 'Platformer'))
   OR (g.title = 'Hades' AND ge.name IN ('Action', 'Roguelike'))
   OR (g.title = 'Balatro' AND ge.name IN ('Roguelike'))
   OR (g.title = 'Celeste' AND ge.name IN ('Platformer', 'Adventure'))
   OR (g.title = 'Stardew Valley' AND ge.name IN ('Simulation', 'RPG'));

-- User 1 (rashad) - has multiple rated games
INSERT INTO user_game_lists (user_id, game_id, status, rating, completed_at)
SELECT 1, g.id, 'completed', 9.5, now() - INTERVAL '10 days'
FROM games g WHERE g.title = 'Celeste'
UNION ALL
SELECT 1, g.id, 'playing', 8.5, NULL
FROM games g WHERE g.title = 'Hades'
UNION ALL
SELECT 1, g.id, 'completed', 9.0, now() - INTERVAL '5 days'
FROM games g WHERE g.title = 'Stardew Valley'
UNION ALL
SELECT 1, g.id, 'plan_to_play', NULL, NULL
FROM games g WHERE g.title = 'Hollow Knight: Silksong';

-- User 2 (guest) - has some rated games
INSERT INTO user_game_lists (user_id, game_id, status, rating, completed_at)
SELECT 2, g.id, 'completed', 8.0, now() - INTERVAL '15 days'
FROM games g WHERE g.title = 'Hades'
UNION ALL
SELECT 2, g.id, 'playing', 7.5, NULL
FROM games g WHERE g.title = 'Balatro'
UNION ALL
SELECT 2, g.id, 'plan_to_play', NULL, NULL
FROM games g WHERE g.title = 'Celeste';

-- User 3 (jing) - has rated games
INSERT INTO user_game_lists (user_id, game_id, status, rating, completed_at)
SELECT 3, g.id, 'completed', 10.0, now() - INTERVAL '20 days'
FROM games g WHERE g.title = 'Stardew Valley'
UNION ALL
SELECT 3, g.id, 'completed', 8.5, now() - INTERVAL '12 days'
FROM games g WHERE g.title = 'Celeste'
UNION ALL
SELECT 3, g.id, 'playing', 9.5, NULL
FROM games g WHERE g.title = 'Hades';

INSERT INTO reviews (user_id, game_id, title, body, rating, likes_count)
SELECT 1, g.id, 'A masterpiece of platforming', 'Celeste is not just a game about climbing a mountain; it''s a deeply personal story about overcoming anxiety and depression. The tight controls and challenging levels are perfectly balanced with an encouraging narrative.', 9.5, 12
FROM games g WHERE g.title = 'Celeste';

INSERT INTO forum_threads (game_id, user_id, title, body, likes_count)
SELECT g.id, 1, 'When is Silksong coming out?!', 'It''s been years since the announcement. Anyone have any insider info?', 25
FROM games g WHERE g.title='Hollow Knight: Silksong'
UNION ALL
SELECT g.id, 2, 'Best weapons in Hades?', 'I keep dying to the final boss. What weapons do you all recommend?', 8
FROM games g WHERE g.title='Hades'
UNION ALL
SELECT g.id, 3, 'Stardew Valley co-op tips', 'Starting a new farm with friends. Any tips for multiplayer?', 15
FROM games g WHERE g.title='Stardew Valley';

INSERT INTO forum_replies (thread_id, user_id, body)
VALUES 
(1, 2, 'I heard rumors about a 2025 release but nothing confirmed yet.'),
(1, 3, 'Just keep waiting patiently... or go hollow trying!'),
(2, 1, 'The bow is OP once you get the right boons!'),
(2, 3, 'I love the spear personally. Great range and damage.');
