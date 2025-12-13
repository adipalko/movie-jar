-- Fix for infinite recursion - ULTRA SIMPLE VERSION
-- The problem: households SELECT policy queries household_members, causing recursion
-- Solution: Fix BOTH policies to never create circular dependencies

-- Step 1: Fix households SELECT policy (this was causing the recursion!)
DROP POLICY IF EXISTS "Users can view households they belong to" ON households;

CREATE POLICY "Users can view households they belong to"
  ON households FOR SELECT
  USING (
    -- Can view if you're the creator (no query to household_members)
    created_by = auth.uid()
  );

-- Step 2: Fix household_members policies (simplified)
DROP POLICY IF EXISTS "Users can view members of their households" ON household_members;
DROP POLICY IF EXISTS "Admins can add members to their households" ON household_members;
DROP POLICY IF EXISTS "Users can add members to their households" ON household_members;
DROP FUNCTION IF EXISTS is_household_admin(UUID, UUID);

-- SELECT: Can view if household creator is you (direct check, no subquery needed)
CREATE POLICY "Users can view members of their households"
  ON household_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM households h
      WHERE h.id = household_members.household_id
      AND h.created_by = auth.uid()
    )
  );

-- INSERT: Can add if household creator is you (direct check, no subquery needed)
CREATE POLICY "Users can add members to their households"
  ON household_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM households h
      WHERE h.id = household_members.household_id
      AND h.created_by = auth.uid()
    )
  );