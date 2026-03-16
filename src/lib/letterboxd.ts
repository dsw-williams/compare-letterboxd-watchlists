import { spawn } from 'child_process';
import path from 'path';
import { Movie, WatchedMovie } from './types';

const SCRIPT_PATH = path.join(process.cwd(), 'scripts', 'letterboxd_scraper.py');
const PYTHON = process.env.PYTHON_EXECUTABLE ?? 'python3';

function spawnPython<T>(command: string, username: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const proc = spawn(PYTHON, [SCRIPT_PATH, command, username]);

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => { stdout += data; });
    proc.stderr.on('data', (data) => { stderr += data; });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || `Scraper exited with code ${code}`));
        return;
      }
      try {
        const result = JSON.parse(stdout);
        if (result && typeof result === 'object' && 'error' in result) {
          reject(new Error(result.error));
          return;
        }
        resolve(result as T);
      } catch {
        reject(new Error(`Failed to parse scraper output: ${stdout.slice(0, 200)}`));
      }
    });

    proc.on('error', (err) => {
      reject(new Error(
        err.message.includes('ENOENT')
          ? 'python3 not found. Install Python 3 and run: pip3 install letterboxdpy'
          : `Failed to start scraper: ${err.message}`
      ));
    });
  });
}

export async function fetchProfileInfo(
  username: string
): Promise<{ avatar_url: string | null }> {
  return spawnPython<{ avatar_url: string | null }>('profile', username);
}

export async function fetchAllWatched(
  username: string,
  onProgress?: (page: number) => void
): Promise<WatchedMovie[]> {
  onProgress?.(1);
  const movies = await spawnPython<Array<{ slug: string; title: string; year: string }>>('watched', username);
  return movies.map(({ slug, title, year }) => ({
    slug,
    title,
    year,
    letterboxd_url: `https://letterboxd.com/film/${slug}/`,
  }));
}

export async function fetchRecentWatched(username: string): Promise<WatchedMovie[]> {
  return fetchAllWatched(username);
}

export async function fetchWatchlist(username: string): Promise<Movie[]> {
  const movies = await spawnPython<Array<{ slug: string; title: string; year: string }>>('watchlist', username);
  return movies.map(({ slug, title, year }) => ({
    title,
    year,
    slug,
    director: null,
    poster_url: null,
    letterboxd_url: `https://letterboxd.com/film/${slug}/`,
    tmdb_id: null,
    genres: [],
    rating: null,
    runtime: null,
  }));
}
