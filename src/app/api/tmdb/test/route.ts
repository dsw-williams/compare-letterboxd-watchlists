import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const apiKey = process.env.TMDB_API_KEY ?? null;
  if (!apiKey) {
    return NextResponse.json({ key_set: false, tmdb_ok: false, error: 'TMDB_API_KEY env var not set' });
  }

  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/configuration?api_key=${apiKey}`,
      { cache: 'no-store' }
    );
    const body = await res.text();
    if (res.ok) {
      return NextResponse.json({ key_set: true, tmdb_ok: true, status: res.status });
    }
    return NextResponse.json({ key_set: true, tmdb_ok: false, status: res.status, error: body });
  } catch (err) {
    return NextResponse.json({ key_set: true, tmdb_ok: false, error: String(err) });
  }
}
