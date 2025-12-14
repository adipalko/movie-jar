import { useState, useEffect } from 'react';
import { useHousehold } from '../contexts/HouseholdContext';
import { useContentType } from '../contexts/ContentTypeContext';
import { getHouseholdMovies, deleteMovie } from '../lib/movies';
import { MovieCard } from './MovieCard';
import { MovieDetailModal } from './MovieDetailModal';
import type { MovieWithUser } from '../types';

export function WatchedMoviesScreen() {
  const { activeHousehold } = useHousehold();
  const { contentType } = useContentType();
  const [watchedMovies, setWatchedMovies] = useState<MovieWithUser[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<MovieWithUser | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeHousehold) {
      loadMovies();
    }
  }, [activeHousehold, contentType]);

  async function loadMovies() {
    if (!activeHousehold) return;

    setLoading(true);
    try {
      const watched = await getHouseholdMovies(activeHousehold.id, 'watched', contentType);
      setWatchedMovies(watched);
    } catch (error) {
      console.error('Error loading movies:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveMovie(movieId: string) {
    if (!confirm('Are you sure you want to remove this movie from the list?')) {
      return;
    }

    try {
      await deleteMovie(movieId);
      await loadMovies();
    } catch (error) {
      console.error('Error removing movie:', error);
      alert('Failed to remove movie');
    }
  }

  if (!activeHousehold) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Please select a household first.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Watched {contentType === 'movie' ? 'Movies' : 'TV Shows'}</h1>

        {loading ? (
          <div className="text-slate-400 text-center py-8">Loading...</div>
        ) : watchedMovies.length === 0 ? (
          <div className="bg-slate-800 rounded-lg p-8 text-center text-slate-400">
            No watched {contentType === 'movie' ? 'movies' : 'TV shows'} yet.
          </div>
        ) : (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {watchedMovies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onViewDetails={() => setSelectedMovie(movie)}
                onRemove={() => handleRemoveMovie(movie.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Movie Detail Modal */}
      {selectedMovie && (
        <MovieDetailModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          onRemove={() => {
            handleRemoveMovie(selectedMovie.id);
            setSelectedMovie(null);
          }}
        />
      )}
    </div>
  );
}
