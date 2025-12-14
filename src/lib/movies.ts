/**
 * Movie Management
 * 
 * This module handles all movie-related operations:
 * - Adding movies (with API lookup)
 * - Fetching movies for a household
 * - Updating movie status
 * - Deleting movies
 */

import { supabase } from './supabase';
import { searchMovie } from './movieApi';
import type { Movie, MovieWithUser, MovieStatus } from '../types';

/**
 * Add a movie or TV show to a household
 * This function:
 * 1. Uses provided movie metadata (or searches if not provided)
 * 2. Inserts the movie into the database
 * 3. Returns the created movie or throws an error
 */
export async function addMovie(
  householdId: string,
  title: string,
  personalNote?: string,
  movieMetadata?: Partial<Movie> | null,
  contentType: 'movie' | 'tv' = 'movie'
): Promise<Movie> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('No authenticated user');
  }

  // Get current app user
  const { data: appUser } = await supabase
    .from('app_users')
    .select('id')
    .eq('id', user.id)
    .single();

  if (!appUser) {
    throw new Error('App user not found');
  }

  // If metadata not provided, try to fetch it from API
  let finalMetadata: Partial<Movie> | null = movieMetadata || null;
  if (!finalMetadata) {
    try {
      finalMetadata = await searchMovie(title, contentType);
    } catch (error) {
      console.warn('Failed to fetch movie metadata:', error);
      // Continue without metadata
    }
  }

  // Prepare movie data
  const movieData: Partial<Movie> = {
    household_id: householdId,
    added_by_user_id: appUser.id,
    title: finalMetadata?.title || title, // Use API title if available, otherwise use provided title
    status: 'unwatched',
    personal_note: personalNote || null,
    content_type: finalMetadata?.content_type || contentType,
    // API metadata (if available)
    api_source: finalMetadata?.api_source || null,
    api_id: finalMetadata?.api_id || null,
    year: finalMetadata?.year || null,
    poster_url: finalMetadata?.poster_url || null,
    rating: finalMetadata?.rating || null,
    runtime_minutes: finalMetadata?.runtime_minutes || null,
    genres: finalMetadata?.genres || null,
    plot: finalMetadata?.plot || null,
  };

  // Insert movie
  const { data, error } = await supabase
    .from('movies')
    .insert(movieData)
    .select()
    .single();

  if (error) {
    console.error('Error adding movie:', error);
    throw error;
  }

  return data;
}

/**
 * Get all movies/TV shows for a household, optionally filtered by status and content type
 */
export async function getHouseholdMovies(
  householdId: string,
  status?: MovieStatus,
  contentType?: 'movie' | 'tv'
): Promise<MovieWithUser[]> {
  let query = supabase
    .from('movies')
    .select(`
      *,
      added_by_user:app_users!movies_added_by_user_id_fkey (
        id,
        display_name,
        email,
        created_at
      )
    `)
    .eq('household_id', householdId)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  if (contentType) {
    query = query.eq('content_type', contentType);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching movies:', error);
    return [];
  }

  return (data || []) as MovieWithUser[];
}

/**
 * Get a random unwatched movie/TV show from a household
 */
export async function getRandomUnwatchedMovie(householdId: string, contentType: 'movie' | 'tv' = 'movie'): Promise<MovieWithUser | null> {
  const movies = await getHouseholdMovies(householdId, 'unwatched', contentType);
  
  if (movies.length === 0) {
    return null;
  }

  // Pick a random movie
  const randomIndex = Math.floor(Math.random() * movies.length);
  return movies[randomIndex];
}

/**
 * Update movie status
 */
export async function updateMovieStatus(movieId: string, status: MovieStatus): Promise<void> {
  const { error } = await supabase
    .from('movies')
    .update({ status })
    .eq('id', movieId);

  if (error) {
    console.error('Error updating movie status:', error);
    throw error;
  }
}

/**
 * Delete a movie
 */
export async function deleteMovie(movieId: string): Promise<void> {
  const { error } = await supabase
    .from('movies')
    .delete()
    .eq('id', movieId);

  if (error) {
    console.error('Error deleting movie:', error);
    throw error;
  }
}
