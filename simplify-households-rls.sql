-- SIMPLIFIED RLS policies - no recursion
-- Run this in your Supabase SQL Editor

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view households they belong to" ON households;
DROP POLICY IF EXISTS "Users can view members of their households" ON household_members;
DROP FUNCTION IF EXISTS is_household_member(UUID, UUID);

-- Create a simple function to check membership (SECURITY DEFINER bypasses RLS to avoid recursion)
CREATE OR REPLACE FUNCTION user_is_household_member(check_household_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM household_members
    WHERE household_id = check_household_id
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Households: Allow viewing if you're the creator OR a member
CREATE POLICY "Users can view households they belong to"
  ON households FOR SELECT
  USING (
    created_by = auth.uid()
    OR
    user_is_household_member(id)
  );

-- Household members: Allow viewing if you're the creator OR if it's your own membership row
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
    -- Can view your own membership row (so you can see households you belong to)
    user_id = auth.uid()
  );

