import { spawn } from 'child_process';
import path from 'path';
import { Movie } from './types';

const SCRIPT_PATH = path.join(process.cwd(), 'scripts', 'letterboxd_scraper.py');
const PYTHON = process.env.PYTHON_EXECUTABLE ?? 'python3';
const TIMEOUT_MS = 120_000; // 2 minutes — enough for large watched lists

function spawnPython<T>(command: string, ...args: string[]): Promise<T> {
  return new Promise((resolve, reject) => {
    const proc = spawn(PYTHON, [SCRIPT_PATH, command, ...args]);

    let stdout = '';
    let stderr = '';
    let settled = false;

    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      proc.kill('SIGTERM');
      reject(new Error(`Scraper timed out after ${TIMEOUT_MS / 1000}s (command: ${command})`));
    }, TIMEOUT_MS);

    proc.stdout.on('data', (data) => { stdout += data; });
    proc.stderr.on('data', (data) => { stderr += data; });

    proc.on('close', (code) => {
      clearTimeout(timeout);
      if (settled) return;
      settled = true;
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
      clearTimeout(timeout);
      if (settled) return;
      settled = true;
      reject(new Error(
        err.message.includes('ENOENT')
          ? 'python3 not found. Install Python 3 and run: pip3 install letterboxdpy'
          : `Failed to start scraper: ${err.message}`
      ));
    });
  });
}

function toMovie({ slug, title, year }: { slug: string; title: string; year: string }): Movie {
  return {
    slug,
    title,
    year,
    letterboxd_url: `https://letterboxd.com/film/${slug}/`,
    tmdb_id: null,
    poster_url: null,
    director: null,
    genres: [],
    rating: null,
    runtime: null,
  };
}

export async function fetchProfileInfo(
  username: string
): Promise<{ avatar_url: string | null }> {
  return spawnPython<{ avatar_url: string | null }>('profile', username);
}

export async function fetchAllWatched(username: string): Promise<Movie[]> {
  const movies = await spawnPython<Array<{ slug: string; title: string; year: string }>>('watched', username);
  return movies.map(toMovie);
}

export async function fetchWatchedSince(username: string, knownSlugs: string[]): Promise<Movie[]> {
  const movies = await spawnPython<Array<{ slug: string; title: string; year: string }>>(
    'watched_since',
    username,
    JSON.stringify(knownSlugs)
  );
  return movies.map(toMovie);
}

export async function fetchWatchlist(username: string): Promise<Movie[]> {
  const movies = await spawnPython<Array<{ slug: string; title: string; year: string }>>('watchlist', username);
  return movies.map(toMovie);
}

export async function fetchFavourites(username: string): Promise<Movie[]> {
  const movies = await spawnPython<Array<{ slug: string; title: string; year: string }>>('favourites', username);
  return movies.map(toMovie);
}

export async function fetchList(
  owner: string,
  slug: string
): Promise<{ title: string; movies: Movie[] }> {
  const result = await spawnPython<{ title: string; movies: Array<{ slug: string; title: string; year: string }> }>('list', owner, slug);
  return {
    title: result.title,
    movies: result.movies.map(toMovie),
  };
}
