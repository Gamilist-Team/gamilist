-- Add authentication fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Update existing users with default password (hashed 'password123')
-- bcrypt hash for 'password123' 
UPDATE users SET password_hash = '$2b$10$rYvLb2V6x5z5Z5Z5Z5Z5Z.3JZqJqx3xZqJqx3xZqJqx3xZqJqx3x' 
WHERE password_hash IS NULL;

-- Make password required for new users
ALTER TABLE users ALTER COLUMN password_hash SET NOT NULL;

