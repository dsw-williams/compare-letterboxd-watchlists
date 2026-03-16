'use client';
import { Movie, Friend } from '@/lib/types';

interface MovieCardProps {
  movie: Movie;
  friends: string[]; // usernames who have this on watchlist
  totalSelected: number;
  allFriends: Friend[];
  faded?: boolean;
}

function starsFromRating(rating: number | null): string {
  if (rating === null) return '';
  const stars = Math.round(rating / 2);
  return '★'.repeat(stars) + '☆'.repeat(5 - stars);
}

export default function MovieCard({ movie, friends, totalSelected, allFriends, faded }: MovieCardProps) {
  const friendData = allFriends.filter((f) => friends.includes(f.username));

  return (
    <div
      onClick={() => window.open(movie.letterboxd_url, '_blank')}
      style={{
        cursor: 'pointer',
        opacity: faded ? 0.4 : 1,
        transition: 'opacity 0.15s, transform 0.15s',
      }}
      onMouseEnter={(e) => {
        if (window.matchMedia('(hover: hover)').matches)
          (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.03)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
      }}
    >
      {/* Poster */}
      <div style={{
        width: '100%',
        aspectRatio: '2 / 3',
        borderRadius: '8px',
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#1e2128',
      }}>
        {movie.poster_url ? (
          <img
            src={movie.poster_url}
            alt={movie.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '12px', textAlign: 'center',
            color: '#6b7280', fontSize: '13px',
          }}>
            {movie.title}
          </div>
        )}

        {/* Star rating badge — top left */}
        {movie.rating !== null && (
          <div style={{
            position: 'absolute', top: '8px', left: '8px',
            backgroundColor: 'rgba(0,0,0,0.6)',
            borderRadius: '99px',
            padding: '2px 8px',
            fontSize: '11px',
            color: '#f59e0b',
            letterSpacing: '1px',
          }}>
            {starsFromRating(movie.rating)}
          </div>
        )}

        {/* Overlap badge — top right */}
        <div style={{
          position: 'absolute', top: '8px', right: '8px',
          backgroundColor: '#f97316',
          borderRadius: '99px',
          padding: '2px 7px',
          fontSize: '11px',
          fontWeight: 700,
          color: '#ffffff',
        }}>
          {friends.length}/{totalSelected}
        </div>

        {/* Friend avatars — bottom left */}
        <div style={{
          position: 'absolute', bottom: '8px', left: '8px',
          display: 'flex',
        }}>
          {friendData.slice(0, 3).map((f, i) => (
            <div key={f.username} style={{ marginLeft: i > 0 ? '-8px' : '0', zIndex: i }}>
              {f.avatar_url ? (
                <img
                  src={f.avatar_url}
                  alt={f.username}
                  title={f.username}
                  width={22}
                  height={22}
                  style={{
                    borderRadius: '50%',
                    border: '1.5px solid #141414',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              ) : (
                <div style={{
                  width: '22px', height: '22px', borderRadius: '50%',
                  backgroundColor: '#2a2d35', border: '1.5px solid #141414',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '9px', fontWeight: 700, color: '#9ba3af',
                }}>
                  {f.username[0].toUpperCase()}
                </div>
              )}
            </div>
          ))}
          {friendData.length > 3 && (
            <div style={{
              marginLeft: '-8px', zIndex: 3,
              width: '22px', height: '22px', borderRadius: '50%',
              backgroundColor: '#2a2d35', border: '1.5px solid #141414',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '9px', fontWeight: 700, color: '#9ba3af',
            }}>
              +{friendData.length - 3}
            </div>
          )}
        </div>
      </div>

      {/* Below poster */}
      <div style={{ marginTop: '10px', paddingBottom: '4px' }}>
        <div style={{
          color: '#ffffff', fontWeight: 700, fontSize: '14px',
          lineHeight: 1.3, maxHeight: '37px',
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {movie.title}
        </div>
        {movie.director && (
          <div style={{
            color: '#c9d1d9', fontSize: '13px', marginTop: '4px',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {movie.director}
          </div>
        )}
        <div style={{
          color: '#6b7280', fontSize: '12px', marginTop: '3px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {movie.year}
          {movie.runtime ? ` · ${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : ''}
        </div>
      </div>
    </div>
  );
}
