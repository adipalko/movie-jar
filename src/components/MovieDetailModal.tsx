import { useState, useEffect } from 'react';
import type { MovieWithUser } from '../types';
import { getMovieTrailerUrl } from '../lib/movieApi';

interface MovieDetailModalProps {
  movie: MovieWithUser;
  onClose: () => void;
  onMarkWatched?: () => void;
  onRemove?: () => void;
}

export function MovieDetailModal({ movie, onClose, onMarkWatched, onRemove }: MovieDetailModalProps) {
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
  const [loadingTrailer, setLoadingTrailer] = useState(false);

  useEffect(() => {
    // Fetch trailer URL if we have a TMDB ID
    if (movie.api_source === 'tmdb' && movie.api_id) {
      setLoadingTrailer(true);
      getMovieTrailerUrl(movie.api_id)
        .then(url => {
          setTrailerUrl(url);
        })
        .catch(err => {
          console.error('Error fetching trailer:', err);
        })
        .finally(() => {
          setLoadingTrailer(false);
        });
    }
  }, [movie.api_source, movie.api_id]);
  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 rounded-lg max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col md:flex-row">
          {/* Poster - smaller, more compact */}
          {movie.poster_url && (
            <div className="md:w-48 w-full md:h-auto h-64 bg-slate-700 flex-shrink-0 md:rounded-l-lg overflow-hidden">
              <img
                src={movie.poster_url}
                alt={movie.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Details */}
          <div className="flex-1 p-5 md:p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 pr-2">
                <h2 className="text-2xl font-bold text-white mb-2">{movie.title}</h2>
                <div className="flex flex-wrap gap-2 items-center text-sm text-slate-300">
                  {movie.year && <span>{movie.year}</span>}
                  {movie.rating && (
                    <span className="bg-yellow-600/30 text-yellow-300 px-2 py-0.5 rounded text-xs">
                      ⭐ {movie.rating}
                    </span>
                  )}
                  {movie.runtime_minutes && <span>{movie.runtime_minutes} min</span>}
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white transition-colors flex-shrink-0"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Genres */}
            {movie.genres && (
              <div className="mb-4">
                <span className="text-sm text-slate-400">{movie.genres}</span>
              </div>
            )}

            {/* Plot/Summary */}
            {movie.plot && (
              <div className="mb-4">
                <h3 className="text-base font-semibold text-white mb-2">Summary</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{movie.plot}</p>
              </div>
            )}

            {/* Trailer Link */}
            {loadingTrailer ? (
              <div className="mb-4">
                <div className="text-sm text-slate-400">Loading trailer...</div>
              </div>
            ) : trailerUrl ? (
              <div className="mb-4">
                <a
                  href={trailerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                  </svg>
                  Watch Trailer
                </a>
              </div>
            ) : null}

            {/* Personal Note */}
            {movie.personal_note && (
              <div className="mb-4 p-3 bg-slate-700/50 rounded-lg">
                <h3 className="text-sm font-semibold text-slate-300 mb-1">Personal Note</h3>
                <p className="text-slate-200 italic">"{movie.personal_note}"</p>
              </div>
            )}

            {/* Metadata */}
            <div className="mb-4 text-sm text-slate-400">
              <div>Added by {movie.added_by_user?.display_name || 'Unknown'}</div>
              {movie.created_at && (
                <div>Added on {new Date(movie.created_at).toLocaleDateString()}</div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 flex-wrap">
              {movie.status === 'unwatched' && onMarkWatched && (
                <button
                  onClick={() => {
                    onMarkWatched();
                    onClose();
                  }}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                >
                  Mark as Watched
                </button>
              )}
              {onRemove && (
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to remove this movie from the list?')) {
                      onRemove();
                      onClose();
                    }
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                >
                  Remove from List
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

