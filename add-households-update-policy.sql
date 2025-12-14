-- Add UPDATE policy for households table
-- Allows household creators to update their household name

DROP POLICY IF EXISTS "Users can update their households" ON households;

CREATE POLICY "Users can update their households"
  ON households FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

