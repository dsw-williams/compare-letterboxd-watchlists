import fs from 'fs/promises';
import path from 'path';
import { Friend, Settings } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const FRIENDS_FILE = path.join(DATA_DIR, 'friends.json');
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
  return data.friends;
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

export async function getSettings(): Promise<Settings> {
  try {
    const content = await fs.readFile(SETTINGS_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return { tmdb_api_key: null };
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}
