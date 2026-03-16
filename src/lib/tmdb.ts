import { Movie } from './types';
import { getFriend, upsertFriend, getLists, upsertList } from './storage';

const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w342';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface TMDBSearchResult {
  id: number;
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
  const res = await fetch(
    `${BASE_URL}/genre/movie/list?api_key=${apiKey}&language=en-US`
  );
  if (!res.ok) return {};
  const data = await res.json();
  const map: Record<number, string> = {};
  for (const g of data.genres ?? []) {
    map[(g as TMDBGenre).id] = (g as TMDBGenre).name;
  }
  genreCache = map;
  return map;
}

export async function enrichMovies(movies: Movie[], apiKey: string): Promise<Movie[]> {
  const genreMap = await getGenreMap(apiKey);
  const enriched: Movie[] = [];

  for (const movie of movies) {
    try {
      const query = encodeURIComponent(movie.title);
      const year = movie.year ? `&year=${movie.year}` : '';
      const url = `${BASE_URL}/search/movie?query=${query}${year}&api_key=${apiKey}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const result: TMDBSearchResult | undefined = data.results?.[0];
        if (result) {
          let runtime: number | null = null;
          let director: string | null = null;
          try {
            const detailRes = await fetch(`${BASE_URL}/movie/${result.id}?append_to_response=credits&api_key=${apiKey}`);
            if (detailRes.ok) {
              const detail: TMDBMovieDetail = await detailRes.json();
              runtime = detail.runtime || null;
              director = detail.credits?.crew.find((c) => c.job === 'Director')?.name ?? null;
            }
          } catch { /* fall through */ }
          enriched.push({
            ...movie,
            tmdb_id: result.id,
            poster_url: result.poster_path ? `${IMAGE_BASE}${result.poster_path}` : null,
            genres: (result.genre_ids ?? []).map((id) => genreMap[id]).filter(Boolean),
            rating: result.vote_average ?? null,
            runtime,
            director,
          });
          await sleep(25);
          continue;
        }
      }
    } catch {
      // fall through
    }
    enriched.push(movie);
  }
  return enriched;
}

export async function enrichAndSaveFriend(username: string, apiKey: string): Promise<void> {
  const friend = await getFriend(username);
  if (!friend) return;
  const enriched = await enrichMovies(friend.watchlist, apiKey);
  await upsertFriend({ ...friend, watchlist: enriched, tmdb_enriched: true });
}

export async function enrichAndSaveList(id: string, apiKey: string): Promise<void> {
  const lists = await getLists();
  const list = lists.find((l) => l.id === id);
  if (!list) return;
  const enriched = await enrichMovies(list.movies, apiKey);
  await upsertList({ ...list, movies: enriched, tmdb_enriched: true });
}
