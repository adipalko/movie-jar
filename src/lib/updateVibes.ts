/**
 * Utility to update vibe tags for existing movies
 * This fetches keywords from TMDB and updates movies that don't have a vibe tag yet
 */

import { supabase } from './supabase';
import { getMovieKeywords, getTVShowKeywords } from './movieApi';

/**
 * Update vibe tags for all movies in a household that have a TMDB ID but no vibe
 */
export async function updateVibesForHousehold(householdId: string): Promise<{ updated: number; errors: number }> {
  // Get all movies with TMDB API source but no vibe
  const { data: movies, error: fetchError } = await supabase
    .from('movies')
    .select('id, api_source, api_id, content_type, title')
    .eq('household_id', householdId)
    .eq('api_source', 'tmdb')
    .not('api_id', 'is', null)
    .is('vibe', null);

  if (fetchError) {
    console.error('Error fetching movies:', fetchError);
    throw fetchError;
  }

  if (!movies || movies.length === 0) {
    return { updated: 0, errors: 0 };
  }

  let updated = 0;
  let errors = 0;

  // Update each movie with its vibe
  for (const movie of movies) {
    try {
      if (!movie.api_id) continue;

      // Fetch keywords based on content type
      const vibe = movie.content_type === 'tv'
        ? await getTVShowKeywords(movie.api_id)
        : await getMovieKeywords(movie.api_id);

      if (vibe) {
        // Update the movie with the vibe
        const { error: updateError } = await supabase
          .from('movies')
          .update({ vibe })
          .eq('id', movie.id);

        if (updateError) {
          console.error(`Error updating vibe for ${movie.title}:`, updateError);
          errors++;
        } else {
          updated++;
          console.log(`Updated vibe for ${movie.title}: ${vibe}`);
        }
      } else {
        console.log(`No keywords found for ${movie.title}`);
      }

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`Error processing ${movie.title}:`, error);
      errors++;
    }
  }

  return { updated, errors };
}

/**
 * Update vibe tags for all movies across all households
 * Use with caution - this will make many API calls
 */
export async function updateAllVibes(): Promise<{ updated: number; errors: number }> {
  // Get all households
  const { data: households, error: householdsError } = await supabase
    .from('households')
    .select('id');

  if (householdsError) {
    console.error('Error fetching households:', householdsError);
    throw householdsError;
  }

  if (!households || households.length === 0) {
    return { updated: 0, errors: 0 };
  }

  let totalUpdated = 0;
  let totalErrors = 0;

  for (const household of households) {
    const result = await updateVibesForHousehold(household.id);
    totalUpdated += result.updated;
    totalErrors += result.errors;
  }

  return { updated: totalUpdated, errors: totalErrors };
}

