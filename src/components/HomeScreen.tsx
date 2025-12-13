import { useState, useEffect } from 'react';
import { useHousehold } from '../contexts/HouseholdContext';
import { getRandomUnwatchedMovie, updateMovieStatus, deleteMovie, getHouseholdMovies } from '../lib/movies';
import { MovieCard } from './MovieCard';
import { MovieDetailModal } from './MovieDetailModal';
import { AddMovieForm } from './AddMovieForm';
import { HouseholdSettings } from './HouseholdSettings';
import { signOut } from '../lib/auth';
import { useAuth } from '../contexts/AuthContext';
import type { MovieWithUser } from '../types';

export function HomeScreen() {
  const { activeHousehold, setActiveHousehold, households } = useHousehold();
  const { user } = useAuth();
  const [featuredMovie, setFeaturedMovie] = useState<MovieWithUser | null>(null);
  const [unwatchedMovies, setUnwatchedMovies] = useState<MovieWithUser[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<MovieWithUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, unwatched: 0, watched: 0 });

  useEffect(() => {
    if (activeHousehold) {
      loadMovies();
    }
  }, [activeHousehold]);

  async function loadMovies() {
    if (!activeHousehold) return;

    setLoading(true);
    try {
      const unwatched = await getHouseholdMovies(activeHousehold.id, 'unwatched');
      const watched = await getHouseholdMovies(activeHousehold.id, 'watched');
      setUnwatchedMovies(unwatched);
      setStats({
        total: unwatched.length + watched.length,
        unwatched: unwatched.length,
        watched: watched.length,
      });
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
      const movie = await getRandomUnwatchedMovie(activeHousehold.id);
      if (movie) {
        setFeaturedMovie(movie);
      } else {
        alert('No unwatched movies in this household. Add some first!');
      }
    } catch (error) {
      console.error('Error picking movie:', error);
      alert('Failed to pick a movie');
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">🎬 Movie Jar</h1>
            <p className="text-slate-400">{activeHousehold.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSettings(true)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
              title="Household Settings"
            >
              ⚙️ Settings
            </button>
            {households.length > 1 && (
              <select
                value={activeHousehold.id}
                onChange={(e) => {
                  const household = households.find(h => h.id === e.target.value);
                  if (household) setActiveHousehold(household);
                }}
                className="px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-sm text-slate-400">Total Movies</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{stats.unwatched}</div>
            <div className="text-sm text-slate-400">In Jar</div>
          </div>
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
            {loading ? 'Picking...' : '🎲 Pick a Movie for Tonight'}
          </button>
        </div>

        {/* Featured Movie */}
        {featuredMovie && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-3">Featured Movie</h2>
            <MovieCard
              movie={featuredMovie}
              featured
              onMarkWatched={() => handleMarkWatched(featuredMovie.id)}
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
            + Add Movie
          </button>
        )}

        {/* Unwatched Movies List */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Unwatched Movies ({unwatchedMovies.length})
          </h2>
          {loading ? (
            <div className="text-slate-400 text-center py-8">Loading...</div>
          ) : unwatchedMovies.length === 0 ? (
            <div className="bg-slate-800 rounded-lg p-8 text-center text-slate-400">
              No unwatched movies. Add some to get started!
            </div>
          ) : (
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {unwatchedMovies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onViewDetails={() => setSelectedMovie(movie)}
                  onMarkWatched={() => handleMarkWatched(movie.id)}
                  onRemove={() => handleRemoveMovie(movie.id)}
                />
              ))}
            </div>
          )}
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
