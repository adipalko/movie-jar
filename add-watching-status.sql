-- Add 'watching' status to movies table
-- This allows TV shows to have a "watching now" status

-- Drop the existing constraint
ALTER TABLE movies DROP CONSTRAINT IF EXISTS movies_status_check;

-- Add the new constraint with 'watching' status
ALTER TABLE movies ADD CONSTRAINT movies_status_check CHECK (status IN ('unwatched', 'watching', 'watched'));

