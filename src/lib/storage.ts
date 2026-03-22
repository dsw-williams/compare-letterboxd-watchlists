import fs from 'fs/promises';
import path from 'path';
import { Friend, Movie, LetterboxdList, Settings } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const FRIENDS_FILE = path.join(DATA_DIR, 'friends.json');
const LISTS_FILE = path.join(DATA_DIR, 'lists.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

// In-process write queue — prevents concurrent writes corrupting the same file
const writeQueues = new Map<string, Promise<void>>();

function enqueue(key: string, fn: () => Promise<void>): Promise<void> {
  const prev = writeQueues.get(key) ?? Promise.resolve();
  const next = prev.then(fn, fn);
  writeQueues.set(key, next);
  return next;
}

// Atomic write: write to .tmp then rename (atomic on POSIX)
async function atomicWrite(filePath: string, content: string): Promise<void> {
  await ensureDataDir();
  const tmp = filePath + '.tmp';
  await fs.writeFile(tmp, content);
  await fs.rename(tmp, filePath);
}

async function readFriendsFile(): Promise<{ friends: Friend[] }> {
  try {
    const content = await fs.readFile(FRIENDS_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return { friends: [] };
  }
}

async function writeFriendsFile(data: { friends: Friend[] }) {
  await atomicWrite(FRIENDS_FILE, JSON.stringify(data, null, 2));
}

// Migrate a potentially-old WatchedMovie (no TMDB fields) to the unified Movie type.
function migrateToMovie(m: Partial<Movie> & { slug: string; title: string; year: string }): Movie {
  return {
    slug: m.slug,
    title: m.title,
    year: m.year,
    letterboxd_url: m.letterboxd_url ?? `https://letterboxd.com/film/${m.slug}/`,
    tmdb_id: m.tmdb_id ?? null,
    poster_url: m.poster_url ?? null,
    director: m.director ?? null,
    genres: m.genres ?? [],
    rating: m.rating ?? null,
    runtime: m.runtime ?? null,
  };
}

export async function getFriends(): Promise<Friend[]> {
  const data = await readFriendsFile();
  return data.friends.map((f) => {
    // Support old field name (tmdb_enriched) from data written before the rename.
    // Old semantics: tmdb_enriched=true meant "done"; new enrichment_pending=true means "needs enrichment".
    const raw = f as Friend & { tmdb_enriched?: boolean; enrichment_pending?: boolean };
    const enrichment_pending = raw.enrichment_pending ?? (raw.tmdb_enriched === false ? true : false);
    return {
      ...raw,
      enrichment_pending,
      watched: (raw.watched ?? []).map((m) => migrateToMovie(m as Parameters<typeof migrateToMovie>[0])),
      favourites: (raw.favourites ?? []).map((m) => migrateToMovie(m as Parameters<typeof migrateToMovie>[0])),
    };
  });
}

export async function getFriend(username: string): Promise<Friend | null> {
  const friends = await getFriends();
  return friends.find((f) => f.username.toLowerCase() === username.toLowerCase()) ?? null;
}

export async function upsertFriend(friend: Friend): Promise<void> {
  return enqueue('friends', async () => {
    const data = await readFriendsFile();
    const idx = data.friends.findIndex(
      (f) => f.username.toLowerCase() === friend.username.toLowerCase()
    );
    if (idx >= 0) {
      data.friends[idx] = friend;
    } else {
      data.friends.push(friend);
    }
    await writeFriendsFile(data);
  });
}

export async function deleteFriend(username: string): Promise<void> {
  return enqueue('friends', async () => {
    const data = await readFriendsFile();
    data.friends = data.friends.filter(
      (f) => f.username.toLowerCase() !== username.toLowerCase()
    );
    await writeFriendsFile(data);
  });
}

async function readListsFile(): Promise<{ lists: LetterboxdList[] }> {
  try {
    const content = await fs.readFile(LISTS_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return { lists: [] };
  }
}

async function writeListsFile(data: { lists: LetterboxdList[] }) {
  await atomicWrite(LISTS_FILE, JSON.stringify(data, null, 2));
}

export async function getLists(): Promise<LetterboxdList[]> {
  const data = await readListsFile();
  return data.lists.map((l) => {
    // Support old field name (tmdb_enriched) from data written before the rename.
    const raw = l as LetterboxdList & { tmdb_enriched?: boolean; enrichment_pending?: boolean };
    const enrichment_pending = raw.enrichment_pending ?? (raw.tmdb_enriched === false ? true : false);
    return { ...raw, enrichment_pending };
  });
}

export async function upsertList(list: LetterboxdList): Promise<void> {
  return enqueue('lists', async () => {
    const data = await readListsFile();
    const idx = data.lists.findIndex((l) => l.id === list.id);
    if (idx >= 0) {
      data.lists[idx] = list;
    } else {
      data.lists.push(list);
    }
    await writeListsFile(data);
  });
}

export async function deleteList(id: string): Promise<void> {
  return enqueue('lists', async () => {
    const data = await readListsFile();
    data.lists = data.lists.filter((l) => l.id !== id);
    await writeListsFile(data);
  });
}

export async function getSettings(): Promise<Settings> {
  try {
    const content = await fs.readFile(SETTINGS_FILE, 'utf-8');
    const stored: Settings = JSON.parse(content);
    return {
      ...stored,
      tmdb_api_key: process.env.TMDB_API_KEY || stored.tmdb_api_key,
    };
  } catch {
    return { tmdb_api_key: process.env.TMDB_API_KEY || null };
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  await atomicWrite(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}
