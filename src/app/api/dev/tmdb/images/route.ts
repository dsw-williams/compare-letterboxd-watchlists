import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Dev only' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'No TMDB_API_KEY' }, { status: 500 });

  const [imagesRes, detailsRes] = await Promise.all([
    fetch(`https://api.themoviedb.org/3/movie/${id}/images?api_key=${apiKey}`),
    fetch(`https://api.themoviedb.org/3/movie/${id}?append_to_response=credits&api_key=${apiKey}`),
  ]);

  if (!imagesRes.ok || !detailsRes.ok) {
    return NextResponse.json({ error: 'TMDB error' }, { status: 502 });
  }

  const [images, details] = await Promise.all([imagesRes.json(), detailsRes.json()]);

  const director = (details.credits?.crew ?? []).find(
    (c: { job: string }) => c.job === 'Director'
  )?.name ?? null;

  const backdrops: string[] = (images.backdrops ?? [])
    .slice(0, 20)
    .map((b: { file_path: string }) => b.file_path);

  const posters: string[] = (images.posters ?? [])
    .filter((p: { iso_639_1: string }) => !p.iso_639_1 || p.iso_639_1 === 'en')
    .slice(0, 20)
    .map((p: { file_path: string }) => p.file_path);

  return NextResponse.json({
    title: details.title ?? '',
    year: details.release_date ? String(details.release_date).slice(0, 4) : '',
    director,
    backdrops,
    posters,
  });
}
