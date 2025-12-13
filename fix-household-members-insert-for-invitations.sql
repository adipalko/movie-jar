-- Fix household_members INSERT policy to allow accepting invitations
-- Run this in your Supabase SQL Editor
-- MINIMAL CHANGE: Allow users to add themselves (safe - they can only add themselves)

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Users can add members to their households" ON household_members;

-- Allow: 1) Household creator to add anyone, 2) Users to add themselves
CREATE POLICY "Users can add members to their households"
  ON household_members FOR INSERT
  WITH CHECK (
    -- Can add if you're the household creator
    EXISTS (
      SELECT 1 FROM households h
      WHERE h.id = household_members.household_id
      AND h.created_by = auth.uid()
    )
    OR
    -- Can add yourself (safe - you can only add yourself, not others)
    user_id = auth.uid()
  );

