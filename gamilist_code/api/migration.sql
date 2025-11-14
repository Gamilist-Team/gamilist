-- Migration Script: 保留现有数据，添加新功能
-- 此脚本会添加新字段和新表，但不会删除现有数据

-- ========== 更新 users 表 ==========
-- 添加缺失的字段（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='email') THEN
        ALTER TABLE users ADD COLUMN email TEXT UNIQUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='password_hash') THEN
        ALTER TABLE users ADD COLUMN password_hash TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='avatar_url') THEN
        ALTER TABLE users ADD COLUMN avatar_url TEXT DEFAULT 'https://api.dicebear.com/7.x/avataaars/svg?seed=default';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='bio') THEN
        ALTER TABLE users ADD COLUMN bio TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='created_at') THEN
        ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT now();
    END IF;
END $$;

-- 为现有用户设置默认头像
UPDATE users SET avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || username 
WHERE avatar_url IS NULL;

-- 为现有用户设置默认密码 (password123)
UPDATE users SET password_hash = '$2b$10$aKwzw80eZeSBz/y1s6PQr..TFp/xjHpaAgnV1CrIYH84DR4v3ES6W'
WHERE password_hash IS NULL;

-- ========== 更新 games 表 ==========
-- 添加缺失的字段
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='games' AND column_name='igdb_id') THEN
        ALTER TABLE games ADD COLUMN igdb_id INT UNIQUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='games' AND column_name='slug') THEN
        ALTER TABLE games ADD COLUMN slug TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='games' AND column_name='summary') THEN
        ALTER TABLE games ADD COLUMN summary TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='games' AND column_name='release_date') THEN
        ALTER TABLE games ADD COLUMN release_date DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='games' AND column_name='created_at') THEN
        ALTER TABLE games ADD COLUMN created_at TIMESTAMP DEFAULT now();
    END IF;
END $$;

-- ========== 创建 user_game_lists 表（新的游戏列表系统）==========
CREATE TABLE IF NOT EXISTS user_game_lists (
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

-- 迁移 user_lists 和 list_items 的数据到新表（如果存在）
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='list_items') THEN
        INSERT INTO user_game_lists (user_id, game_id, status, created_at)
        SELECT ul.user_id, li.game_id, 
               CASE 
                 WHEN LOWER(ul.name) LIKE '%complet%' THEN 'completed'
                 WHEN LOWER(ul.name) LIKE '%play%' THEN 'playing'
                 WHEN LOWER(ul.name) LIKE '%plan%' THEN 'plan_to_play'
                 ELSE 'plan_to_play'
               END,
               now()
        FROM list_items li
        JOIN user_lists ul ON ul.id = li.list_id
        ON CONFLICT (user_id, game_id) DO NOTHING;
    END IF;
END $$;

-- ========== 更新 reviews 表 ==========
-- 添加缺失的字段
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='title') THEN
        ALTER TABLE reviews ADD COLUMN title TEXT DEFAULT 'Review';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='body') THEN
        ALTER TABLE reviews ADD COLUMN body TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='likes_count') THEN
        ALTER TABLE reviews ADD COLUMN likes_count INT DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='created_at') THEN
        ALTER TABLE reviews ADD COLUMN created_at TIMESTAMP DEFAULT now();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='updated_at') THEN
        ALTER TABLE reviews ADD COLUMN updated_at TIMESTAMP DEFAULT now();
    END IF;
END $$;

-- ========== 创建 review_likes 表 ==========
CREATE TABLE IF NOT EXISTS review_likes (
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  review_id INT REFERENCES reviews(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now(),
  PRIMARY KEY (user_id, review_id)
);

-- ========== 更新 forum_threads 表 ==========
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='forum_threads' AND column_name='likes_count') THEN
        ALTER TABLE forum_threads ADD COLUMN likes_count INT DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='forum_threads' AND column_name='updated_at') THEN
        ALTER TABLE forum_threads ADD COLUMN updated_at TIMESTAMP DEFAULT now();
    END IF;
END $$;

-- ========== 创建 forum_thread_likes 表 ==========
CREATE TABLE IF NOT EXISTS forum_thread_likes (
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  thread_id INT REFERENCES forum_threads(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now(),
  PRIMARY KEY (user_id, thread_id)
);

-- ========== 更新 forum_replies 表（如果存在）==========
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='forum_replies') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='forum_replies' AND column_name='updated_at') THEN
            ALTER TABLE forum_replies ADD COLUMN updated_at TIMESTAMP DEFAULT now();
        END IF;
    ELSE
        -- 创建 forum_replies 表（如果不存在）
        CREATE TABLE forum_replies (
          id SERIAL PRIMARY KEY,
          thread_id INT REFERENCES forum_threads(id) ON DELETE CASCADE,
          user_id INT REFERENCES users(id) ON DELETE SET NULL,
          body TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT now(),
          updated_at TIMESTAMP DEFAULT now()
        );
    END IF;
END $$;

-- ========== 添加一些示例数据（只在数据较少时）==========
DO $$ 
BEGIN
    -- 添加第三个用户（如果不存在）
    IF NOT EXISTS (SELECT 1 FROM users WHERE username = 'jing') THEN
        INSERT INTO users (username, email, bio) VALUES 
        ('jing', 'jing@gamilist.com', 'RPG lover and completionist');
    END IF;
    
    -- 添加更多游戏（如果少于5个）
    IF (SELECT COUNT(*) FROM games) < 5 THEN
        INSERT INTO games (title, cover, rating, summary) VALUES
        ('Celeste', 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1roi.jpg', 9.0, 'Help Madeline survive her inner demons on her journey to the top of Celeste Mountain.'),
        ('Stardew Valley', 'https://images.igdb.com/igdb/image/upload/t_cover_big/co5w04.jpg', 8.8, 'You''ve inherited your grandfather''s old farm plot in Stardew Valley.')
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- 添加一些示例游戏列表数据
    IF (SELECT COUNT(*) FROM user_game_lists) = 0 THEN
        INSERT INTO user_game_lists (user_id, game_id, status, rating, completed_at)
        SELECT 1, g.id, 'completed', 9.5, now() - INTERVAL '10 days'
        FROM games g WHERE g.title = 'Celeste'
        ON CONFLICT DO NOTHING;
        
        INSERT INTO user_game_lists (user_id, game_id, status)
        SELECT 1, g.id, 'playing'
        FROM games g WHERE g.title = 'Hades'
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- ========== 完成 ==========
SELECT 'Migration completed successfully!' AS status;

