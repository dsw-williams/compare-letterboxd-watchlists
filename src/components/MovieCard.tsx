'use client';
import clsx from 'clsx';
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
      className={clsx(
        'cursor-pointer transition-[opacity,transform] duration-150 hover:scale-[1.03]',
        faded && 'opacity-40'
      )}
    >
      {/* Poster */}
      <div
        className={clsx(
          'w-full aspect-[2/3] rounded-lg overflow-hidden relative bg-bg-card',
          isFavourite && 'border-2 border-star-yellow'
        )}
        style={isFavourite ? { boxShadow: '0 0 18px rgba(245,158,11,0.35)' } : undefined}
      >
        {movie.poster_url ? (
          <img
            src={movie.poster_url}
            alt={movie.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-3 text-center text-text-tertiary text-13">
            {movie.title}
          </div>
        )}

        {/* Favourite label — top right */}
        {isFavourite && (
          <div className="absolute top-2 right-2 bg-star-yellow rounded-[4px] px-[6px] py-[3px] text-[10px] font-bold text-text-on-star max-w-[120px] whitespace-nowrap overflow-hidden text-ellipsis">
            {favouriteLabel(favouriteDisplayNames)}
          </div>
        )}

        {/* Friend avatars — bottom left */}
        <div className="absolute bottom-2 left-2 flex">
          {friendData.slice(0, 3).map((f, i) => (
            <div key={f.username} style={{ marginLeft: i > 0 ? '-8px' : '0', zIndex: i }}>
              {f.avatar_url ? (
                <img
                  src={f.avatar_url}
                  alt={f.username}
                  title={f.username}
                  width={22}
                  height={22}
                  className="rounded-full border-[1.5px] border-bg-primary object-cover block"
                />
              ) : (
                <div className="w-[22px] h-[22px] rounded-full bg-border-subtle border-[1.5px] border-bg-primary flex items-center justify-center text-[9px] font-bold text-text-secondary">
                  {f.username[0].toUpperCase()}
                </div>
              )}
            </div>
          ))}
          {friendData.length > 3 && (
            <div
              className="w-[22px] h-[22px] rounded-full bg-border-subtle border-[1.5px] border-bg-primary flex items-center justify-center text-[9px] font-bold text-text-secondary"
              style={{ marginLeft: '-8px', zIndex: 3 }}
            >
              +{friendData.length - 3}
            </div>
          )}
        </div>
      </div>

      {/* Below poster */}
      <div className="mt-[10px] pb-1">
        <div className="text-text-primary font-bold text-sm leading-[1.3] line-clamp-2">
          {movie.title}
        </div>
        {movie.director && (
          <div className="text-text-director text-13 mt-1 overflow-hidden text-ellipsis whitespace-nowrap">
            {movie.director}
          </div>
        )}
        <div className="text-text-tertiary text-xs mt-[3px] overflow-hidden text-ellipsis whitespace-nowrap">
          {movie.year}
          {movie.runtime ? ` · ${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : ''}
          {stars ? ` · ${stars}` : ''}
        </div>
      </div>
    </div>
  );
}
