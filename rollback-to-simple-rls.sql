-- ROLLBACK: Restore to the simple working RLS policies
-- This will fix the infinite recursion error
-- Run this in your Supabase SQL Editor

-- Step 1: Fix households SELECT policy (simplest possible)
DROP POLICY IF EXISTS "Users can view households they belong to" ON households;

CREATE POLICY "Users can view households they belong to"
  ON households FOR SELECT
  USING (
    -- ONLY check created_by - no queries to other tables = no recursion
    created_by = auth.uid()
  );

-- Step 2: Ensure households INSERT policy is simple
DROP POLICY IF EXISTS "Users can create households" ON households;

CREATE POLICY "Users can create households"
  ON households FOR INSERT
  WITH CHECK (
    -- ONLY check created_by - no queries to other tables = no recursion
    auth.uid() = created_by
  );

-- Step 3: Fix household_members policies (use EXISTS with direct household check)
DROP POLICY IF EXISTS "Users can view members of their households" ON household_members;
DROP POLICY IF EXISTS "Users can add members to their households" ON household_members;

-- SELECT: Can view if household creator is you
CREATE POLICY "Users can view members of their households"
  ON household_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM households h
      WHERE h.id = household_members.household_id
      AND h.created_by = auth.uid()
    )
  );

-- INSERT: Can add if household creator is you
CREATE POLICY "Users can add members to their households"
  ON household_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM households h
      WHERE h.id = household_members.household_id
      AND h.created_by = auth.uid()
    )
  );

