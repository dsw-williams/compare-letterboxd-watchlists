'use client';
import { useState, useEffect, useMemo } from 'react';
import { Friend, Movie } from '@/lib/types';
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
  const [overlap, setOverlap] = useState<OverlapEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeGenres, setActiveGenres] = useState<string[]>([]);
  const [fadeWatched, setFadeWatched] = useState(false);
  const [sortOrder, setSortOrder] = useState<'random' | 'rating_desc' | 'rating_asc' | 'runtime_desc' | 'runtime_asc' | 'title'>('random');
  const [randomOrder, setRandomOrder] = useState<Map<string, number>>(new Map());

  // Load friends on mount
  useEffect(() => {
    fetch('/api/friends')
      .then((r) => r.json())
      .then((data: Friend[]) => {
        setFriends(data);
        // Auto-select all if ≤4 friends
        if (data.length > 0 && data.length <= 4) {
          setSelected(data.map((f) => f.username));
        }
      });
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
    if (selected.length === 0) {
      setOverlap([]);
      return;
    }
    if (selected.length === 1) {
      // Single friend — show their full watchlist directly from local data
      const friend = friends.find((f) => f.username === selected[0]);
      setOverlap(friend ? friend.watchlist.map((movie) => ({ movie, friends: [friend.username] })) : []);
      return;
    }
    setLoading(true);
    fetch(`/api/overlap?usernames=${selected.join(',')}`)
      .then((r) => r.json())
      .then((data) => setOverlap(data))
      .finally(() => setLoading(false));
  }, [selected, friends]);

  function toggleFriend(username: string) {
    setSelected((prev) =>
      prev.includes(username) ? prev.filter((u) => u !== username) : [...prev, username]
    );
  }

  function selectAll() {
    setSelected(friends.map((f) => f.username));
  }

  // Gather genres from overlap
  const genres = useMemo(() => {
    const set = new Set<string>();
    for (const { movie } of overlap) {
      for (const g of movie.genres) set.add(g);
    }
    return ['All', ...Array.from(set).sort()];
  }, [overlap]);

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

  // Group by overlap count for section headings (only when 2+ friends selected)
  const groupedByCount = useMemo(() => {
    if (selected.length < 2) return null;
    const counts = Array.from(new Set(filtered.map(({ friends }) => friends.length))).sort((a, b) => b - a);
    return counts.map((count) => ({
      count,
      items: filtered.filter(({ friends }) => friends.length === count),
    }));
  }, [filtered, selected.length]);

  return (
    <div className="page-container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Page header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '30px', fontWeight: 700, color: '#ffffff', marginBottom: '6px', lineHeight: 1.2 }}>
          Who&apos;s watching tonight?
        </h1>
        <p style={{ fontSize: '15px', color: '#9ba3af' }}>
          Select friends to compare watchlists.
        </p>
      </div>

      {/* Friends selector */}
      <div style={{ marginBottom: '20px' }}>
        <FriendSelector
          friends={friends}
          selected={selected}
          onToggle={toggleFriend}
          onSelectAll={selectAll}
        />
      </div>

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
      {selected.length >= 1 && (
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
            {selected.length >= 2 && (
              <span style={{ fontSize: '15px', color: '#00c030', fontWeight: 600 }}>
                {sharedCount} shared
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
            <span style={{ fontSize: '13px', color: '#9ba3af', whiteSpace: 'nowrap' }}>Fade watched</span>
            <button
              onClick={() => setFadeWatched((v) => !v)}
              style={{
                width: '40px', height: '22px',
                borderRadius: '99px',
                backgroundColor: fadeWatched ? '#00c030' : '#2a2d35',
                border: 'none', cursor: 'pointer',
                position: 'relative',
                transition: 'background-color 0.15s',
                padding: 0,
              }}
            >
              <div style={{
                width: '16px', height: '16px', borderRadius: '50%',
                backgroundColor: '#ffffff',
                position: 'absolute',
                top: '3px',
                left: fadeWatched ? '21px' : '3px',
                transition: 'left 0.15s',
              }} />
            </button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{ color: '#6b7280', fontSize: '14px', padding: '20px 0' }}>
          Loading...
        </div>
      )}

      {/* Movie grid — single friend: one flat section */}
      {!loading && selected.length === 1 && (
        <>
          <SectionLabel label={`${selected[0]}'s watchlist`} />
          <MovieGrid items={sortItems(filtered)} totalSelected={1} allFriends={friends} selectedFriends={selected} fadeWatched={fadeWatched} />
        </>
      )}

      {/* Movie grid — multiple friends: grouped by overlap count */}
      {!loading && selected.length >= 2 && groupedByCount && groupedByCount.map(({ count, items }) => (
        <div key={count} className="section-with-label" style={{ marginBottom: '32px' }}>
          <SectionLabel label={
            count === selected.length
              ? `On all ${selected.length} watchlists`
              : count >= 2
              ? `On ${count} of ${selected.length} watchlists`
              : `On 1 watchlist`
          } />
          <MovieGrid items={sortItems(items)} totalSelected={selected.length} allFriends={friends} selectedFriends={selected} fadeWatched={fadeWatched} />
        </div>
      ))}

      {/* Prompt to select a friend */}
      {!loading && selected.length === 0 && friends.length > 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7280', fontSize: '14px' }}>
          Select a friend to see their watchlist.
        </div>
      )}
    </div>
  );
}
