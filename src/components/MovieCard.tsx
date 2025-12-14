import type { MovieWithUser } from '../types';

interface MovieCardProps {
  movie: MovieWithUser;
  onMarkWatched?: () => void;
  onMarkWatching?: () => void;
  onRemove?: () => void;
  onViewDetails?: () => void;
  featured?: boolean;
}

export function MovieCard({ movie, onMarkWatched, onMarkWatching, onRemove, onViewDetails, featured = false }: MovieCardProps) {
  if (featured) {
    // Featured movie - show full details
    return (
      <div className="bg-slate-800 rounded-lg overflow-hidden shadow-lg border-2 border-blue-500">
        <div className="flex flex-col md:flex-row">
          {movie.poster_url && (
            <div className="md:w-1/3 w-full aspect-[2/3] bg-slate-700">
              <img
                src={movie.poster_url}
                alt={movie.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1 p-4 md:p-6">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-bold text-white text-2xl">{movie.title}</h3>
            </div>

            <div className="flex flex-wrap gap-2 mb-3 text-sm text-slate-300">
              {movie.year && <span>{movie.year}</span>}
              {movie.rating && (
                <span className="bg-yellow-600/30 text-yellow-300 px-2 py-0.5 rounded">
                  ⭐ {movie.rating}
                </span>
              )}
              {movie.runtime_minutes && <span>{movie.runtime_minutes} min</span>}
            </div>

            {movie.genres && (
              <div className="mb-3">
                <span className="text-xs text-slate-400">{movie.genres}</span>
              </div>
            )}

            {movie.plot && (
              <p className="text-slate-300 mb-3 text-base">{movie.plot}</p>
            )}

            {movie.personal_note && (
              <div className="mb-3 p-2 bg-slate-700/50 rounded text-sm text-slate-300 italic">
                "{movie.personal_note}"
              </div>
            )}

            <div className="text-xs text-slate-400 mb-3">
              Added by {movie.added_by_user?.display_name || 'Unknown'}
            </div>

            <div className="flex gap-2 flex-wrap">
              {movie.status === 'unwatched' && onMarkWatching && movie.content_type === 'tv' && (
                <button
                  onClick={onMarkWatching}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-slate-300">Start</span>
                </button>
              )}
              {movie.status === 'unwatched' && onMarkWatched && (
                <button
                  onClick={onMarkWatched}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-300">Watched</span>
                </button>
              )}
              {onRemove && (
                <button
                  onClick={onRemove}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span className="text-slate-300">Remove</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Compact gallery view
  return (
    <div
      className="bg-slate-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow group cursor-pointer"
      onClick={() => onViewDetails?.()}
    >
      {movie.poster_url ? (
        <div className="aspect-[2/3] bg-slate-700 relative overflow-hidden">
          <img
            src={movie.poster_url}
            alt={movie.title}
            className="w-full h-full object-cover"
          />
          {/* Overlay with info on hover */}
          <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-between">
            <div className="flex-1 flex flex-col">
              {/* View Details button at top */}
              {onViewDetails && (
                <div className="mb-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDetails();
                    }}
                    className="w-full px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors"
                  >
                    View Details
                  </button>
                </div>
              )}
              
              {/* Movie info */}
              <div className="flex-1">
                <h3 className="font-bold text-white text-sm mb-1 line-clamp-2">{movie.title}</h3>
                <div className="flex items-center gap-2 text-xs text-slate-300 mb-2">
                  {movie.year && <span>{movie.year}</span>}
                  {movie.rating && (
                    <span className="text-yellow-300">⭐ {movie.rating}</span>
                  )}
                </div>
                {movie.genres && (
                  <p className="text-xs text-slate-400 line-clamp-1">{movie.genres}</p>
                )}
                {movie.plot && (
                  <p className="text-xs text-slate-300 mt-2 line-clamp-3">{movie.plot}</p>
                )}
              </div>
            </div>
            
            {/* Action buttons at bottom */}
            <div className="flex gap-1 flex-wrap mt-2">
              {movie.status === 'unwatched' && onMarkWatching && movie.content_type === 'tv' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkWatching();
                  }}
                  className="flex-1 px-2 py-1.5 bg-slate-700 hover:bg-slate-600 rounded transition-colors flex items-center justify-center gap-1.5"
                >
                  <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs text-slate-300">Start</span>
                </button>
              )}
              {movie.status === 'unwatched' && onMarkWatched && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkWatched();
                  }}
                  className="flex-1 px-2 py-1.5 bg-slate-700 hover:bg-slate-600 rounded transition-colors flex items-center justify-center gap-1.5"
                >
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-xs text-slate-300">Watched</span>
                </button>
              )}
              {onRemove && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Are you sure you want to remove this from the list?')) {
                      onRemove();
                    }
                  }}
                  className="flex-1 px-2 py-1.5 bg-slate-700 hover:bg-slate-600 rounded transition-colors flex items-center justify-center gap-1.5"
                >
                  <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span className="text-xs text-slate-300">Remove</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="aspect-[2/3] bg-slate-700 flex items-center justify-center p-3">
          <div className="text-center">
            <h3 className="font-bold text-white text-sm mb-1 line-clamp-2">{movie.title}</h3>
            <div className="text-xs text-slate-400">
              {movie.year && <div>{movie.year}</div>}
              {movie.rating && <div>⭐ {movie.rating}</div>}
            </div>
          </div>
        </div>
      )}
      {/* Title below poster for better visibility */}
      <div className="p-2">
        <h3 className="font-semibold text-white text-xs line-clamp-2 mb-1">{movie.title}</h3>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          {movie.year && <span>{movie.year}</span>}
          {movie.rating && <span className="text-yellow-400">⭐ {movie.rating}</span>}
        </div>
      </div>
    </div>
  );
}
