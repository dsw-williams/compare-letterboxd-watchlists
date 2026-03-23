'use client';
import { useState, useEffect, useMemo } from 'react';
import clsx from 'clsx';
import { Friend, LetterboxdList, Movie } from '@/lib/types';
import FriendSelector from '@/components/FriendSelector';
import MovieGrid from '@/components/MovieGrid';
import Card from '@/components/ui/Card';
import PillButton from '@/components/ui/PillButton';
import IconButton from '@/components/ui/IconButton';
import { Shuffle } from 'lucide-react';
import Nav from '@/components/Nav';

interface OverlapEntry {
  movie: Movie;
  friends: string[];
}

interface HomePageClientProps {
  initialFriends: Friend[];
  initialLists: LetterboxdList[];
}

function SectionLabel({ label, count }: { label: string; count?: number }) {
  return (
    <div className="mb-5 border-b border-border-subtle pb-[10px] flex items-center gap-2">
      <span className="text-xs font-bold text-text-secondary uppercase tracking-[0.12em]">
        {label}
      </span>
      {count !== undefined && (
        <span className="min-w-[18px] h-[18px] rounded-full bg-bg-card-hover flex items-center justify-center text-[10px] font-bold text-text-secondary px-1">
          {count}
        </span>
      )}
    </div>
  );
}

