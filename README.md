# 🎬 Movie Jar

A shared household movie list app where you can add movies, randomly pick one for movie night, and track what you've watched.

## Features

- **Authentication**: Sign up/login with email and password via Supabase Auth
- **Households**: Create and manage shared households (e.g., "Adi & Jonathan", "Family")
- **Movie Lists**: Add movies to your household with automatic metadata from TMDB
- **TV Shows**: Toggle between Movie Jar and TV Jar to manage both movies and TV shows
- **Watching Status**: Track TV shows you're currently watching
- **Random Picker**: Pick a random unwatched movie/TV show for movie night
- **Status Tracking**: Mark movies/TV shows as watched or remove them from the list
- **Analytics**: Optional Google Analytics integration for usage tracking
- **Persistent Storage**: All data stored in Supabase (PostgreSQL)

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **Movie API**: TMDB (The Movie Database)
- **Routing**: React Router

## Prerequisites

- Node.js 18+ and npm/yarn
- A Supabase account and project
- A TMDB API key (free at [themoviedb.org](https://www.themoviedb.org/settings/api))

## Setup Instructions

### 1. Clone and Install

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_TMDB_API_KEY=your_tmdb_api_key
VITE_GA_MEASUREMENT_ID=your_google_analytics_measurement_id
```

You can find your Supabase credentials in your Supabase project settings under "API".

**Google Analytics (Optional):**
1. Create a Google Analytics 4 property at [analytics.google.com](https://analytics.google.com)
2. Get your Measurement ID (format: `G-XXXXXXXXXX`)
3. Add it to your `.env` file as `VITE_GA_MEASUREMENT_ID`
4. If not provided, the app will work fine without analytics (you'll see a console warning)

### 3. Set Up Supabase Database

Run the following SQL in your Supabase SQL Editor to create the required tables:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- App Users table (links to auth.users)
CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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
CREATE POLICY "Users can view households they belong to"
  ON households FOR SELECT
  USING (
    id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create households"
  ON households FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- RLS Policies for household_members
CREATE POLICY "Users can view members of their households"
  ON household_members FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can add members to their households"
  ON household_members FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM household_members 
      WHERE user_id = auth.uid() AND role = 'admin'
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
```

### 4. Run the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or the port Vite assigns).

## Project Structure

```
movie-jar/
├── src/
│   ├── components/          # React components
│   │   ├── AuthScreen.tsx
│   │   ├── ProfileSetup.tsx
│   │   ├── HouseholdSelection.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── WatchedMoviesScreen.tsx
│   │   ├── MovieCard.tsx
│   │   ├── AddMovieForm.tsx
│   │   └── Layout.tsx
│   ├── contexts/            # React contexts for state management
│   │   ├── AuthContext.tsx
│   │   └── HouseholdContext.tsx
│   ├── lib/                 # Utility functions and API clients
│   │   ├── supabase.ts      # Supabase client
│   │   ├── auth.ts          # Auth & app_users sync
│   │   ├── households.ts    # Household management
│   │   ├── movies.ts        # Movie operations
│   │   └── movieApi.ts      # OMDb API integration
│   ├── types.ts             # TypeScript type definitions
│   ├── App.tsx              # Main app component with routing
│   └── main.tsx             # Entry point
├── .env                     # Environment variables (create this)
├── package.json
└── README.md
```

## Key Features Explained

### Auth & App Users Sync

When a user signs up or logs in, the app checks if a corresponding row exists in `app_users`. If not, it prompts for a display name and creates the row. This ensures every authenticated user has a profile.

### Household Selection and Scoping

Users can belong to multiple households. The app remembers the active household in localStorage. All movie operations are scoped to the active household.

### Movie Add Flow + API Integration

When adding a movie:
1. User enters a title (and optional note)
2. The app calls OMDb API to search for the movie
3. Metadata (poster, year, rating, plot, etc.) is extracted
4. Movie is inserted into the database with all available metadata
5. If API fails, movie is still added with just the title

### Random Picker Logic

The random picker:
1. Fetches all unwatched movies for the active household
2. Randomly selects one (uniform distribution)
3. Displays it as a featured movie card
4. Allows "Pick Another" to select a different random movie

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## iOS App Development

This app is configured to run as an iOS app using Capacitor. The web app is wrapped in a native iOS container, allowing it to be distributed through the App Store.

### Prerequisites for iOS Development

- macOS with Xcode installed
- Apple Developer account (for device testing and App Store distribution)
- CocoaPods (usually installed automatically with Xcode)

### Building and Running on iOS

1. **Build the web app and sync to iOS:**
   ```bash
   npm run cap:sync
   ```
   This builds the web app and copies it to the iOS project.

2. **Open in Xcode:**
   ```bash
   npm run cap:open
   ```
   Or use the combined command:
   ```bash
   npm run cap:ios
   ```

3. **Run in Simulator or Device:**
   - In Xcode, select a simulator or connected device
   - Click the Run button (▶️) or press `Cmd+R`
   - The app will build and launch

### Development Workflow

When making changes to the web app:

1. Make your changes to React/TypeScript code
2. Run `npm run cap:sync` to rebuild and sync changes to iOS
3. The changes will be reflected when you run the app again in Xcode

**Note:** You don't need to reopen Xcode for every change - just sync and rerun.

### Available Scripts

- `npm run cap:sync` - Build web app and sync to iOS
- `npm run cap:open` - Open iOS project in Xcode
- `npm run cap:ios` - Build, sync, and open in Xcode (all-in-one)

### iOS Configuration

The iOS app configuration is in `capacitor.config.ts`:
- **App ID**: `com.moviejar.app`
- **App Name**: Movie Jar
- **Web Directory**: `dist`

To change the app ID or name, edit `capacitor.config.ts` and run `npm run cap:sync`.

### App Store Distribution

To distribute the app through the App Store:

1. In Xcode, select your target and go to "Signing & Capabilities"
2. Select your development team
3. Build for Archive: Product → Archive
4. Follow the App Store Connect workflow to submit

For more details, see the [Capacitor iOS documentation](https://capacitorjs.com/docs/ios).

## Notes

- **API Key Security**: In this demo, the OMDb API key is used from the frontend. In production, you should proxy API calls through a backend server to keep API keys secure.
- **Email Lookup**: The `addHouseholdMemberByEmail` function is not fully implemented because Supabase doesn't allow querying `auth.users` directly from the client. To implement this, you'd need to either:
  - Store email in `app_users` table, or
  - Create a Supabase Edge Function to look up users by email

## License

MIT
