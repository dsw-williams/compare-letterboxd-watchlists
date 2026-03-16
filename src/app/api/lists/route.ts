import { NextRequest, NextResponse } from 'next/server';
import { getLists, upsertList } from '@/lib/storage';
import { fetchList } from '@/lib/letterboxd';
import { enrichAndSaveList } from '@/lib/tmdb';
import { getSettings } from '@/lib/storage';

export async function GET() {
  const lists = await getLists();
  return NextResponse.json(lists);
}

// Parses a Letterboxd list URL like https://letterboxd.com/owner/list/slug/
function parseListUrl(url: string): { owner: string; slug: string } | null {
  const match = url.trim().match(/letterboxd\.com\/([^/]+)\/list\/([^/]+)/);
  if (!match) return null;
  return { owner: match[1].toLowerCase(), slug: match[2].toLowerCase() };
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const url: string = (body.url ?? '').trim();

  if (!url) {
    return NextResponse.json({ error: 'List URL required' }, { status: 400 });
  }

  const parsed = parseListUrl(url);
  if (!parsed) {
    return NextResponse.json(
      { error: 'Invalid Letterboxd list URL. Expected format: letterboxd.com/username/list/list-name/' },
      { status: 400 }
    );
  }

  const { owner, slug } = parsed;
  const id = `${owner}/${slug}`;

  const existing = (await getLists()).find((l) => l.id === id);
  if (existing) {
    return NextResponse.json({ error: 'List already imported' }, { status: 409 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(data: object) {
        controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'));
      }

      try {
        send({ step: 'scraping', message: `Scraping list from ${owner}...` });
        const { title, movies } = await fetchList(owner, slug);

        const settings = await getSettings();

        const list = {
          id,
          name: title,
          owner,
          slug,
          movies,
          last_synced: new Date().toISOString(),
          tmdb_enriched: !settings.tmdb_api_key,
        };

        await upsertList(list);
        send({ step: 'done' });
        controller.close();

        if (settings.tmdb_api_key) {
          enrichAndSaveList(id, settings.tmdb_api_key).catch(console.error);
        }
      } catch (err) {
        send({ step: 'error', message: err instanceof Error ? err.message : 'Unknown error' });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
