-- Fix RLS policies to allow household members to view their households
-- Run this in your Supabase SQL Editor
-- Uses SECURITY DEFINER function to avoid recursion

-- First, drop the problematic policy
DROP POLICY IF EXISTS "Users can view members of their households" ON household_members;

-- Create a function to check membership (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION is_household_member(check_household_id UUID, check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM household_members
    WHERE household_id = check_household_id
    AND user_id = check_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the policy using the function
CREATE POLICY "Users can view members of their households"
  ON household_members FOR SELECT
  USING (
    -- Can view if you're the household creator
    EXISTS (
      SELECT 1 FROM households h
      WHERE h.id = household_members.household_id
      AND h.created_by = auth.uid()
    )
    OR
    -- Can view if you're a member (using function to avoid recursion)
    is_household_member(household_members.household_id, auth.uid())
  );

