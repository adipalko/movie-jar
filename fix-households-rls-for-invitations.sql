-- Revert households RLS to the original simple version (from supabase-schema.sql)
-- This avoids all recursion issues
-- Run this in your Supabase SQL Editor

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can view households they belong to" ON households;

-- ORIGINAL SIMPLE VERSION: Only check created_by (no recursion possible)
CREATE POLICY "Users can view households they belong to"
  ON households FOR SELECT
  USING (
    -- Can view if you're the creator (no query to household_members = no recursion)
    created_by = auth.uid()
  );

