'use client';
import MovieCard from './MovieCard';
import { Movie, Friend } from '@/lib/types';

interface OverlapEntry {
  movie: Movie;
  friends: string[];
}

interface MovieGridProps {
  items: OverlapEntry[];
  totalSelected: number;
  allFriends: Friend[];
  selectedFriends: string[];
  fadeWatched: boolean;
}

export default function MovieGrid({ items, totalSelected, allFriends, selectedFriends, fadeWatched }: MovieGridProps) {
  const watchedSlugs = new Set<string>();
  if (fadeWatched) {
    for (const friend of allFriends) {
      if (selectedFriends.includes(friend.username)) {
        for (const m of friend.watched) watchedSlugs.add(m.slug);
      }
    }
  }

  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7280', fontSize: '14px' }}>
        No films found for this selection.
      </div>
    );
  }

  return (
    <div className="movie-grid" style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
      gap: '12px',
    }}>
      {items.map(({ movie, friends }) => (
        <MovieCard
          key={movie.slug}
          movie={movie}
          friends={friends}
          totalSelected={totalSelected}
          allFriends={allFriends}
          faded={fadeWatched && watchedSlugs.has(movie.slug)}
        />
      ))}
    </div>
  );
}
