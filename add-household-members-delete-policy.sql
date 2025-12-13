-- Add DELETE policy for household_members to allow removing members
-- Run this in your Supabase SQL Editor
-- SIMPLIFIED: Only allow creator or self-removal to avoid recursion

-- Drop existing DELETE policy if it exists
DROP POLICY IF EXISTS "Users can remove members from their households" ON household_members;

-- Allow household creator to delete members, or users to remove themselves
-- Note: For admins removing others, we rely on application code to check permissions
-- and the RLS will allow it if they're the creator. For non-creator admins, we'd need
-- a database function to avoid recursion, but for now this is the safest approach.
CREATE POLICY "Users can remove members from their households"
  ON household_members FOR DELETE
  USING (
    -- Can delete if you're the household creator
    EXISTS (
      SELECT 1 FROM households h
      WHERE h.id = household_members.household_id
      AND h.created_by = auth.uid()
    )
    OR
    -- Can remove yourself
    user_id = auth.uid()
  );

