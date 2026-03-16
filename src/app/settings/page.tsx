'use client';
import { useState, useEffect } from 'react';
import { Friend } from '@/lib/types';

function timeAgo(isoString: string | null): string {
  if (!isoString) return 'never synced';
  const diff = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `about ${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `about ${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `about ${days} day${days > 1 ? 's' : ''} ago`;
}

type ProgressStep = { step: string; message: string };

export default function SettingsPage() {
  const [username, setUsername] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<ProgressStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [progressDone, setProgressDone] = useState(false);
  const [tmdbKey, setTmdbKey] = useState('');
  const [tmdbSaved, setTmdbSaved] = useState(false);
  const [tmdbSaving, setTmdbSaving] = useState(false);

  useEffect(() => {
    fetchFriends();
    fetch('/api/settings')
      .then((r) => r.json())
      .then((s) => setTmdbKey(s.tmdb_api_key ?? ''));
  }, []);

  async function fetchFriends() {
    const res = await fetch('/api/friends');
    const data = await res.json();
    setFriends(data);
  }

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) return;
    setLoading(true);
    setProgress([]);
    setError(null);
    setProgressDone(false);

    try {
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder('utf-8', { fatal: false });

      if (!reader) throw new Error('No response stream');

      let buffer = '';
      let done = false;
      while (!done) {
        const { value, done: streamDone } = await reader.read();
        done = streamDone;
        if (value) buffer += decoder.decode(value, { stream: true });

        // Process all complete newline-delimited JSON lines
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? ''; // keep any incomplete trailing fragment
        for (const line of lines.filter(Boolean)) {
          try {
            const data = JSON.parse(line);
            if (data.step === 'error') {
              setError(data.message);
            } else if (data.step === 'done') {
              setProgressDone(true);
              setTimeout(() => setProgress([]), 1800);
              setUsername('');
              await fetchFriends();
            } else {
              setProgress((prev) => {
                const filtered = prev.filter((p) => p.step !== data.step);
                return [...filtered, { step: data.step, message: data.message }];
              });
            }
          } catch {}
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveTmdb(e: React.FormEvent) {
    e.preventDefault();
    setTmdbSaving(true);
    setTmdbSaved(false);
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tmdb_api_key: tmdbKey.trim() || null }),
    });
    setTmdbSaving(false);
    setTmdbSaved(true);
    setTimeout(() => setTmdbSaved(false), 3000);
  }

  async function handleSync(username: string) {
    setSyncingId(username);
    try {
      await fetch(`/api/friends/${username}/sync-rss`, { method: 'POST' });
      await fetchFriends();
    } finally {
      setSyncingId(null);
    }
  }

  async function handleDelete(username: string) {
    if (!confirm(`Remove ${username} from your friends list?`)) return;
    setDeletingId(username);
    try {
      await fetch(`/api/friends/${username}`, { method: 'DELETE' });
      await fetchFriends();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="page-container" style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 16px' }}>
      <h1 style={{ textAlign: 'center', fontSize: '26px', fontWeight: 700, color: '#ffffff', marginBottom: '36px' }}>
        Settings
      </h1>

      {/* Add a person panel */}
      <div style={{
        backgroundColor: '#1e2128',
        border: '1px solid #2a2d35',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
      }}>
        <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
          Add a person
        </h2>
        <p style={{ fontSize: '14px', color: '#9ba3af', marginBottom: '20px', lineHeight: 1.6 }}>
          Enter their Letterboxd username exactly as it appears on their profile page at letterboxd.com/username
        </p>

        <form onSubmit={handleImport}>
          {/* Input with prefix */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#0d0f12',
            border: '1px solid #2a2d35',
            borderRadius: '8px',
            height: '44px',
            marginBottom: '12px',
            overflow: 'hidden',
          }}>
            <span style={{
              color: '#6b7280',
              fontSize: '14px',
              padding: '0 12px',
              whiteSpace: 'nowrap',
              borderRight: '1px solid #2a2d35',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
            }}>
              letterboxd.com/
            </span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              disabled={loading}
              style={{
                flex: 1,
                backgroundColor: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#ffffff',
                fontSize: '14px',
                padding: '0 12px',
                height: '100%',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !username.trim()}
            style={{
              width: '100%',
              height: '44px',
              backgroundColor: loading || !username.trim() ? '#005518' : '#00c030',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '15px',
              border: 'none',
              borderRadius: '8px',
              cursor: loading || !username.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'background-color 0.15s',
            }}
          >
            <span style={{ fontSize: '16px' }}>✦</span>
            {loading ? 'Importing...' : 'Import'}
          </button>
        </form>

        {/* Progress steps */}
        {progress.length > 0 && (
          <div style={{
            marginTop: '16px',
            opacity: progressDone ? 0 : 1,
            transition: 'opacity 1.2s ease',
          }}>
            {progress.map((p, i) => {
              const isActive = loading && i === progress.length - 1;
              return (
                <div key={p.step} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '5px 0',
                  color: isActive ? '#ffffff' : '#6b7280',
                  fontSize: '14px',
                  transition: 'color 0.3s',
                }}>
                  {isActive ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" style={{ flexShrink: 0, animation: 'spin 0.8s linear infinite' }}>
                      <circle cx="12" cy="12" r="10" fill="none" stroke="#2a2d35" strokeWidth="3"/>
                      <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="#00c030" strokeWidth="3" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                      <circle cx="12" cy="12" r="10" fill="#00c030" opacity="0.15"/>
                      <path d="M7 12l3.5 3.5L17 8" fill="none" stroke="#00c030" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  {p.message}
                </div>
              );
            })}
          </div>
        )}

        {error && (
          <div style={{ marginTop: '12px', padding: '10px 12px', backgroundColor: '#2d1515', border: '1px solid #5c2020', borderRadius: '8px', color: '#f87171', fontSize: '13px' }}>
            {error}
          </div>
        )}
      </div>

      {/* Friend list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
        {friends.map((friend) => (
          <div
            key={friend.username}
            className="friend-card"
            style={{
              backgroundColor: '#1e2128',
              border: '1px solid #2a2d35',
              borderRadius: '16px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            {/* Avatar */}
            <div style={{ flexShrink: 0 }}>
              {friend.avatar_url ? (
                <img
                  src={friend.avatar_url}
                  alt={friend.username}
                  width={48}
                  height={48}
                  style={{ borderRadius: '50%', border: '1px solid #2a2d35', objectFit: 'cover' }}
                />
              ) : (
                <div style={{
                  width: '48px', height: '48px', borderRadius: '50%',
                  backgroundColor: '#2a2d35', border: '1px solid #3a3d45',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#6b7280', fontWeight: 700, fontSize: '18px',
                }}>
                  {friend.username[0].toUpperCase()}
                </div>
              )}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '16px', marginBottom: '6px' }}>
                @{friend.username}
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '13px', color: '#9ba3af',
                  backgroundColor: '#252830', borderRadius: '6px',
                  padding: '2px 8px', whiteSpace: 'nowrap',
                }}>
                  {friend.watchlist.length} to watch
                </span>
                <span style={{
                  fontSize: '13px', color: '#9ba3af',
                  backgroundColor: '#252830', borderRadius: '6px',
                  padding: '2px 8px', whiteSpace: 'nowrap',
                }}>
                  {friend.watched.length} watched
                </span>
              </div>
              <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '6px' }}>
                synced {timeAgo(friend.last_synced)}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
              <button
                onClick={() => handleSync(friend.username)}
                disabled={syncingId === friend.username}
                title="Sync (RSS)"
                className="icon-btn"
                style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  backgroundColor: 'transparent', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#9ba3af', transition: 'background-color 0.15s',
                  opacity: syncingId === friend.username ? 0.5 : 1,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#252830')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transform: syncingId === friend.username ? 'rotate(360deg)' : 'none', transition: 'transform 1s linear' }}>
                  <path d="M23 4v6h-6M1 20v-6h6"/>
                  <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
                </svg>
              </button>
              <button
                onClick={() => handleDelete(friend.username)}
                disabled={deletingId === friend.username}
                title="Remove"
                className="icon-btn"
                style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  backgroundColor: 'transparent', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#9ba3af', transition: 'background-color 0.15s',
                  opacity: deletingId === friend.username ? 0.5 : 1,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2d1515')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                  <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
      {/* TMDB API key panel */}
      <div style={{
        backgroundColor: '#1e2128',
        border: '1px solid #2a2d35',
        borderRadius: '16px',
        padding: '24px',
      }}>
        <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#ffffff', marginBottom: '6px' }}>
          TMDB API Key
        </h2>
        <p style={{ fontSize: '14px', color: '#9ba3af', marginBottom: '20px', lineHeight: 1.6 }}>
          Optional. Enables movie posters and ratings. Get a free key at{' '}
          <span style={{ color: '#00c030' }}>themoviedb.org/settings/api</span>
        </p>
        <form onSubmit={handleSaveTmdb} className="tmdb-form" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input
            type="password"
            value={tmdbKey}
            onChange={(e) => { setTmdbKey(e.target.value); setTmdbSaved(false); }}
            placeholder="Paste your API key here"
            style={{
              width: '100%',
              backgroundColor: '#0d0f12',
              border: '1px solid #2a2d35',
              borderRadius: '8px',
              height: '44px',
              padding: '0 14px',
              color: '#ffffff',
              fontSize: '14px',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={tmdbSaving}
            style={{
              width: '100%',
              height: '44px',
              backgroundColor: tmdbSaved ? '#005518' : '#00c030',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '14px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background-color 0.15s',
            }}
          >
            {tmdbSaved ? '✓ Saved' : tmdbSaving ? 'Saving...' : 'Save'}
          </button>
        </form>
      </div>
    </div>
  );
}
