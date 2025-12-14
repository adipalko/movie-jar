import { useState, useEffect } from 'react';
import { useHousehold } from '../contexts/HouseholdContext';
import { useContentType } from '../contexts/ContentTypeContext';
import { getRandomUnwatchedMovie, updateMovieStatus, deleteMovie, getHouseholdMovies } from '../lib/movies';
import { MovieCard } from './MovieCard';
import { MovieDetailModal } from './MovieDetailModal';
import { AddMovieForm } from './AddMovieForm';
import { HouseholdSettings } from './HouseholdSettings';
import { signOut } from '../lib/auth';
import type { MovieWithUser } from '../types';

type TVTab = 'unwatched' | 'watching' | 'watched';

export function HomeScreen() {
  const { activeHousehold, setActiveHousehold, households } = useHousehold();
  const { contentType, setContentType } = useContentType();
  const [featuredMovie, setFeaturedMovie] = useState<MovieWithUser | null>(null);
  const [unwatchedMovies, setUnwatchedMovies] = useState<MovieWithUser[]>([]);
  const [watchingMovies, setWatchingMovies] = useState<MovieWithUser[]>([]);
  const [watchedMovies, setWatchedMovies] = useState<MovieWithUser[]>([]);
  const [activeTab, setActiveTab] = useState<TVTab>('unwatched');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<MovieWithUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, unwatched: 0, watching: 0, watched: 0 });

  useEffect(() => {
    if (activeHousehold) {
      loadMovies();
      // Reset to 'unwatched' tab when switching content types
      if (contentType === 'tv') {
        setActiveTab('unwatched');
      }
    }
  }, [activeHousehold, contentType]);

  async function loadMovies() {
    if (!activeHousehold) return;

    setLoading(true);
    try {
      const unwatched = await getHouseholdMovies(activeHousehold.id, 'unwatched', contentType);
      const watched = await getHouseholdMovies(activeHousehold.id, 'watched', contentType);
      let watching: MovieWithUser[] = [];
      
      if (contentType === 'tv') {
        try {
          watching = await getHouseholdMovies(activeHousehold.id, 'watching', contentType);
        } catch (err) {
          console.warn('Error loading watching TV shows (may need to run migration):', err);
          // Continue with empty array if 'watching' status isn't supported yet
          watching = [];
        }
      }
      
      setUnwatchedMovies(unwatched);
      setWatchedMovies(watched);
      setWatchingMovies(watching);
      setStats({
        total: unwatched.length + watched.length + watching.length,
        unwatched: unwatched.length,
        watching: watching.length,
        watched: watched.length,
      });
      // Clear featured movie if it's not the current content type
      if (featuredMovie && featuredMovie.content_type !== contentType) {
        setFeaturedMovie(null);
      }
    } catch (error) {
      console.error('Error loading movies:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handlePickMovie() {
    if (!activeHousehold) return;

    setLoading(true);
    try {
      const movie = await getRandomUnwatchedMovie(activeHousehold.id, contentType);
      if (movie) {
        setFeaturedMovie(movie);
      } else {
        const contentTypeLabel = contentType === 'movie' ? 'movies' : 'TV shows';
        alert(`No unwatched ${contentTypeLabel} in this household. Add some first!`);
      }
    } catch (error) {
      console.error('Error picking movie:', error);
      const contentTypeLabel = contentType === 'movie' ? 'movie' : 'TV show';
      alert(`Failed to pick a ${contentTypeLabel}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkWatched(movieId: string) {
    try {
      await updateMovieStatus(movieId, 'watched');
      if (featuredMovie?.id === movieId) {
        setFeaturedMovie(null);
      }
      await loadMovies();
    } catch (error) {
      console.error('Error marking movie as watched:', error);
      alert('Failed to update movie');
    }
  }

  async function handleMarkWatching(movieId: string) {
    try {
      await updateMovieStatus(movieId, 'watching');
      if (featuredMovie?.id === movieId) {
        setFeaturedMovie(null);
      }
      await loadMovies();
    } catch (error) {
      console.error('Error marking TV show as watching:', error);
      alert('Failed to update TV show');
    }
  }

  async function handleRemoveMovie(movieId: string) {
    if (!confirm('Are you sure you want to remove this movie from the list?')) {
      return;
    }

    try {
      await deleteMovie(movieId);
      if (featuredMovie?.id === movieId) {
        setFeaturedMovie(null);
      }
      await loadMovies();
    } catch (error) {
      console.error('Error removing movie:', error);
      alert('Failed to remove movie');
    }
  }

  async function handlePickAnother() {
    if (!activeHousehold) return;

    // Filter out the current featured movie
    const otherMovies = unwatchedMovies.filter(m => m.id !== featuredMovie?.id);
    if (otherMovies.length === 0) {
      alert('No other unwatched movies available!');
      return;
    }

    const randomIndex = Math.floor(Math.random() * otherMovies.length);
    setFeaturedMovie(otherMovies[randomIndex]);
  }

  if (!activeHousehold) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Please select a household first.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 pb-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <div className="flex-shrink-0 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 whitespace-nowrap">
              {contentType === 'movie' ? '🎬 Movie Jar' : '📺 TV Jar'}
            </h1>
            <p className="text-slate-400 truncate">{activeHousehold.name}</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Toggle Switch */}
            <div className="flex items-center bg-slate-700 rounded-lg p-1">
              <button
                onClick={() => setContentType('movie')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  contentType === 'movie'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Movies
              </button>
              <button
                onClick={() => setContentType('tv')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  contentType === 'tv'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                TV Shows
              </button>
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className="px-3 sm:px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs sm:text-sm rounded-lg transition-colors"
              title="Household Settings"
            >
              <span className="hidden sm:inline">⚙️ Settings</span>
              <span className="sm:hidden">⚙️</span>
            </button>
            {households.length > 1 && (
              <select
                value={activeHousehold.id}
                onChange={(e) => {
                  const household = households.find(h => h.id === e.target.value);
                  if (household) setActiveHousehold(household);
                }}
                className="px-2 sm:px-3 py-2 bg-slate-700 text-white text-xs sm:text-sm rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {households.map(h => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            )}
            <button
              onClick={async () => {
                await signOut();
                setActiveHousehold(null);
              }}
              className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className={`grid gap-4 mb-6 ${contentType === 'tv' ? 'grid-cols-4' : 'grid-cols-3'}`}>
          <div className="bg-slate-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-sm text-slate-400">Total {contentType === 'movie' ? 'Movies' : 'TV Shows'}</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{stats.unwatched}</div>
            <div className="text-sm text-slate-400">In Jar</div>
          </div>
          {contentType === 'tv' && (
            <div className="bg-slate-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">{stats.watching}</div>
              <div className="text-sm text-slate-400">Watching</div>
            </div>
          )}
          <div className="bg-slate-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{stats.watched}</div>
            <div className="text-sm text-slate-400">Watched</div>
          </div>
        </div>

        {/* Pick Movie Button */}
        <div className="mb-6">
          <button
            onClick={handlePickMovie}
            disabled={loading || stats.unwatched === 0}
            className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xl font-bold rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
          >
            {loading ? 'Picking...' : contentType === 'movie' ? '🎲 Pick a Movie for Tonight' : '🎲 Pick My Next TV Show'}
          </button>
        </div>

        {/* Featured Movie */}
        {featuredMovie && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-3">Featured {contentType === 'movie' ? 'Movie' : 'TV Show'}</h2>
            <MovieCard
              movie={featuredMovie}
              featured
              onMarkWatched={() => handleMarkWatched(featuredMovie.id)}
              onMarkWatching={contentType === 'tv' ? () => handleMarkWatching(featuredMovie.id) : undefined}
              onRemove={() => handleRemoveMovie(featuredMovie.id)}
            />
            <div className="mt-3 text-center">
              <button
                onClick={handlePickAnother}
                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
              >
                Pick Another
              </button>
            </div>
          </div>
        )}

        {/* Add Movie Form */}
        {showAddForm ? (
          <div className="mb-6">
            <AddMovieForm
              onSuccess={() => {
                setShowAddForm(false);
                loadMovies();
              }}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full mb-6 py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
          >
            + Add {contentType === 'movie' ? 'Movie' : 'TV Show'}
          </button>
        )}

        {/* Movies/TV Shows List */}
        <div className="mb-6">
          {/* Tabs for TV Shows */}
          {contentType === 'tv' && (
            <div className="mb-4">
              <div className="flex gap-2 border-b border-slate-700">
                <button
                  onClick={() => setActiveTab('unwatched')}
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeTab === 'unwatched'
                      ? 'text-blue-400 border-b-2 border-blue-400'
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  In Jar ({unwatchedMovies.length})
                </button>
                <button
                  onClick={() => setActiveTab('watching')}
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeTab === 'watching'
                      ? 'text-purple-400 border-b-2 border-purple-400'
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  Watching Now ({watchingMovies.length})
                </button>
                <button
                  onClick={() => setActiveTab('watched')}
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeTab === 'watched'
                      ? 'text-green-400 border-b-2 border-green-400'
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  Watched ({watchedMovies.length})
                </button>
              </div>
            </div>
          )}
          {contentType === 'movie' && (
            <h2 className="text-xl font-semibold text-white mb-4">
              Unwatched Movies ({unwatchedMovies.length})
            </h2>
          )}

          {loading ? (
            <div className="text-slate-400 text-center py-8">Loading...</div>
          ) : (() => {
            let currentMovies: MovieWithUser[] = [];
            let emptyMessage = '';
            
            if (contentType === 'tv') {
              if (activeTab === 'unwatched') {
                currentMovies = unwatchedMovies;
                emptyMessage = 'No TV shows in jar. Add some to get started!';
              } else if (activeTab === 'watching') {
                currentMovies = watchingMovies;
                emptyMessage = 'No TV shows being watched right now.';
              } else {
                currentMovies = watchedMovies;
                emptyMessage = 'No watched TV shows yet.';
              }
            } else {
              currentMovies = unwatchedMovies;
              emptyMessage = 'No unwatched movies. Add some to get started!';
            }

            return currentMovies.length === 0 ? (
              <div className="bg-slate-800 rounded-lg p-8 text-center text-slate-400">
                {emptyMessage}
              </div>
            ) : (
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {currentMovies.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    onViewDetails={() => setSelectedMovie(movie)}
                    onMarkWatched={() => handleMarkWatched(movie.id)}
                    onMarkWatching={contentType === 'tv' ? () => handleMarkWatching(movie.id) : undefined}
                    onRemove={() => handleRemoveMovie(movie.id)}
                  />
                ))}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Movie Detail Modal */}
      {selectedMovie && (
        <MovieDetailModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          onMarkWatched={() => {
            handleMarkWatched(selectedMovie.id);
            setSelectedMovie(null);
          }}
          onMarkWatching={contentType === 'tv' ? () => {
            handleMarkWatching(selectedMovie.id);
            setSelectedMovie(null);
          } : undefined}
          onRemove={() => {
            handleRemoveMovie(selectedMovie.id);
            setSelectedMovie(null);
          }}
        />
      )}

      {/* Household Settings Modal */}
      {showSettings && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setShowSettings(false)}
        >
          <div
            className="bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <HouseholdSettings onClose={() => setShowSettings(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