export default function HomePageClient({ initialFriends, initialLists }: HomePageClientProps) {
  const [friends] = useState<Friend[]>(initialFriends);
  const [lists] = useState<LetterboxdList[]>(initialLists);
  const [selected, setSelected] = useState<string[]>([]);
  const [selectedLists, setSelectedLists] = useState<string[]>([]);
  const [overlap, setOverlap] = useState<OverlapEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeGenres, setActiveGenres] = useState<string[]>([]);
  const [fadeWatched, setFadeWatched] = useState(true);
  const [sortOrder, setSortOrder] = useState<'random' | 'rating_desc' | 'rating_asc' | 'runtime_desc' | 'runtime_asc'>('random');
  const [randomOrder, setRandomOrder] = useState<Map<string, number>>(new Map());

  const listMode = selectedLists.length > 0;

  // Randomise order once per data load
  useEffect(() => {
    reshuffleOrder();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overlap]);

  function reshuffleOrder() {
    const slugs = overlap.map((e) => e.movie.slug);
    const indices = slugs.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    setRandomOrder(new Map(slugs.map((slug, i) => [slug, indices[i]])));
    setSortOrder('random');
  }

  // Build display entries whenever selection changes
  useEffect(() => {
    // List mode: use list movies as the pool, friends determine grouping
    if (listMode) {
      const movieMap = new Map<string, Movie>();
      for (const listId of selectedLists) {
        const list = lists.find((l) => l.id === listId);
        if (!list) continue;
        for (const movie of list.movies) {
          if (!movieMap.has(movie.slug) || (!movieMap.get(movie.slug)!.poster_url && movie.poster_url)) {
            movieMap.set(movie.slug, movie);
          }
        }
      }
      const friendSlugs = new Map(
        selected.map((username) => {
          const friend = friends.find((f) => f.username === username);
          return [username, new Set(friend?.watchlist.map((m) => m.slug) ?? [])];
        })
      );
      const entries: OverlapEntry[] = Array.from(movieMap.values()).map((movie) => ({
        movie,
        friends: selected.filter((u) => friendSlugs.get(u)?.has(movie.slug)),
      }));
      setOverlap(entries);
      return;
    }

    // Friend mode
    if (selected.length === 0) {
      setOverlap([]);
      return;
    }
    if (selected.length === 1) {
      const friend = friends.find((f) => f.username === selected[0]);
      setOverlap(friend ? friend.watchlist.map((movie) => ({ movie, friends: [friend.username] })) : []);
      return;
    }
    setLoading(true);
    fetch(`/api/overlap?usernames=${selected.join(',')}`)
      .then((r) => r.json())
      .then((data) => setOverlap(data))
      .finally(() => setLoading(false));
  }, [selected, friends, selectedLists, lists, listMode]);

  function toggleFriend(username: string) {
    setSelected((prev) =>
      prev.includes(username) ? prev.filter((u) => u !== username) : [...prev, username]
    );
  }

  function toggleList(id: string) {
    setSelectedLists((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    );
  }

  function friendDisplayName(username: string): string {
    return friends.find((f) => f.username === username)?.custom_name ?? username;
  }

  // Build slug → [usernames] map for ALL friends' favourite films (not just selected)
  const favMap = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const friend of friends) {
      for (const m of friend.favourites ?? []) {
        map.set(m.slug, [...(map.get(m.slug) ?? []), friend.username]);
      }
    }
    return map;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, friends]);

  // Gather genres from overlap — also include any active genres so they stay
  // visible even if no movies currently match them (allows deselecting them)
  const genres = useMemo(() => {
    const set = new Set<string>();
    for (const { movie } of overlap) {
      for (const g of movie.genres) set.add(g);
    }
    for (const g of activeGenres) set.add(g);
    return ['All', ...Array.from(set).sort()];
  }, [overlap, activeGenres]);

  // Filter by genre
  const filtered = useMemo(() => {
    if (activeGenres.length === 0) return overlap;
    return overlap.filter(({ movie }) => activeGenres.some((g) => movie.genres.includes(g)));
  }, [overlap, activeGenres]);

  // Sort items within a group
  function sortItems(items: OverlapEntry[]) {
    if (sortOrder === 'random') {
      return [...items].sort((a, b) => (randomOrder.get(a.movie.slug) ?? 0) - (randomOrder.get(b.movie.slug) ?? 0));
    }
    return [...items].sort((a, b) => {
      if (sortOrder === 'rating_desc') return (b.movie.rating ?? 0) - (a.movie.rating ?? 0);
      if (sortOrder === 'rating_asc') return (a.movie.rating ?? 0) - (b.movie.rating ?? 0);
      if (sortOrder === 'runtime_desc') return (b.movie.runtime ?? 0) - (a.movie.runtime ?? 0);
      return (a.movie.runtime ?? 0) - (b.movie.runtime ?? 0);
    });
  }

  // Group by overlap count — always used in list mode, or when 2+ friends selected
  const groupedByCount = useMemo(() => {
    if (!listMode && selected.length < 2) return null;
    const counts = Array.from(new Set(filtered.map(({ friends }) => friends.length))).sort((a, b) => b - a);
    return counts.map((count) => ({
      count,
      items: filtered.filter(({ friends }) => friends.length === count),
    }));
  }, [filtered, selected.length, listMode]);

  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? 'this morning' : hour < 17 ? 'this afternoon' : hour < 20 ? 'this evening' : 'tonight';

  return (
    <>
    <Nav />
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      {/* Page header */}
      <div className="mb-7">
        <h1 className="text-[30px] font-bold text-text-primary leading-[1.2]">
          Who&apos;s watching {timeOfDay}?
        </h1>
      </div>

      {/* Friends selector */}
      <div className="mb-4">
        <FriendSelector
          friends={friends}
          selected={selected}
          onToggle={toggleFriend}
        />
      </div>

      {/* Lists selector */}
      {lists.length > 0 && (
        <Card className="px-5 py-4 mb-4">
          <div className="text-xs font-bold text-text-secondary uppercase tracking-[0.12em] mb-3">
            Lists
          </div>
          <div className="flex flex-wrap gap-2">
            {lists.map((list) => {
              const isActive = selectedLists.includes(list.id);
              return (
                <PillButton
                  key={list.id}
                  isActive={isActive}
                  onClick={() => toggleList(list.id)}
                  className="px-[14px] py-[5px] flex items-center gap-[6px] text-left"
                >
                  <span>🎬</span>
                  {list.custom_name ?? list.name}
                </PillButton>
              );
            })}
          </div>
        </Card>
      )}

      {/* Genre filter chips */}
      {genres.length > 1 && (
        <div className="flex flex-nowrap overflow-x-auto gap-2 mb-4 sm:flex-wrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {genres.map((genre) => {
            const isAll = genre === 'All';
            const isActive = isAll ? activeGenres.length === 0 : activeGenres.includes(genre);
            return (
              <PillButton
                key={genre}
                isActive={isActive}
                onClick={() => {
                  if (isAll) {
                    setActiveGenres([]);
                  } else {
                    setActiveGenres((prev) =>
                      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
                    );
                  }
                }}
                className="shrink-0 px-[14px] py-[5px] leading-[1.4]"
              >
                {genre}
              </PillButton>
            );
          })}
        </div>
      )}

      {/* Sort + watched controls */}
      {(selected.length >= 1 || listMode) && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <PillButton
            isActive={sortOrder === 'rating_desc' || sortOrder === 'rating_asc'}
            onClick={() => setSortOrder((s) => s === 'rating_desc' ? 'rating_asc' : s === 'rating_asc' ? 'random' : 'rating_desc')}
            className="px-3 py-[5px]"
          >
            {sortOrder === 'rating_desc' ? 'Rating ↓' : sortOrder === 'rating_asc' ? 'Rating ↑' : 'Rating'}
          </PillButton>
          <PillButton
            isActive={sortOrder === 'runtime_desc' || sortOrder === 'runtime_asc'}
            onClick={() => setSortOrder((s) => s === 'runtime_desc' ? 'runtime_asc' : s === 'runtime_asc' ? 'random' : 'runtime_desc')}
            className="px-3 py-[5px]"
          >
            {sortOrder === 'runtime_desc' ? 'Length ↓' : sortOrder === 'runtime_asc' ? 'Length ↑' : 'Length'}
          </PillButton>
          <IconButton
            onClick={reshuffleOrder}
            title="Shuffle"
            className={sortOrder === 'random' ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'}
          >
            <Shuffle size={16} />
          </IconButton>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-13 text-text-secondary">Fade watched</span>
            <button
              role="switch"
              aria-checked={fadeWatched}
              onClick={() => setFadeWatched((f) => !f)}
              className={clsx(
                'relative inline-flex h-[22px] w-[40px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none',
                fadeWatched ? 'bg-accent-green' : 'bg-border-strong'
              )}
            >
              <span
                className={clsx(
                  'pointer-events-none inline-block h-[18px] w-[18px] rounded-full bg-white shadow transition-transform duration-200',
                  fadeWatched ? 'translate-x-[18px]' : 'translate-x-0'
                )}
              />
            </button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="text-text-tertiary text-sm py-5">
          Loading...
        </div>
      )}

      {/* Movie grid — single friend (no list mode): one flat section */}
      {!loading && !listMode && selected.length === 1 && (
        <>
          <SectionLabel label={`${friendDisplayName(selected[0])}'s watchlist`} count={sortItems(filtered).length} />
          <MovieGrid items={sortItems(filtered)} totalSelected={1} allFriends={friends} selectedFriends={selected} fadeWatched={fadeWatched} favMap={favMap} />
        </>
      )}

      {/* Movie grid — list mode or multiple friends: grouped by overlap count */}
      {!loading && groupedByCount && groupedByCount.map(({ count, items }) => (
        <div key={count} className="mb-8">
          <SectionLabel
            label={
              count === 0
                ? 'On no watchlists'
                : count === selected.length
                ? `On all ${selected.length} watchlists`
                : count >= 2
                ? `On ${count} of ${selected.length} watchlists`
                : 'On 1 watchlist'
            }
            count={sortItems(items).length}
          />
          <MovieGrid items={sortItems(items)} totalSelected={selected.length} allFriends={friends} selectedFriends={selected} fadeWatched={fadeWatched} favMap={favMap} />
        </div>
      ))}

      {/* Prompt to select a friend or list */}
      {!loading && selected.length === 0 && !listMode && (friends.length > 0 || lists.length > 0) && (
        <div className="text-center py-[60px] text-text-tertiary text-sm">
          Select a friend or list to get started.
        </div>
      )}
    </div>
    </>
  );
}
