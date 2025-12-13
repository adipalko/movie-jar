/**
 * Movie API Integration
 * 
 * This module handles fetching movie metadata from OMDb API.
 * The API key is stored in environment variables and should never be exposed in the frontend.
 * In a production app, this would be done on a backend server.
 * 
 * For this demo, we're using OMDb's API directly from the frontend.
 * Note: In production, you should proxy this through your backend to keep API keys secure.
 * 
 * Get a free API key at: http://www.omdbapi.com/apikey.aspx
 */

import type { Movie, OMDbMovieResponse, OMDbSearchResponse } from '../types';

const OMDB_API_KEY = import.meta.env.VITE_OMDB_API_KEY;
const OMDB_BASE_URL = 'https://www.omdbapi.com';

/**
 * Search for movies by title (returns multiple results)
 */
export async function searchMovies(query: string): Promise<OMDbSearchResponse[]> {
  if (!OMDB_API_KEY || OMDB_API_KEY === 'your_omdb_api_key_here') {
    console.warn('OMDb API key not configured');
    throw new Error('OMDb API key is not configured. Please add VITE_OMDB_API_KEY to your .env file.');
  }

  try {
    // OMDb API search (returns multiple results)
    const searchUrl = `${OMDB_BASE_URL}/?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(query)}&type=movie`;
    const searchResponse = await fetch(searchUrl);
    
    if (!searchResponse.ok) {
      const errorData = await searchResponse.json().catch(() => ({}));
      if (searchResponse.status === 401) {
        throw new Error('OMDb API key is invalid or not activated. Please check your API key and make sure you activated it via email.');
      }
      throw new Error(`OMDb API error: ${searchResponse.status} - ${errorData.Error || 'Unknown error'}`);
    }

    const data = await searchResponse.json();

    // Check if movies were found
    if (data.Response === 'False') {
      // If it's an error message, throw it
      if (data.Error) {
        throw new Error(`OMDb API: ${data.Error}`);
      }
      return [];
    }

    if (!data.Search) {
      return [];
    }

    return data.Search;
  } catch (error: any) {
    console.error('Error searching movies from OMDb:', error);
    // Re-throw so the UI can handle it
    throw error;
  }
}

/**
 * Get detailed movie information by IMDb ID
 */
export async function getMovieByImdbId(imdbId: string): Promise<Partial<Movie> | null> {
  if (!OMDB_API_KEY || OMDB_API_KEY === 'your_omdb_api_key_here') {
    console.warn('OMDb API key not configured');
    return null;
  }

  try {
    const url = `${OMDB_BASE_URL}/?apikey=${OMDB_API_KEY}&i=${encodeURIComponent(imdbId)}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      await response.json().catch(() => ({})); // Consume response body
      if (response.status === 401) {
        throw new Error('OMDb API key is invalid or not activated.');
      }
      throw new Error(`OMDb API error: ${response.status}`);
    }

    const data: OMDbMovieResponse = await response.json();

    if (data.Response === 'False' || !data.Title) {
      return null;
    }

    return parseOMDbResponse(data);
  } catch (error) {
    console.error('Error fetching movie from OMDb:', error);
    return null;
  }
}

/**
 * Parse OMDb response into Movie format
 */
function parseOMDbResponse(data: OMDbMovieResponse): Partial<Movie> {
  const runtimeMinutes = data.Runtime && data.Runtime !== 'N/A'
    ? parseInt(data.Runtime.replace(/\s*min\s*/i, ''), 10)
    : null;

  const year = data.Year && data.Year !== 'N/A'
    ? parseInt(data.Year.split('–')[0], 10)
    : null;

  const rating = data.imdbRating && data.imdbRating !== 'N/A'
    ? parseFloat(data.imdbRating).toFixed(1)
    : null;

  return {
    title: data.Title,
    year,
    poster_url: data.Poster && data.Poster !== 'N/A' ? data.Poster : null,
    rating,
    runtime_minutes: runtimeMinutes,
    genres: data.Genre && data.Genre !== 'N/A' ? data.Genre : null,
    plot: data.Plot && data.Plot !== 'N/A' ? data.Plot : null,
    api_source: 'omdb',
    api_id: data.imdbID || null,
  };
}

/**
 * Search for a movie by title using OMDb API (legacy - returns first match)
 */
export async function searchMovie(title: string): Promise<Partial<Movie> | null> {
  if (!OMDB_API_KEY) {
    console.warn('OMDb API key not configured');
    return null;
  }

  try {
    // Use search to get first result
    const results = await searchMovies(title);
    if (results.length === 0) {
      return null;
    }

    // Get detailed info for first result
    const firstResult = results[0];
    if (firstResult.imdbID) {
      return await getMovieByImdbId(firstResult.imdbID);
    }

    return null;
  } catch (error) {
    console.error('Error fetching movie from OMDb:', error);
    return null;
  }
}
