'use client';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Friend, LetterboxdList } from '@/lib/types';
import ImportProgress from '@/components/ImportProgress';
import EntityCard from '@/components/EntityCard';
import { useImportStream } from '@/hooks/useImportStream';
import Card from '@/components/ui/Card';
import PrimaryButton from '@/components/ui/PrimaryButton';
import InputField from '@/components/ui/InputField';

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

export default function SettingsPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [tmdbKey, setTmdbKey] = useState('');
  const [tmdbSaved, setTmdbSaved] = useState(false);
  const [tmdbSaving, setTmdbSaving] = useState(false);

  // Lists state
  const [lists, setLists] = useState<LetterboxdList[]>([]);
  const [deletingListId, setDeletingListId] = useState<string | null>(null);
  const [syncingListId, setSyncingListId] = useState<string | null>(null);
  const [renamingListId, setRenamingListId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renamingFriendId, setRenamingFriendId] = useState<string | null>(null);
  const [renameFriendValue, setRenameFriendValue] = useState('');
  const [syncProgress, setSyncProgress] = useState<Record<string, number>>({});

  async function fetchFriends() {
    const res = await fetch('/api/friends');
    const data = await res.json();
    setFriends(data);
  }

  async function fetchLists() {
    const res = await fetch('/api/lists');
    const data = await res.json();
    setLists(data);
  }

  const friendImport = useImportStream({
    endpoint: '/api/friends',
    buildBody: (username) => ({ username }),
    onSuccess: fetchFriends,
  });

  const listImport = useImportStream({
    endpoint: '/api/lists',
    buildBody: (url) => ({ url }),
    onSuccess: fetchLists,
  });

  useEffect(() => {
    fetchFriends();
    fetchLists();
    fetch('/api/settings')
      .then((r) => r.json())
      .then((s) => setTmdbKey(s.tmdb_api_key ?? ''));
  }, []);

  async function handleRenameFriend(username: string, customName: string) {
    await fetch(`/api/friends/${username}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ custom_name: customName.trim() || null }),
    });
    setRenamingFriendId(null);
    await fetchFriends();
  }

  async function handleRenameList(id: string, customName: string) {
    await fetch(`/api/lists/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ custom_name: customName.trim() || null }),
    });
    setRenamingListId(null);
    await fetchLists();
  }

  async function handleSyncList(id: string) {
    setSyncingListId(id);
    try {
      await fetch(`/api/lists/${id}`, { method: 'POST' });
      await fetchLists();
    } finally {
      setSyncingListId(null);
    }
  }

  async function handleDeleteList(id: string, name: string) {
    if (!confirm(`Remove "${name}" from your lists?`)) return;
    setDeletingListId(id);
    try {
      await fetch(`/api/lists/${id}`, { method: 'DELETE' });
      await fetchLists();
    } finally {
      setDeletingListId(null);
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
    setSyncProgress((p) => ({ ...p, [username]: 0 }));
    try {
      const res = await fetch(`/api/friends/${username}/sync`, { method: 'POST' });
      const reader = res.body?.getReader();
      const decoder = new TextDecoder('utf-8', { fatal: false });
      if (!reader) throw new Error('No stream');
      let buffer = '';
      let done = false;
      while (!done) {
        const { value, done: streamDone } = await reader.read();
        done = streamDone;
        if (value) buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines.filter(Boolean)) {
          try {
            const data = JSON.parse(line);
            if (data.pct !== undefined) setSyncProgress((p) => ({ ...p, [username]: data.pct }));
            if (data.step === 'done') await fetchFriends();
          } catch {}
        }
      }
    } finally {
      setTimeout(() => {
        setSyncingId(null);
        setSyncProgress((p) => { const n = { ...p }; delete n[username]; return n; });
      }, 600);
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
    <div className="max-w-[600px] mx-auto px-4 py-10">
      <h1 className="text-center text-26 font-bold text-text-primary mb-9">
        Settings
      </h1>

      {/* Add a person panel */}
      <Card className="p-6 mb-6">
        <h2 className="text-17 font-bold text-text-primary mb-2">
          Add a person
        </h2>
        <p className="text-sm text-text-secondary mb-5 leading-relaxed">
          Enter their Letterboxd username exactly as it appears on their profile page at letterboxd.com/username
        </p>

        <form onSubmit={friendImport.handleSubmit}>
          {/* Input with prefix */}
          <div className="flex items-center bg-bg-input border border-border-subtle rounded-lg h-11 mb-3 overflow-hidden">
            <span className="text-text-tertiary text-sm px-3 whitespace-nowrap border-r border-border-subtle h-full flex items-center">
              letterboxd.com/
            </span>
            <input
              type="text"
              value={friendImport.value}
              onChange={(e) => friendImport.setValue(e.target.value)}
              placeholder="username"
              disabled={friendImport.loading}
              className="flex-1 bg-transparent border-none outline-none text-text-primary text-sm px-3 h-full"
            />
          </div>

          <PrimaryButton
            type="submit"
            disabled={friendImport.loading || !friendImport.value.trim()}
            className="gap-2 text-15"
          >
            {friendImport.loading ? 'Importing...' : 'Import'}
          </PrimaryButton>
        </form>

        <ImportProgress progress={friendImport.progress} error={friendImport.error} loading={friendImport.loading} progressDone={friendImport.progressDone} />
      </Card>

      {/* Friend list */}
      <div className="flex flex-col gap-2 mb-6">
        {friends.map((friend) => (
          <EntityCard
            key={friend.username}
            avatarNode={friend.avatar_url ? (
              <img
                src={friend.avatar_url}
                alt={friend.username}
                width={48}
                height={48}
                className="rounded-full border border-border-subtle object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-border-subtle border border-border-strong flex items-center justify-center text-text-tertiary font-bold text-lg">
                {friend.username[0].toUpperCase()}
              </div>
            )}
            displayName={friend.custom_name ?? friend.username}
            subtitle={friend.custom_name ? `@${friend.username}` : undefined}
            showSpacerWhenNoSubtitle
            chips={[
              { label: `${friend.watchlist.length} to watch` },
              { label: `${friend.watched.length} watched` },
              { label: `${(friend.favourites ?? []).length} favourites` },
            ]}
            lastSynced={friend.last_synced}
            tmdbEnriched={friend.tmdb_enriched}
            timeAgo={timeAgo}
            isRenaming={renamingFriendId === friend.username}
            renameValue={renameFriendValue}
            renamePlaceholder={friend.username}
            onRenameChange={setRenameFriendValue}
            onRenameKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameFriend(friend.username, renameFriendValue);
              if (e.key === 'Escape') setRenamingFriendId(null);
            }}
            onRenameConfirm={() => handleRenameFriend(friend.username, renameFriendValue)}
            onRenameCancel={() => setRenamingFriendId(null)}
            onRenameStart={() => { setRenamingFriendId(friend.username); setRenameFriendValue(friend.custom_name ?? ''); }}
            isSyncing={syncingId === friend.username}
            syncProgress={syncProgress[friend.username] ?? 0}
            onSync={() => handleSync(friend.username)}
            isDeleting={deletingId === friend.username}
            onDelete={() => handleDelete(friend.username)}
          />
        ))}
      </div>

      {/* Import a list panel */}
      <Card className="p-6 mb-6">
        <h2 className="text-17 font-bold text-text-primary mb-2">
          Import a list
        </h2>
        <p className="text-sm text-text-secondary mb-5 leading-relaxed">
          Paste a Letterboxd list URL, e.g. letterboxd.com/username/list/list-name/
        </p>

        <form onSubmit={listImport.handleSubmit}>
          <InputField
            type="text"
            value={listImport.value}
            onChange={(e) => listImport.setValue(e.target.value)}
            placeholder="https://letterboxd.com/username/list/list-name/"
            disabled={listImport.loading}
            className="w-full h-11 px-[14px] mb-3"
          />
          <PrimaryButton
            type="submit"
            disabled={listImport.loading || !listImport.value.trim()}
            className="gap-2 text-15"
          >
            {listImport.loading ? 'Importing...' : 'Import'}
          </PrimaryButton>
        </form>

        <ImportProgress progress={listImport.progress} error={listImport.error} loading={listImport.loading} progressDone={listImport.progressDone} />
      </Card>

      {/* Imported lists */}
      <div className="flex flex-col gap-2 mb-6">
        {lists.map((list) => (
          <EntityCard
            key={list.id}
            avatarNode={
              <div className="w-12 h-12 rounded-full bg-bg-card-hover border border-border-strong flex items-center justify-center text-22">
                🎬
              </div>
            }
            displayName={list.custom_name ?? list.name}
            subtitle={list.custom_name ? list.name : undefined}
            nameEllipsis
            chips={[
              { label: `${list.movies.length} films` },
              { label: `by ${list.owner}`, dimmed: true },
            ]}
            lastSynced={list.last_synced}
            tmdbEnriched={list.tmdb_enriched}
            timeAgo={timeAgo}
            isRenaming={renamingListId === list.id}
            renameValue={renameValue}
            renamePlaceholder={list.name}
            onRenameChange={setRenameValue}
            onRenameKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameList(list.id, renameValue);
              if (e.key === 'Escape') setRenamingListId(null);
            }}
            onRenameConfirm={() => handleRenameList(list.id, renameValue)}
            onRenameCancel={() => setRenamingListId(null)}
            onRenameStart={() => { setRenamingListId(list.id); setRenameValue(list.custom_name ?? ''); }}
            isSyncing={syncingListId === list.id}
            onSync={() => handleSyncList(list.id)}
            isDeleting={deletingListId === list.id}
            onDelete={() => handleDeleteList(list.id, list.name)}
          />
        ))}
      </div>

      {/* TMDB API key panel */}
      <Card className="p-6">
        <h2 className="text-17 font-bold text-text-primary mb-[6px]">
          TMDB API Key
        </h2>
        <p className="text-sm text-text-secondary mb-5 leading-relaxed">
          Optional. Enables movie posters and ratings. Get a free key at{' '}
          <span className="text-accent-green">themoviedb.org/settings/api</span>
        </p>
        <form onSubmit={handleSaveTmdb} className="flex flex-col gap-2">
          <InputField
            type="password"
            value={tmdbKey}
            onChange={(e) => { setTmdbKey(e.target.value); setTmdbSaved(false); }}
            placeholder="Paste your API key here"
            className="w-full h-11 px-[14px]"
          />
          <PrimaryButton
            type="submit"
            disabled={tmdbSaving}
            className={cn('text-sm', tmdbSaved && 'bg-accent-green-disabled')}
          >
            {tmdbSaved ? '✓ Saved' : tmdbSaving ? 'Saving...' : 'Save'}
          </PrimaryButton>
        </form>
      </Card>
    </div>
  );
}
