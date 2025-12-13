-- Add email column to app_users table for inviting users
-- Run this in your Supabase SQL Editor

-- Add email column
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS email TEXT;

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_app_users_email ON app_users(email) WHERE email IS NOT NULL;

-- Update existing users with their email from auth.users
-- Note: This requires a one-time migration. For new users, email will be set automatically.
UPDATE app_users 
SET email = (
  SELECT email FROM auth.users WHERE auth.users.id = app_users.id
)
WHERE email IS NULL;

