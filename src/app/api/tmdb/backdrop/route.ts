import { NextResponse } from 'next/server';
import { getSettings } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BASE_URL = 'https://api.themoviedb.org/3';
const BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';
const POSTER_BASE = 'https://image.tmdb.org/t/p/w185';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface TMDBListMovie {
  id: number;
  title: string;
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
}

export async function GET() {
  const settings = await getSettings();
  if (!settings.tmdb_api_key) {
    return NextResponse.json({ backdrop_url: null, poster_movies: [] });
  }

  const apiKey = settings.tmdb_api_key;

  try {
    // Fetch two pages in parallel for a larger pool
    const [page1Res, page2Res] = await Promise.all([
      fetch(`${BASE_URL}/movie/popular?api_key=${apiKey}&language=en-US&page=1`, { cache: 'no-store' }),
      fetch(`${BASE_URL}/movie/popular?api_key=${apiKey}&language=en-US&page=2`, { cache: 'no-store' }),
    ]);

    const allMovies: TMDBListMovie[] = [];
    let tmdbError: string | null = null;
    if (page1Res.ok) {
      const d = await page1Res.json();
      allMovies.push(...(d.results ?? []));
    } else {
      tmdbError = `TMDB ${page1Res.status}: ${await page1Res.text().catch(() => 'no body')}`;
    }
    if (page2Res.ok) {
      const d = await page2Res.json();
      allMovies.push(...(d.results ?? []));
    }

    if (allMovies.length === 0) {
      return NextResponse.json({ backdrop_url: null, poster_movies: [], debug: tmdbError });
    }

    const shuffled = shuffle(allMovies);

    // Pick backdrop: first movie with a backdrop_path
    const backdropMovie = shuffled.find((m) => m.backdrop_path) ?? null;

    let title = '';
    let year = '';
    let director: string | null = null;
    let backdrop_url: string | null = null;

    if (backdropMovie) {
      title = backdropMovie.title;
      year = backdropMovie.release_date?.slice(0, 4) ?? '';
      backdrop_url = `${BACKDROP_BASE}${backdropMovie.backdrop_path}`;

      try {
        const detailRes = await fetch(
          `${BASE_URL}/movie/${backdropMovie.id}?append_to_response=credits&api_key=${apiKey}`,
          { cache: 'no-store' }
        );
        if (detailRes.ok) {
          const detail = await detailRes.json();
          director =
            detail.credits?.crew?.find(
              (c: { job: string; name: string }) => c.job === 'Director'
            )?.name ?? null;
        }
      } catch { /* fall through */ }
    }

    // Poster grid: take up to 20 movies with poster_path (exclude the backdrop movie)
    const posterMovies = shuffled
      .filter((m) => m.poster_path && m.id !== backdropMovie?.id)
      .slice(0, 20)
      .map((m) => ({
        id: m.id,
        poster_url: `${POSTER_BASE}${m.poster_path}`,
      }));

    return NextResponse.json({
      title,
      year,
      director,
      backdrop_url,
      poster_movies: posterMovies,
    });
  } catch (err) {
    return NextResponse.json({ backdrop_url: null, poster_movies: [], debug: String(err) });
  }
}
