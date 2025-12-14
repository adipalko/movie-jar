-- Add content_type column to movies table
-- This allows the same table to store both movies and TV shows

ALTER TABLE movies ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'movie' CHECK (content_type IN ('movie', 'tv'));

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_movies_content_type ON movies(content_type);

-- Update existing movies to have content_type = 'movie' (if any are null)
UPDATE movies SET content_type = 'movie' WHERE content_type IS NULL;

