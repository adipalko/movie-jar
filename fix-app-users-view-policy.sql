-- Fix app_users RLS to allow viewing other users' profiles when they're household members
-- Run this in your Supabase SQL Editor

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view their own profile" ON app_users;

-- Allow users to view their own profile OR profiles of users in the same household
-- This uses a simple join check - safe because we're querying household_members from app_users
CREATE POLICY "Users can view their own profile"
  ON app_users FOR SELECT
  USING (
    -- Can view your own profile
    id = auth.uid()
    OR
    -- Can view profiles of users who are in the same household as you
    -- Check if there's a household where both you and this user are members
    EXISTS (
      SELECT 1 
      FROM household_members hm1
      JOIN household_members hm2 ON hm1.household_id = hm2.household_id
      WHERE hm1.user_id = auth.uid()
      AND hm2.user_id = app_users.id
    )
  );

