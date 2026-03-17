import { NextRequest } from 'next/server';
import { getFriend, upsertFriend, getSettings } from '@/lib/storage';
import { fetchRecentWatched, fetchWatchlist, fetchFavourites } from '@/lib/letterboxd';
import { enrichAndSaveFriend } from '@/lib/tmdb';

export async function POST(
  _req: NextRequest,
  { params }: { params: { username: string } }
) {
  const existing = await getFriend(params.username);
  if (!existing) {
    return Response.json({ error: 'Friend not found' }, { status: 404 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(data: object) {
        controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'));
      }

      try {
        const settings = await getSettings();

        send({ step: 'watched', pct: 0, message: 'Fetching watched films...' });
        const recentWatched = await fetchRecentWatched(params.username);

        send({ step: 'watched', pct: 33, message: 'Fetching watchlist...' });
        const watchlist = await fetchWatchlist(params.username);

        send({ step: 'watchlist', pct: 66, message: 'Fetching favourites...' });
        const favourites = await fetchFavourites(params.username);

        // Merge new watched entries — deduplicate by slug, new items first
        const existingSlugs = new Set(existing.watched.map((m) => m.slug));
        const newMovies = recentWatched.filter((m) => !existingSlugs.has(m.slug));

        const friend = {
          ...existing,
          watchlist,
          watched: [...newMovies, ...existing.watched],
          favourites,
          last_synced: new Date().toISOString(),
          tmdb_enriched: !settings.tmdb_api_key,
        };

        await upsertFriend(friend);
        send({ step: 'done', pct: 100 });
        controller.close();

        if (settings.tmdb_api_key) {
          enrichAndSaveFriend(params.username, settings.tmdb_api_key).catch(console.error);
        }
      } catch (err) {
        send({ step: 'error', message: err instanceof Error ? err.message : 'Sync failed' });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
