'use client';
import { Movie, Friend } from '@/lib/types';

interface MovieCardProps {
  movie: Movie;
  friends: string[]; // usernames who have this on watchlist
  totalSelected: number;
  allFriends: Friend[];
  faded?: boolean;
  favouritedBy?: string[]; // usernames whose top-4 this movie is in
}

function starsFromRating(rating: number | null): string {
  if (rating === null) return '';
  const val = rating / 2;
  const full = Math.floor(val);
  const half = val - full >= 0.5;
  return '★'.repeat(full) + (half ? '½' : '');
}

function favouriteLabel(usernames: string[]): string {
  if (usernames.length === 1) return `${usernames[0]}'s favourite`;
  return `${usernames[0]} +${usernames.length - 1}'s favourite`;
}

export default function MovieCard({ movie, friends, totalSelected, allFriends, faded, favouritedBy = [] }: MovieCardProps) {
  const friendData = allFriends.filter((f) => friends.includes(f.username));
  const isFavourite = favouritedBy.length > 0;
  const favouriteDisplayNames = favouritedBy.map(
    (u) => allFriends.find((f) => f.username === u)?.custom_name ?? u
  );

  const stars = starsFromRating(movie.rating);

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
        ...(isFavourite && {
          border: '2px solid #f59e0b',
          boxShadow: '0 0 18px rgba(245,158,11,0.35)',
        }),
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

        {/* Favourite label — top right */}
        {isFavourite && (
          <div style={{
            position: 'absolute', top: '8px', right: '8px',
            backgroundColor: '#f59e0b',
            borderRadius: '4px',
            padding: '3px 6px',
            fontSize: '10px',
            fontWeight: 700,
            color: '#1a1a1a',
            maxWidth: '120px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {favouriteLabel(favouriteDisplayNames)}
          </div>
        )}

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
          {stars ? ` · ${stars}` : ''}
        </div>
      </div>
    </div>
  );
}
