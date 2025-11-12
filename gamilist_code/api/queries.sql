-- api/queries.sql
DROP TABLE IF EXISTS list_items, user_lists, forum_threads, game_genres, genres, games, users CASCADE;

CREATE TABLE users ( id SERIAL PRIMARY KEY, username TEXT UNIQUE NOT NULL );
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
CREATE TABLE user_lists (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL
);
CREATE TABLE list_items (
  id SERIAL PRIMARY KEY,
  list_id INT REFERENCES user_lists(id) ON DELETE CASCADE,
  game_id INT REFERENCES games(id) ON DELETE CASCADE,
  UNIQUE (list_id, game_id)
);

INSERT INTO users (username) VALUES ('rashad'), ('guest');

INSERT INTO games (title, cover, rating) VALUES
('Hollow Knight: Silksong', NULL, 9.5),
('Hades', NULL, 9.2),
('Balatro', NULL, 8.9);

INSERT INTO forum_threads (game_id, user_id, title, body)
SELECT g.id, 1, 'THIS GAME IS ASS!!', 'I played for 5 min and died too many times…'
FROM games g WHERE g.title='Hollow Knight: Silksong' LIMIT 1;
