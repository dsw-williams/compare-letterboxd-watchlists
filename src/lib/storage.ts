import fs from 'fs/promises';
import path from 'path';
import { Friend, WatchedMovie, LetterboxdList, Settings } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const FRIENDS_FILE = path.join(DATA_DIR, 'friends.json');
const LISTS_FILE = path.join(DATA_DIR, 'lists.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
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
  await ensureDataDir();
  await fs.writeFile(FRIENDS_FILE, JSON.stringify(data, null, 2));
}

export async function getFriends(): Promise<Friend[]> {
  const data = await readFriendsFile();
  return data.friends.map((f) => {
    const raw = f as Friend & { tmdb_enriched?: boolean; favourites?: WatchedMovie[] };
    return { ...raw, tmdb_enriched: raw.tmdb_enriched ?? true, favourites: raw.favourites ?? [] };
  });
}

export async function getFriend(username: string): Promise<Friend | null> {
  const friends = await getFriends();
  return friends.find((f) => f.username.toLowerCase() === username.toLowerCase()) ?? null;
}

export async function upsertFriend(friend: Friend): Promise<void> {
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
}

export async function deleteFriend(username: string): Promise<void> {
  const data = await readFriendsFile();
  data.friends = data.friends.filter(
    (f) => f.username.toLowerCase() !== username.toLowerCase()
  );
  await writeFriendsFile(data);
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
  await ensureDataDir();
  await fs.writeFile(LISTS_FILE, JSON.stringify(data, null, 2));
}

export async function getLists(): Promise<LetterboxdList[]> {
  const data = await readListsFile();
  return data.lists.map((l) => {
    const raw = l as LetterboxdList & { tmdb_enriched?: boolean };
    return { ...raw, tmdb_enriched: raw.tmdb_enriched ?? true };
  });
}

export async function upsertList(list: LetterboxdList): Promise<void> {
  const data = await readListsFile();
  const idx = data.lists.findIndex((l) => l.id === list.id);
  if (idx >= 0) {
    data.lists[idx] = list;
  } else {
    data.lists.push(list);
  }
  await writeListsFile(data);
}

export async function deleteList(id: string): Promise<void> {
  const data = await readListsFile();
  data.lists = data.lists.filter((l) => l.id !== id);
  await writeListsFile(data);
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
  await ensureDataDir();
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}
