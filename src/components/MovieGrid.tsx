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
  favMap: Map<string, string[]>;
}

export default function MovieGrid({ items, totalSelected, allFriends, selectedFriends, fadeWatched, favMap }: MovieGridProps) {
  const watchedSlugs = new Set<string>();
  if (fadeWatched) {
    for (const friend of allFriends) {
      if (selectedFriends.includes(friend.username)) {
        for (const m of friend.watched) watchedSlugs.add(m.slug);
      }
    }
  }

  const displayItems = items;

  if (displayItems.length === 0) {
    return (
      <div className="text-center py-[60px] text-text-tertiary text-sm">
        No films found for this selection.
      </div>
    );
  }

  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}
    >
      {displayItems.map(({ movie, friends }) => (
        <MovieCard
          key={movie.slug}
          movie={movie}
          friends={friends}
          totalSelected={totalSelected}
          allFriends={allFriends}
          faded={fadeWatched && watchedSlugs.has(movie.slug)}
          favouritedBy={favMap.get(movie.slug) ?? []}
        />
      ))}
    </div>
  );
}
