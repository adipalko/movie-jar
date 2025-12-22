-- Add vibe column to movies table
-- This stores the vibe tag from TMDB keywords

ALTER TABLE movies ADD COLUMN IF NOT EXISTS vibe TEXT;

