import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Dev only' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim();
  if (!q) return NextResponse.json({ error: 'Missing q' }, { status: 400 });

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'No TMDB_API_KEY' }, { status: 500 });

  const url = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(q)}&api_key=${apiKey}&language=en-US&page=1`;
  const res = await fetch(url);
  if (!res.ok) return NextResponse.json({ error: 'TMDB error' }, { status: 502 });

  const data = await res.json();
  const results = (data.results ?? []).slice(0, 12).map((m: Record<string, unknown>) => ({
    id: m.id,
    title: m.title,
    year: m.release_date ? String(m.release_date).slice(0, 4) : '',
    poster_url: m.poster_path ? `https://image.tmdb.org/t/p/w185${m.poster_path}` : null,
  }));

  return NextResponse.json(results);
}
