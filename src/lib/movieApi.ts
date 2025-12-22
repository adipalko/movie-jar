/**
 * Movie API Integration
 * 
 * This module handles fetching movie metadata from TMDB (The Movie Database) API.
 * The API key is stored in environment variables and should never be exposed in the frontend.
 * In a production app, this would be done on a backend server.
 * 
 * For this demo, we're using TMDB's API directly from the frontend.
 * Note: In production, you should proxy this through your backend to keep API keys secure.
 * 
 * Get a free API key at: https://www.themoviedb.org/settings/api
 */

import type { Movie } from '../types';

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

export interface TMDBMovieResult {
  id: number;
  title: string;
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  vote_average: number;
  genre_ids: number[];
}

export interface TMDBTVResult {
  id: number;
  name: string;
  first_air_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  vote_average: number;
  genre_ids: number[];
}

export interface TMDBSearchResponse {
  page: number;
  results: TMDBMovieResult[];
  total_pages: number;
  total_results: number;
}

export interface TMDBSearchTVResponse {
  page: number;
  results: TMDBTVResult[];
  total_pages: number;
  total_results: number;
}

export interface TMDBMovieDetails {
  id: number;
  title: string;
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  vote_average: number;
  runtime: number | null;
  genres: Array<{ id: number; name: string }>;
  imdb_id: string | null;
}

export interface TMDBTVDetails {
  id: number;
  name: string;
  first_air_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  vote_average: number;
  episode_run_time: number[] | null;
  genres: Array<{ id: number; name: string }>;
  number_of_seasons: number | null;
  number_of_episodes: number | null;
}

export interface TMDBVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  size: number;
  type: string;
  official: boolean;
}

export interface TMDBVideosResponse {
  id: number;
  results: TMDBVideo[];
}

export interface TMDBKeyword {
  id: number;
  name: string;
}

export interface TMDBKeywordsResponse {
  id: number;
  keywords: TMDBKeyword[];
}

export interface TMDBMovieSearchResult {
  id: number;
  title: string;
  year: string;
  poster_url: string | null;
  imdbID: string;
}

/**
 * Search for TV shows by title (returns multiple results)
 */
export async function searchTVShows(query: string): Promise<TMDBMovieSearchResult[]> {
  if (!TMDB_API_KEY || TMDB_API_KEY === 'your_tmdb_api_key_here') {
    console.warn('TMDB API key not configured');
    throw new Error('TMDB API key is not configured. Please add VITE_TMDB_API_KEY to your .env file.');
  }

  try {
    // Trim and normalize the query
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      return [];
    }

    // TMDB API search for TV shows (returns multiple results)
    const encodedQuery = encodeURIComponent(normalizedQuery);
    const searchUrl = `${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodedQuery}&language=en-US`;
    
    const searchResponse = await fetch(searchUrl);
    
    if (!searchResponse.ok) {
      const errorData = await searchResponse.json().catch(() => ({}));
      if (searchResponse.status === 401) {
        throw new Error('TMDB API key is invalid. Please check your API key.');
      }
      throw new Error(`TMDB API error: ${searchResponse.status} - ${errorData.status_message || 'Unknown error'}`);
    }

    const data: TMDBSearchTVResponse = await searchResponse.json();

    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }

    // Convert TMDB results to our format
    return data.results.map(tv => ({
      id: tv.id,
      title: tv.name,
      year: tv.first_air_date ? tv.first_air_date.split('-')[0] : 'Unknown',
      poster_url: tv.poster_path ? `${TMDB_IMAGE_BASE_URL}${tv.poster_path}` : null,
      imdbID: tv.id.toString(), // Use TMDB ID as identifier
    }));
  } catch (error: any) {
    console.error('Error searching TV shows from TMDB:', error);
    // Re-throw so the UI can handle it
    throw error;
  }
}

/**
 * Search for movies by title (returns multiple results)
 */
