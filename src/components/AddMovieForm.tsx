import { useState, useEffect } from 'react';
import { addMovie } from '../lib/movies';
import { useHousehold } from '../contexts/HouseholdContext';
import { searchMovies, getMovieByTmdbId, type TMDBMovieSearchResult } from '../lib/movieApi';

interface AddMovieFormProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

export function AddMovieForm({ onSuccess, onCancel }: AddMovieFormProps) {
  const { activeHousehold } = useHousehold();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TMDBMovieSearchResult[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<TMDBMovieSearchResult | null>(null);
  const [personalNote, setPersonalNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setError(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setSearching(true);
      setError(null);
      try {
        const results = await searchMovies(searchQuery.trim());
        setSearchResults(results);
      } catch (err: any) {
        console.error('Search error:', err);
        setError(err.message || 'Failed to search movies. Please check your TMDB API key configuration.');
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  async function handleSelectMovie(movie: TMDBMovieSearchResult) {
    setSelectedMovie(movie);
    setSearchQuery(movie.title);
    setSearchResults([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeHousehold || !selectedMovie) return;

    setError(null);
    setWarning(null);
    setLoading(true);

    try {
      // Get full movie details using TMDB ID
      const movieDetails = await getMovieByTmdbId(selectedMovie.imdbID);
      
      if (!movieDetails) {
        throw new Error('Failed to fetch movie details');
      }
      
      // Pass the movie metadata directly to avoid re-searching
      await addMovie(activeHousehold.id, movieDetails.title || selectedMovie.title, personalNote.trim() || undefined, movieDetails);
      setSelectedMovie(null);
      setSearchQuery('');
      setPersonalNote('');
      onSuccess();
    } catch (err: any) {
      if (err.message?.includes('metadata')) {
        setWarning('Movie added, but metadata could not be loaded from API.');
        setSelectedMovie(null);
        setSearchQuery('');
        setPersonalNote('');
        onSuccess();
      } else {
        setError(err.message || 'Failed to add movie');
      }
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    setSelectedMovie(null);
    setSearchQuery('');
    setSearchResults([]);
    setPersonalNote('');
    setError(null);
    setWarning(null);
    onCancel?.();
  }

  if (!activeHousehold) {
    return null;
  }

  return (
    <div className="bg-slate-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-4">Add Movie</h2>
      
      {!selectedMovie ? (
        // Search phase
        <div className="space-y-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-slate-300 mb-1">
              Search for a Movie <span className="text-red-400">*</span>
            </label>
            <input
              id="search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Type movie title to search..."
              autoFocus
            />
            {searching && (
              <p className="mt-1 text-xs text-slate-400">Searching...</p>
            )}
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="max-h-96 overflow-y-auto space-y-2">
              {searchResults.map((movie) => (
                <button
                  key={movie.imdbID}
                  type="button"
                  onClick={() => handleSelectMovie(movie)}
                  className="w-full flex items-center gap-3 p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-left"
                >
                  {movie.poster_url ? (
                    <img
                      src={movie.poster_url}
                      alt={movie.title}
                      className="w-16 h-24 object-cover rounded"
                    />
                  ) : (
                    <div className="w-16 h-24 bg-slate-600 rounded flex items-center justify-center text-slate-400 text-xs">
                      No Image
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white truncate">{movie.title}</div>
                    <div className="text-sm text-slate-400">{movie.year}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-sm">
              <div className="font-semibold mb-1">Search Error</div>
              <div>{error}</div>
              {error.includes('API key') && (
                <div className="mt-2 text-xs">
                  Get a free API key at{' '}
                  <a 
                    href="https://www.themoviedb.org/settings/api" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline text-blue-400 hover:text-blue-300"
                  >
                    themoviedb.org
                  </a>
                  {' '}and add it to your .env file as VITE_TMDB_API_KEY
                </div>
              )}
            </div>
          )}

          {searchQuery && !searching && !error && searchResults.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              No movies found. Try a different search term.
            </div>
          )}

          {onCancel && (
            <button
              type="button"
              onClick={handleCancel}
              className="w-full py-2 px-4 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      ) : (
        // Confirmation phase - show selected movie and note field
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Selected Movie Preview */}
          <div className="flex gap-4 p-4 bg-slate-700 rounded-lg">
            {selectedMovie.poster_url ? (
              <img
                src={selectedMovie.poster_url}
                alt={selectedMovie.title}
                className="w-20 h-28 object-cover rounded"
              />
            ) : (
              <div className="w-20 h-28 bg-slate-600 rounded flex items-center justify-center text-slate-400 text-xs">
                No Image
              </div>
            )}
            <div className="flex-1">
              <div className="font-semibold text-white text-lg">{selectedMovie.title}</div>
              <div className="text-sm text-slate-400">{selectedMovie.year}</div>
              <button
                type="button"
                onClick={() => {
                  setSelectedMovie(null);
                  setSearchQuery('');
                }}
                className="mt-2 text-sm text-blue-400 hover:text-blue-300"
              >
                Change selection
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="note" className="block text-sm font-medium text-slate-300 mb-1">
              Personal Note (Optional)
            </label>
            <textarea
              id="note"
              value={personalNote}
              onChange={(e) => setPersonalNote(e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Why do you want to watch this? Any notes?"
            />
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {warning && (
            <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-200 px-4 py-3 rounded-lg text-sm">
              {warning}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Movie'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
