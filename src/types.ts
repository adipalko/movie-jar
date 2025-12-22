// Database types matching Supabase schema

export interface AppUser {
  id: string;
  display_name: string;
  email: string | null;
  created_at: string;
}

export interface Household {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}

export interface HouseholdMember {
  id: string;
  household_id: string;
  user_id: string;
  role: 'admin' | 'member';
}

export type MovieStatus = 'unwatched' | 'watching' | 'watched';

export interface Movie {
  id: string;
  household_id: string;
  added_by_user_id: string;
  title: string;
  status: MovieStatus;
  personal_note: string | null;
  content_type: 'movie' | 'tv'; // 'movie' or 'tv'
  // API metadata
  api_source: string | null; // 'tmdb'
  api_id: string | null;
  year: number | null;
  poster_url: string | null;
  rating: string | null; // Can be numeric or text
  runtime_minutes: number | null;
  genres: string | null; // Comma-separated
  plot: string | null;
  vibe: string | null; // Vibe tag from TMDB keywords
  created_at: string;
}

// Extended types with joins
export interface MovieWithUser extends Movie {
  added_by_user?: AppUser;
}

// API response types (TMDB)
export interface TMDBMovieSearchResult {
  id: number;
  title: string;
  year: string;
  poster_url: string | null;
  imdbID: string;
}

export interface HouseholdInvitation {
  id: string;
  household_id: string;
  email: string;
  invited_by: string;
  status: 'pending' | 'accepted' | 'expired';
  created_at: string;
  expires_at: string;
  household_name?: string; // Stored directly to avoid RLS recursion
  households?: {
    id: string;
    name: string;
    created_by: string;
  };
}
