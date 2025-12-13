-- Add DELETE policy for household_invitations to allow cleaning up old invitations
-- Run this in your Supabase SQL Editor

-- Drop existing DELETE policy if it exists
DROP POLICY IF EXISTS "Household creators can delete invitations" ON household_invitations;

-- Allow household creators to delete invitations for their households
CREATE POLICY "Household creators can delete invitations"
  ON household_invitations FOR DELETE
  USING (
    household_id IN (
      SELECT id FROM households WHERE created_by = auth.uid()
    )
  );

