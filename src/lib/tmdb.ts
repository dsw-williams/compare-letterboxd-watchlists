import { Movie } from './types';
import { getFriend, upsertFriend, getLists, upsertList } from './storage';

const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w342';

const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 200;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface TMDBSearchResult {
  id: number;
  title: string;
  poster_path: string | null;
  genre_ids: number[];
  vote_average: number;
}

interface TMDBMovieDetail {
  runtime: number | null;
  credits?: {
    crew: Array<{ job: string; name: string }>;
  };
}

interface TMDBGenre {
  id: number;
  name: string;
}

let genreCache: Record<number, string> | null = null;

async function getGenreMap(apiKey: string): Promise<Record<number, string>> {
  if (genreCache) return genreCache;
  const res = await fetch(`${BASE_URL}/genre/movie/list?api_key=${apiKey}&language=en-US`);
  if (!res.ok) return {};
  const data = await res.json();
  const map: Record<number, string> = {};
  for (const g of data.genres ?? []) {
    map[(g as TMDBGenre).id] = (g as TMDBGenre).name;
  }
  genreCache = map;
  return map;
}

// Normalise a title to match the Letterboxd slug format for verification.
// NFD decomposition converts accented chars to base + combining mark (e.g. ü → u + ̈),
// then we strip the combining marks so "Vera Brühne" → "vera-bruhne" not "vera-br-hne".
function normaliseForSlug(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Check if the TMDB title is a plausible match for the Letterboxd slug.
function slugMatchesTitle(slug: string, tmdbTitle: string): boolean {
  const normalised = normaliseForSlug(tmdbTitle);
  return slug === normalised || slug.startsWith(normalised + '-') || slug.includes(normalised);
}

async function enrichOneMovie(
  movie: Movie,
  apiKey: string,
  genreMap: Record<number, string>
): Promise<Movie> {
  try {
    const query = encodeURIComponent(movie.title);
    let result: TMDBSearchResult | null = null;

    // Strategy 1: title + year, prefer slug-matching result
    if (movie.year) {
      const res = await fetch(
        `${BASE_URL}/search/movie?query=${query}&year=${movie.year}&api_key=${apiKey}`
      );
      if (res.ok) {
        const results: TMDBSearchResult[] = (await res.json()).results ?? [];
        result = results.find((r) => slugMatchesTitle(movie.slug, r.title)) ?? results[0] ?? null;
      }
    }

    // Strategy 2: title only — catches festival-year vs release-year mismatches
    if (!result) {
      const res = await fetch(`${BASE_URL}/search/movie?query=${query}&api_key=${apiKey}`);
      if (res.ok) {
        const results: TMDBSearchResult[] = (await res.json()).results ?? [];
        result = results.find((r) => slugMatchesTitle(movie.slug, r.title)) ?? results[0] ?? null;
      }
    }

    if (!result) return movie;

    let runtime: number | null = null;
    let director: string | null = null;
    try {
      const detailRes = await fetch(
        `${BASE_URL}/movie/${result.id}?append_to_response=credits&api_key=${apiKey}`
      );
      if (detailRes.ok) {
        const detail: TMDBMovieDetail = await detailRes.json();
        runtime = detail.runtime || null;
        director = detail.credits?.crew.find((c) => c.job === 'Director')?.name ?? null;
      }
    } catch { /* fall through */ }

    return {
      ...movie,
      tmdb_id: result.id,
      poster_url: result.poster_path ? `${IMAGE_BASE}${result.poster_path}` : null,
      genres: (result.genre_ids ?? []).map((id) => genreMap[id]).filter(Boolean),
      rating: result.vote_average ?? null,
      runtime,
      director,
    };
  } catch {
    return movie;
  }
}

// Skip already-enriched movies (tmdb_id !== null).
// Process unenriched movies in parallel batches of 5 with 200ms inter-batch delay.
export async function enrichMovies(movies: Movie[], apiKey: string): Promise<Movie[]> {
  const needsEnrichment = movies.filter((m) => m.tmdb_id === null);
  if (needsEnrichment.length === 0) return movies;

  const genreMap = await getGenreMap(apiKey);
  const newlyEnriched: Movie[] = [];

  for (let i = 0; i < needsEnrichment.length; i += BATCH_SIZE) {
    const batch = needsEnrichment.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map((m) => enrichOneMovie(m, apiKey, genreMap)));
    newlyEnriched.push(...results);
    if (i + BATCH_SIZE < needsEnrichment.length) await sleep(BATCH_DELAY_MS);
  }

  // Rebuild in original order, slotting newly enriched movies back by slug
  const enrichedBySlug = new Map(newlyEnriched.map((m) => [m.slug, m]));
  return movies.map((m) => enrichedBySlug.get(m.slug) ?? m);
}

export async function enrichAndSaveFriend(username: string, apiKey: string): Promise<void> {
  const friend = await getFriend(username);
  if (!friend) return;
  // Enrich watchlist and favourites (max 4) — watched is intentionally skipped (too large, not displayed)
  const [watchlist, favourites] = await Promise.all([
    enrichMovies(friend.watchlist, apiKey),
    enrichMovies(friend.favourites, apiKey),
  ]);
  await upsertFriend({ ...friend, watchlist, favourites, enrichment_pending: false });
}

export async function enrichAndSaveList(id: string, apiKey: string): Promise<void> {
  const lists = await getLists();
  const list = lists.find((l) => l.id === id);
  if (!list) return;
  const enriched = await enrichMovies(list.movies, apiKey);
  await upsertList({ ...list, movies: enriched, enrichment_pending: false });
}
