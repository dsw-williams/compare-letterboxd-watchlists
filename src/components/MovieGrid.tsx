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
  watchedFilter: 'show' | 'fade' | 'hide';
  favMap: Map<string, string[]>;
}

export default function MovieGrid({ items, totalSelected, allFriends, selectedFriends, watchedFilter, favMap }: MovieGridProps) {
  const watchedSlugs = new Set<string>();
  if (watchedFilter !== 'show') {
    for (const friend of allFriends) {
      if (selectedFriends.includes(friend.username)) {
        for (const m of friend.watched) watchedSlugs.add(m.slug);
      }
    }
  }

  const displayItems = watchedFilter === 'hide' ? items.filter(({ movie }) => !watchedSlugs.has(movie.slug)) : items;

  if (displayItems.length === 0) {
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
      {displayItems.map(({ movie, friends }) => (
        <MovieCard
          key={movie.slug}
          movie={movie}
          friends={friends}
          totalSelected={totalSelected}
          allFriends={allFriends}
          faded={watchedFilter === 'fade' && watchedSlugs.has(movie.slug)}
          favouritedBy={favMap.get(movie.slug) ?? []}
        />
      ))}
    </div>
  );
}