export async function searchMovies(query: string): Promise<TMDBMovieSearchResult[]> {
  if (!TMDB_API_KEY || TMDB_API_KEY === 'your_tmdb_api_key_here') {
    console.warn('TMDB API key not configured');
    throw new Error('TMDB API key is not configured. Please add VITE_TMDB_API_KEY to your .env file.');
  }

  try {
    // Trim and normalize the query
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      return [];
    }

    // TMDB API search (returns multiple results)
    const encodedQuery = encodeURIComponent(normalizedQuery);
    const searchUrl = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodedQuery}&language=en-US`;
    
    const searchResponse = await fetch(searchUrl);
    
    if (!searchResponse.ok) {
      const errorData = await searchResponse.json().catch(() => ({}));
      if (searchResponse.status === 401) {
        throw new Error('TMDB API key is invalid. Please check your API key.');
      }
      throw new Error(`TMDB API error: ${searchResponse.status} - ${errorData.status_message || 'Unknown error'}`);
    }

    const data: TMDBSearchResponse = await searchResponse.json();

    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }

    // Convert TMDB results to our format
    return data.results.map(movie => ({
      id: movie.id,
      title: movie.title,
      year: movie.release_date ? movie.release_date.split('-')[0] : 'Unknown',
      poster_url: movie.poster_path ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}` : null,
      imdbID: movie.id.toString(), // Use TMDB ID as identifier
    }));
  } catch (error: any) {
    console.error('Error searching movies from TMDB:', error);
    // Re-throw so the UI can handle it
    throw error;
  }
}

/**
 * Get keywords for a movie by TMDB ID
 */
