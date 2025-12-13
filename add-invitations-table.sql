-- Add household_invitations table for pending invitations
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS household_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  UNIQUE(household_id, email)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_household_invitations_email ON household_invitations(email);
CREATE INDEX IF NOT EXISTS idx_household_invitations_household_id ON household_invitations(household_id);
CREATE INDEX IF NOT EXISTS idx_household_invitations_status ON household_invitations(status);

-- Enable RLS
ALTER TABLE household_invitations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to allow re-running this script)
DROP POLICY IF EXISTS "Anyone can view invitations by ID" ON household_invitations;
DROP POLICY IF EXISTS "Users can view invitations for their households" ON household_invitations;
DROP POLICY IF EXISTS "Household creators can create invitations" ON household_invitations;
DROP POLICY IF EXISTS "Users can accept invitations for their email" ON household_invitations;

-- RLS Policies for household_invitations
-- Allow anyone to view invitations by ID (for accepting invitations)
CREATE POLICY "Anyone can view invitations by ID"
  ON household_invitations FOR SELECT
  USING (true);

-- Also allow household members to view their household's invitations
CREATE POLICY "Users can view invitations for their households"
  ON household_invitations FOR SELECT
  USING (
    household_id IN (
      SELECT id FROM households WHERE created_by = auth.uid()
    )
    OR household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Household creators can create invitations"
  ON household_invitations FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT id FROM households WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can accept invitations for their email"
  ON household_invitations FOR UPDATE
  USING (
    email IN (
      SELECT email FROM app_users WHERE id = auth.uid()
    )
  );

