-- Fix app_users RLS to allow viewing other users' profiles when they're household members
-- Uses SECURITY DEFINER function to avoid recursion
-- Run this in your Supabase SQL Editor

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view their own profile" ON app_users;

-- Create a function to check if two users are in the same household
-- SECURITY DEFINER bypasses RLS to avoid recursion
CREATE OR REPLACE FUNCTION users_in_same_household(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM household_members hm1
    JOIN household_members hm2 ON hm1.household_id = hm2.household_id
    WHERE hm1.user_id = user1_id
    AND hm2.user_id = user2_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow users to view their own profile OR profiles of users in the same household
CREATE POLICY "Users can view their own profile"
  ON app_users FOR SELECT
  USING (
    -- Can view your own profile
    id = auth.uid()
    OR
    -- Can view profiles of users who are in the same household as you
    -- Using SECURITY DEFINER function to avoid recursion
    users_in_same_household(auth.uid(), app_users.id)
  );

