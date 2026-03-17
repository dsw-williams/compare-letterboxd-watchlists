'use client';
import { useState, useEffect, useMemo } from 'react';
import { Friend, LetterboxdList, Movie } from '@/lib/types';
import FriendSelector from '@/components/FriendSelector';
import MovieGrid from '@/components/MovieGrid';

interface OverlapEntry {
  movie: Movie;
  friends: string[];
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div style={{ marginBottom: '20px', borderBottom: '1px solid #2a2d35', paddingBottom: '10px' }}>
      <span style={{ fontSize: '12px', fontWeight: 700, color: '#9ba3af', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
        {label}
      </span>
    </div>
  );
}

export default function HomePage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [lists, setLists] = useState<LetterboxdList[]>([]);
  const [selectedLists, setSelectedLists] = useState<string[]>([]);
  const [overlap, setOverlap] = useState<OverlapEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeGenres, setActiveGenres] = useState<string[]>([]);
  const [watchedFilter, setWatchedFilter] = useState<'show' | 'fade' | 'hide'>('show');
  const [sortOrder, setSortOrder] = useState<'random' | 'rating_desc' | 'rating_asc' | 'runtime_desc' | 'runtime_asc' | 'title'>('random');
  const [randomOrder, setRandomOrder] = useState<Map<string, number>>(new Map());

  const listMode = selectedLists.length > 0;

  // Load friends and lists on mount
  useEffect(() => {
    fetch('/api/friends')
      .then((r) => r.json())
      .then((data: Friend[]) => {
        setFriends(data);
        if (data.length > 0 && data.length <= 4) {
          setSelected(data.map((f) => f.username));
        }
      });
    fetch('/api/lists')
      .then((r) => r.json())
      .then((data: LetterboxdList[]) => setLists(data));
  }, []);

  // Randomise order once per data load
  useEffect(() => {
    const slugs = overlap.map((e) => e.movie.slug);
    const indices = slugs.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    setRandomOrder(new Map(slugs.map((slug, i) => [slug, indices[i]])));
  }, [overlap]);

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

  function selectAll() {
    setSelected(friends.map((f) => f.username));
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

  const sharedCount = filtered.filter(({ friends }) => friends.length >= 2).length;

  // Sort items within a group
  function sortItems(items: OverlapEntry[]) {
    if (sortOrder === 'random') {
      return [...items].sort((a, b) => (randomOrder.get(a.movie.slug) ?? 0) - (randomOrder.get(b.movie.slug) ?? 0));
    }
    return [...items].sort((a, b) => {
      if (sortOrder === 'rating_desc') return (b.movie.rating ?? 0) - (a.movie.rating ?? 0);
      if (sortOrder === 'rating_asc') return (a.movie.rating ?? 0) - (b.movie.rating ?? 0);
      if (sortOrder === 'runtime_desc') return (b.movie.runtime ?? 0) - (a.movie.runtime ?? 0);
      if (sortOrder === 'runtime_asc') return (a.movie.runtime ?? 0) - (b.movie.runtime ?? 0);
      return a.movie.title.localeCompare(b.movie.title);
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
    <div className="page-container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Page header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '30px', fontWeight: 700, color: '#ffffff', marginBottom: '6px', lineHeight: 1.2 }}>
          Who&apos;s watching {timeOfDay}?
        </h1>
        <p style={{ fontSize: '15px', color: '#9ba3af' }}>
          Select friends to compare watchlists.
        </p>
      </div>

      {/* Friends selector */}
      <div style={{ marginBottom: lists.length > 0 ? '12px' : '20px' }}>
        <FriendSelector
          friends={friends}
          selected={selected}
          onToggle={toggleFriend}
          onSelectAll={selectAll}
        />
      </div>

      {/* Lists selector */}
      {lists.length > 0 && (
        <div style={{
          backgroundColor: '#1e2128',
          border: '1px solid #2a2d35',
          borderRadius: '16px',
          padding: '16px 20px',
          marginBottom: '20px',
        }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#9ba3af', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '12px' }}>
            Lists
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {lists.map((list) => {
              const isActive = selectedLists.includes(list.id);
              return (
                <button
                  key={list.id}
                  onClick={() => toggleList(list.id)}
                  style={{
                    padding: '5px 14px',
                    borderRadius: '99px',
                    fontSize: '13px',
                    fontWeight: isActive ? 600 : 400,
                    cursor: 'pointer',
                    border: `1px solid ${isActive ? '#00c030' : '#2a2d35'}`,
                    backgroundColor: isActive ? '#00c030' : 'transparent',
                    color: isActive ? '#ffffff' : '#9ba3af',
                    transition: 'all 0.15s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    textAlign: 'left',
                  }}
                >
                  <span>🎬</span>
                  {list.custom_name ?? list.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Genre filter chips */}
      {genres.length > 1 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
          {genres.map((genre) => {
            const isAll = genre === 'All';
            const isActive = isAll ? activeGenres.length === 0 : activeGenres.includes(genre);
            return (
              <button
                key={genre}
                onClick={() => {
                  if (isAll) {
                    setActiveGenres([]);
                  } else {
                    setActiveGenres((prev) =>
                      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
                    );
                  }
                }}
                style={{
                  padding: '5px 14px',
                  borderRadius: '99px',
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 400,
                  cursor: 'pointer',
                  border: `1px solid ${isActive ? '#00c030' : '#2a2d35'}`,
                  backgroundColor: isActive ? '#00c030' : 'transparent',
                  color: isActive ? '#ffffff' : '#9ba3af',
                  transition: 'all 0.15s',
                  lineHeight: 1.4,
                }}
              >
                {genre}
              </button>
            );
          })}
        </div>
      )}

      {/* Results header */}
      {(selected.length >= 1 || listMode) && (
        <div className="results-header" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '17px', fontWeight: 700, color: '#ffffff' }}>
              {filtered.length} films found
            </span>
            {!listMode && selected.length >= 2 && (
              <span style={{ fontSize: '15px', color: '#00c030', fontWeight: 600 }}>
                {sharedCount} shared
              </span>
            )}
            {listMode && selected.length >= 1 && (
              <span style={{ fontSize: '15px', color: '#00c030', fontWeight: 600 }}>
                {filtered.filter(({ friends }) => friends.length >= 1).length} on watchlists
              </span>
            )}
          </div>

          {/* Sort + Fade watched controls */}
          <div className="results-controls" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Rating sort button — cycles: off → ↓ → ↑ → off */}
            {(() => {
              const ratingActive = sortOrder === 'rating_desc' || sortOrder === 'rating_asc';
              const label = sortOrder === 'rating_desc' ? 'Rating ↓' : sortOrder === 'rating_asc' ? 'Rating ↑' : 'Rating';
              return (
                <button
                  onClick={() => setSortOrder((s) =>
                    s === 'rating_desc' ? 'rating_asc'
                    : s === 'rating_asc' ? 'random'
                    : 'rating_desc'
                  )}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '99px',
                    fontSize: '13px',
                    fontWeight: ratingActive ? 600 : 400,
                    cursor: 'pointer',
                    border: `1px solid ${ratingActive ? '#00c030' : '#2a2d35'}`,
                    backgroundColor: ratingActive ? '#00c030' : 'transparent',
                    color: ratingActive ? '#ffffff' : '#9ba3af',
                    transition: 'all 0.15s',
                  }}
                >
                  {label}
                </button>
              );
            })()}
            {/* Runtime sort button — cycles: off → ↓ → ↑ → off */}
            {(() => {
              const runtimeActive = sortOrder === 'runtime_desc' || sortOrder === 'runtime_asc';
              const label = sortOrder === 'runtime_desc' ? 'Runtime ↓' : sortOrder === 'runtime_asc' ? 'Runtime ↑' : 'Runtime';
              return (
                <button
                  onClick={() => setSortOrder((s) =>
                    s === 'runtime_desc' ? 'runtime_asc'
                    : s === 'runtime_asc' ? 'random'
                    : 'runtime_desc'
                  )}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '99px',
                    fontSize: '13px',
                    fontWeight: runtimeActive ? 600 : 400,
                    cursor: 'pointer',
                    border: `1px solid ${runtimeActive ? '#00c030' : '#2a2d35'}`,
                    backgroundColor: runtimeActive ? '#00c030' : 'transparent',
                    color: runtimeActive ? '#ffffff' : '#9ba3af',
                    transition: 'all 0.15s',
                  }}
                >
                  {label}
                </button>
              );
            })()}
            {/* Title sort button */}
            {(() => {
              const isActive = sortOrder === 'title';
              return (
                <button
                  onClick={() => setSortOrder((s) => s === 'title' ? 'random' : 'title')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '99px',
                    fontSize: '13px',
                    fontWeight: isActive ? 600 : 400,
                    cursor: 'pointer',
                    border: `1px solid ${isActive ? '#00c030' : '#2a2d35'}`,
                    backgroundColor: isActive ? '#00c030' : 'transparent',
                    color: isActive ? '#ffffff' : '#9ba3af',
                    transition: 'all 0.15s',
                  }}
                >
                  Title
                </button>
              );
            })()}
            <div style={{ width: '1px', height: '16px', backgroundColor: '#2a2d35' }} />
            <div style={{
              display: 'flex',
              borderRadius: '99px',
              border: '1px solid #2a2d35',
              overflow: 'hidden',
            }}>
              {(['show', 'fade', 'hide'] as const).map((val, i) => {
                const isActive = watchedFilter === val;
                const label = val === 'show' ? 'All' : val === 'fade' ? 'Fade watched' : 'Hide watched';
                return (
                  <button
                    key={val}
                    onClick={() => setWatchedFilter(val)}
                    style={{
                      padding: '5px 12px',
                      fontSize: '13px',
                      fontWeight: isActive ? 600 : 400,
                      cursor: 'pointer',
                      border: 'none',
                      borderLeft: i > 0 ? '1px solid #2a2d35' : 'none',
                      backgroundColor: isActive ? '#00c030' : 'transparent',
                      color: isActive ? '#ffffff' : '#9ba3af',
                      transition: 'background-color 0.15s, color 0.15s',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{ color: '#6b7280', fontSize: '14px', padding: '20px 0' }}>
          Loading...
        </div>
      )}

      {/* Movie grid — single friend (no list mode): one flat section */}
      {!loading && !listMode && selected.length === 1 && (
        <>
          <SectionLabel label={`${friendDisplayName(selected[0])}'s watchlist`} />
          <MovieGrid items={sortItems(filtered)} totalSelected={1} allFriends={friends} selectedFriends={selected} watchedFilter={watchedFilter} favMap={favMap} />
        </>
      )}

      {/* Movie grid — list mode or multiple friends: grouped by overlap count */}
      {!loading && groupedByCount && groupedByCount.map(({ count, items }) => (
        <div key={count} className="section-with-label" style={{ marginBottom: '32px' }}>
          <SectionLabel label={
            count === 0
              ? 'On no watchlists'
              : count === selected.length
              ? `On all ${selected.length} watchlists`
              : count >= 2
              ? `On ${count} of ${selected.length} watchlists`
              : 'On 1 watchlist'
          } />
          <MovieGrid items={sortItems(items)} totalSelected={selected.length} allFriends={friends} selectedFriends={selected} watchedFilter={watchedFilter} favMap={favMap} />
        </div>
      ))}

      {/* Prompt to select a friend or list */}
      {!loading && selected.length === 0 && !listMode && (friends.length > 0 || lists.length > 0) && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7280', fontSize: '14px' }}>
          Select a friend or list to get started.
        </div>
      )}
    </div>
  );
}
