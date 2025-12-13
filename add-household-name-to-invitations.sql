-- Add household_name column to household_invitations to avoid RLS recursion
-- Run this in your Supabase SQL Editor

ALTER TABLE household_invitations 
ADD COLUMN IF NOT EXISTS household_name TEXT;

-- Update existing invitations with household names
UPDATE household_invitations hi
SET household_name = h.name
FROM households h
WHERE hi.household_id = h.id
AND hi.household_name IS NULL;

