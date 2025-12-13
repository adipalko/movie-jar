-- Movie Jar - Supabase Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- App Users table (links to auth.users)
CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_app_users_email ON app_users(email) WHERE email IS NOT NULL;

-- Households table
CREATE TABLE IF NOT EXISTS households (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Household Members table
CREATE TABLE IF NOT EXISTS household_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  UNIQUE(household_id, user_id)
);

-- Movies table
CREATE TABLE IF NOT EXISTS movies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  added_by_user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'unwatched' CHECK (status IN ('unwatched', 'watched')),
  personal_note TEXT,
  -- API metadata
  api_source TEXT,
  api_id TEXT,
  year INTEGER,
  poster_url TEXT,
  rating TEXT,
  runtime_minutes INTEGER,
  genres TEXT,
  plot TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_household_members_user_id ON household_members(user_id);
CREATE INDEX IF NOT EXISTS idx_household_members_household_id ON household_members(household_id);
CREATE INDEX IF NOT EXISTS idx_movies_household_id ON movies(household_id);
CREATE INDEX IF NOT EXISTS idx_movies_status ON movies(status);
CREATE INDEX IF NOT EXISTS idx_movies_added_by_user_id ON movies(added_by_user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for app_users
CREATE POLICY "Users can view their own profile"
  ON app_users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON app_users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON app_users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for households
-- SIMPLIFIED: Only check created_by, never query household_members (avoids recursion)
CREATE POLICY "Users can view households they belong to"
  ON households FOR SELECT
  USING (
    -- Can view if you're the creator (no query to household_members = no recursion)
    created_by = auth.uid()
  );

CREATE POLICY "Users can create households"
  ON households FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- RLS Policies for household_members
-- ULTRA SIMPLE: Use EXISTS with direct household check (avoids recursion)

-- SELECT Policy: Check if you're the creator using EXISTS
CREATE POLICY "Users can view members of their households"
  ON household_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM households h
      WHERE h.id = household_members.household_id
      AND h.created_by = auth.uid()
    )
  );

-- INSERT Policy: Check if you're the creator using EXISTS
CREATE POLICY "Users can add members to their households"
  ON household_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM households h
      WHERE h.id = household_members.household_id
      AND h.created_by = auth.uid()
    )
  );

-- RLS Policies for movies
CREATE POLICY "Users can view movies in their households"
  ON movies FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add movies to their households"
  ON movies FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
    AND auth.uid() = added_by_user_id
  );

CREATE POLICY "Users can update movies in their households"
  ON movies FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete movies in their households"
  ON movies FOR DELETE
  USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );
