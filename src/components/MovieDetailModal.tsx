import { useState, useEffect } from 'react';
import type { MovieWithUser } from '../types';
import { getMovieTrailerUrl } from '../lib/movieApi';

interface MovieDetailModalProps {
  movie: MovieWithUser;
  onClose: () => void;
  onMarkWatched?: () => void;
  onMarkWatching?: () => void;
  onRemove?: () => void;
}

function TrailerModal({ trailerUrl, onClose }: { trailerUrl: string; onClose: () => void }) {
  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string): string | null => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  const videoId = trailerUrl ? getYouTubeVideoId(trailerUrl) : null;

  if (!videoId) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 rounded-lg max-w-4xl w-full aspect-video relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-slate-300 transition-colors"
          aria-label="Close trailer"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          title="Movie Trailer"
          className="w-full h-full rounded-lg"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}

export function MovieDetailModal({ movie, onClose, onMarkWatched, onMarkWatching, onRemove }: MovieDetailModalProps) {
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
  const [loadingTrailer, setLoadingTrailer] = useState(false);
  const [showTrailerModal, setShowTrailerModal] = useState(false);

  useEffect(() => {
    // Fetch trailer URL if we have a TMDB ID
    if (movie.api_source === 'tmdb' && movie.api_id) {
      setLoadingTrailer(true);
      getMovieTrailerUrl(movie.api_id, movie.content_type || 'movie')
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
  }, [movie.api_source, movie.api_id, movie.content_type]);
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

            {/* Trailer Button */}
            {loadingTrailer ? (
              <div className="mb-4">
                <div className="text-sm text-slate-400">Loading trailer...</div>
              </div>
            ) : trailerUrl ? (
              <div className="mb-4">
                <button
                  onClick={() => setShowTrailerModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                  </svg>
                  Watch Trailer
                </button>
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
              {movie.status === 'unwatched' && onMarkWatching && movie.content_type === 'tv' && (
                <button
                  onClick={() => {
                    onMarkWatching();
                    onClose();
                  }}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors flex items-center gap-2.5"
                >
                  <svg className="w-5 h-5 text-slate-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-slate-300 font-medium">Start</span>
                </button>
              )}
              {movie.status === 'unwatched' && onMarkWatched && (
                <button
                  onClick={() => {
                    onMarkWatched();
                    onClose();
                  }}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors flex items-center gap-2.5"
                >
                  <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-300 font-medium">Watched</span>
                </button>
              )}
              {onRemove && (
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to remove this from the list?')) {
                      onRemove();
                      onClose();
                    }
                  }}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors flex items-center gap-2.5"
                >
                  <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span className="text-slate-300 font-medium">Remove</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Trailer Modal */}
      {showTrailerModal && trailerUrl && (
        <TrailerModal
          trailerUrl={trailerUrl}
          onClose={() => setShowTrailerModal(false)}
        />
      )}
    </div>
  );
}