export async function getMovieKeywords(tmdbId: string): Promise<string | null> {
  if (!TMDB_API_KEY || TMDB_API_KEY === 'your_tmdb_api_key_here') {
    return null;
  }

  try {
    const url = `${TMDB_BASE_URL}/movie/${tmdbId}/keywords?api_key=${TMDB_API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      return null;
    }

    const data: TMDBKeywordsResponse = await response.json();
    
    // Return the first keyword as the "vibe", or null if no keywords
    if (data.keywords && data.keywords.length > 0) {
      return data.keywords[0].name;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching movie keywords from TMDB:', error);
    return null;
  }
}

/**
 * Get keywords for a TV show by TMDB ID
 */
export async function getTVShowKeywords(tmdbId: string): Promise<string | null> {
  if (!TMDB_API_KEY || TMDB_API_KEY === 'your_tmdb_api_key_here') {
    return null;
  }

  try {
    const url = `${TMDB_BASE_URL}/tv/${tmdbId}/keywords?api_key=${TMDB_API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      return null;
    }

    const data: TMDBKeywordsResponse = await response.json();
    
    // Return the first keyword as the "vibe", or null if no keywords
    if (data.keywords && data.keywords.length > 0) {
      return data.keywords[0].name;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching TV show keywords from TMDB:', error);
    return null;
  }
}

/**
 * Get detailed TV show information by TMDB ID
 */
export async function getTVShowByTmdbId(tmdbId: string): Promise<Partial<Movie> | null> {
  if (!TMDB_API_KEY || TMDB_API_KEY === 'your_tmdb_api_key_here') {
    console.warn('TMDB API key not configured');
    return null;
  }

  try {
    const url = `${TMDB_BASE_URL}/tv/${tmdbId}?api_key=${TMDB_API_KEY}&language=en-US`;
    const response = await fetch(url);
    
    if (!response.ok) {
      await response.json().catch(() => ({})); // Consume response body
      if (response.status === 401) {
        throw new Error('TMDB API key is invalid or not activated.');
      }
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data: TMDBTVDetails = await response.json();

    if (!data.name) {
      return null;
    }

    // Fetch keywords for vibe
    const vibe = await getTVShowKeywords(tmdbId);
    return parseTMDBTVResponse(data, vibe);
  } catch (error) {
    console.error('Error fetching TV show from TMDB:', error);
    return null;
  }
}

/**
 * Get detailed movie information by TMDB ID
 */
export async function getMovieByTmdbId(tmdbId: string): Promise<Partial<Movie> | null> {
  if (!TMDB_API_KEY || TMDB_API_KEY === 'your_tmdb_api_key_here') {
    console.warn('TMDB API key not configured');
    return null;
  }

  try {
    const url = `${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=en-US`;
    const response = await fetch(url);
    
    if (!response.ok) {
      await response.json().catch(() => ({})); // Consume response body
      if (response.status === 401) {
        throw new Error('TMDB API key is invalid or not activated.');
      }
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data: TMDBMovieDetails = await response.json();

    if (!data.title) {
      return null;
    }

    // Fetch keywords for vibe
    const vibe = await getMovieKeywords(tmdbId);
    return parseTMDBResponse(data, vibe);
  } catch (error) {
    console.error('Error fetching movie from TMDB:', error);
    return null;
  }
}

/**
 * Parse TMDB TV response into Movie format
 */
function parseTMDBTVResponse(data: TMDBTVDetails, vibe: string | null = null): Partial<Movie> {
  const year = data.first_air_date && data.first_air_date !== ''
    ? parseInt(data.first_air_date.split('-')[0], 10)
    : null;

  const rating = data.vote_average && data.vote_average > 0
    ? data.vote_average.toFixed(1)
    : null;

  const genres = data.genres && data.genres.length > 0
    ? data.genres.map(g => g.name).join(', ')
    : null;

  // For TV shows, runtime is typically per episode
  const runtime = data.episode_run_time && data.episode_run_time.length > 0
    ? data.episode_run_time[0]
    : null;

  return {
    title: data.name,
    year,
    poster_url: data.poster_path ? `${TMDB_IMAGE_BASE_URL}${data.poster_path}` : null,
    rating,
    runtime_minutes: runtime,
    genres,
    plot: data.overview && data.overview !== '' ? data.overview : null,
    vibe,
    api_source: 'tmdb',
    api_id: data.id.toString(),
    content_type: 'tv',
  };
}

/**
 * Parse TMDB response into Movie format
 */
function parseTMDBResponse(data: TMDBMovieDetails, vibe: string | null = null): Partial<Movie> {
  const year = data.release_date && data.release_date !== ''
    ? parseInt(data.release_date.split('-')[0], 10)
    : null;

  const rating = data.vote_average && data.vote_average > 0
    ? data.vote_average.toFixed(1)
    : null;

  const genres = data.genres && data.genres.length > 0
    ? data.genres.map(g => g.name).join(', ')
    : null;

  return {
    title: data.title,
    year,
    poster_url: data.poster_path ? `${TMDB_IMAGE_BASE_URL}${data.poster_path}` : null,
    rating,
    runtime_minutes: data.runtime || null,
    genres,
    plot: data.overview && data.overview !== '' ? data.overview : null,
    vibe,
    api_source: 'tmdb',
    api_id: data.id.toString(),
    content_type: 'movie',
  };
}

/**
 * Get TV show videos (trailers, teasers, etc.) by TMDB ID
 */
export async function getTVShowVideos(tmdbId: string): Promise<TMDBVideo[]> {
  if (!TMDB_API_KEY || TMDB_API_KEY === 'your_tmdb_api_key_here') {
    console.warn('TMDB API key not configured');
    return [];
  }

  try {
    const url = `${TMDB_BASE_URL}/tv/${tmdbId}/videos?api_key=${TMDB_API_KEY}&language=en-US`;
    const response = await fetch(url);
    
    if (!response.ok) {
      await response.json().catch(() => ({})); // Consume response body
      return [];
    }

    const data: TMDBVideosResponse = await response.json();

    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }

    return data.results;
  } catch (error) {
    console.error('Error fetching TV show videos from TMDB:', error);
    return [];
  }
}

/**
 * Get movie videos (trailers, teasers, etc.) by TMDB ID
 */
export async function getMovieVideos(tmdbId: string): Promise<TMDBVideo[]> {
  if (!TMDB_API_KEY || TMDB_API_KEY === 'your_tmdb_api_key_here') {
    console.warn('TMDB API key not configured');
    return [];
  }

  try {
    const url = `${TMDB_BASE_URL}/movie/${tmdbId}/videos?api_key=${TMDB_API_KEY}&language=en-US`;
    const response = await fetch(url);
    
    if (!response.ok) {
      await response.json().catch(() => ({})); // Consume response body
      return [];
    }

    const data: TMDBVideosResponse = await response.json();

    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }

    return data.results;
  } catch (error) {
    console.error('Error fetching movie videos from TMDB:', error);
    return [];
  }
}

/**
 * Get trailer URL for a TV show (prefers official trailers, falls back to first trailer)
 */
export async function getTVShowTrailerUrl(tmdbId: string): Promise<string | null> {
  const videos = await getTVShowVideos(tmdbId);
  
  if (videos.length === 0) {
    return null;
  }

  // Prefer official trailers on YouTube
  const officialTrailer = videos.find(
    v => v.type === 'Trailer' && v.site === 'YouTube' && v.official
  );
  
  if (officialTrailer) {
    return `https://www.youtube.com/watch?v=${officialTrailer.key}`;
  }

  // Fall back to any trailer on YouTube
  const anyTrailer = videos.find(
    v => v.type === 'Trailer' && v.site === 'YouTube'
  );
  
  if (anyTrailer) {
    return `https://www.youtube.com/watch?v=${anyTrailer.key}`;
  }

  // Fall back to any YouTube video
  const anyYouTube = videos.find(v => v.site === 'YouTube');
  
  if (anyYouTube) {
    return `https://www.youtube.com/watch?v=${anyYouTube.key}`;
  }

  return null;
}

/**
 * Get trailer URL for a movie or TV show (prefers official trailers, falls back to first trailer)
 */
export async function getMovieTrailerUrl(tmdbId: string, contentType: 'movie' | 'tv' = 'movie'): Promise<string | null> {
  if (contentType === 'tv') {
    return getTVShowTrailerUrl(tmdbId);
  }
  
  const videos = await getMovieVideos(tmdbId);
  
  if (videos.length === 0) {
    return null;
  }

  // Prefer official trailers on YouTube
  const officialTrailer = videos.find(
    v => v.type === 'Trailer' && v.site === 'YouTube' && v.official
  );
  
  if (officialTrailer) {
    return `https://www.youtube.com/watch?v=${officialTrailer.key}`;
  }

  // Fall back to any trailer on YouTube
  const anyTrailer = videos.find(
    v => v.type === 'Trailer' && v.site === 'YouTube'
  );
  
  if (anyTrailer) {
    return `https://www.youtube.com/watch?v=${anyTrailer.key}`;
  }

  // Fall back to any YouTube video
  const anyYouTube = videos.find(v => v.site === 'YouTube');
  
  if (anyYouTube) {
    return `https://www.youtube.com/watch?v=${anyYouTube.key}`;
  }

  return null;
}

/**
 * Search for a movie or TV show by title using TMDB API (legacy - returns first match)
 */
export async function searchMovie(title: string, contentType: 'movie' | 'tv' = 'movie'): Promise<Partial<Movie> | null> {
  if (!TMDB_API_KEY) {
    console.warn('TMDB API key not configured');
    return null;
  }

  try {
    // Use search to get first result
    const results = contentType === 'tv' 
      ? await searchTVShows(title)
      : await searchMovies(title);
    if (results.length === 0) {
      return null;
    }

    // Get detailed info for first result
    const firstResult = results[0];
    if (firstResult.imdbID) {
      return contentType === 'tv'
        ? await getTVShowByTmdbId(firstResult.imdbID)
        : await getMovieByTmdbId(firstResult.imdbID);
    }

    return null;
  } catch (error) {
    console.error('Error fetching movie from TMDB:', error);
    return null;
  }
}
