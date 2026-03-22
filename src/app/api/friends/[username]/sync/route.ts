import { NextRequest } from 'next/server';
import { getFriend, upsertFriend, getSettings } from '@/lib/storage';

export const runtime = 'nodejs';
import { fetchWatchedSince, fetchWatchlist, fetchFavourites } from '@/lib/letterboxd';
import { createStreamingResponse, maybeTriggerFriendEnrichment } from '@/lib/streaming';

export async function POST(
  _req: NextRequest,
  { params }: { params: { username: string } }
) {
  const existing = await getFriend(params.username);
  if (!existing) {
    return Response.json({ error: 'Friend not found' }, { status: 404 });
  }

  return createStreamingResponse(async (send) => {
    const settings = await getSettings();

    send({ step: 'watched', pct: 0, message: 'Fetching watched films...' });
    const knownSlugs = existing.watched.map((m) => m.slug);
    const newWatched = await fetchWatchedSince(params.username, knownSlugs);

    send({ step: 'watched', pct: 33, message: 'Fetching watchlist...' });
    const freshWatchlist = await fetchWatchlist(params.username);

    send({ step: 'watchlist', pct: 66, message: 'Fetching favourites...' });
    const freshFavourites = await fetchFavourites(params.username);

    // Carry over existing TMDB enrichment for films already in the watchlist/favourites.
    // fetchWatchlist returns Movie[] with all TMDB fields null — merging preserves posters
    // and enriched data so they're available immediately, and enrichMovies will skip them.
    const existingWatchlistBySlug = new Map(existing.watchlist.map((m) => [m.slug, m]));
    const watchlist = freshWatchlist.map((m) => existingWatchlistBySlug.get(m.slug) ?? m);

    const existingFavsBySlug = new Map(existing.favourites.map((m) => [m.slug, m]));
    const favourites = freshFavourites.map((m) => existingFavsBySlug.get(m.slug) ?? m);

    // Deduplicate by slug just in case, new items first
    const existingSlugs = new Set(existing.watched.map((m) => m.slug));
    const newMovies = newWatched.filter((m) => !existingSlugs.has(m.slug));

    const friend = {
      ...existing,
      watchlist,
      watched: [...newMovies, ...existing.watched],
      favourites,
      last_synced: new Date().toISOString(),
      // enrichment_pending: true means TMDB enrichment is needed.
      // When there is no API key, enrichment is not possible, so mark it not pending.
      enrichment_pending: !!settings.tmdb_api_key,
    };

    await upsertFriend(friend);
    send({ step: 'done', pct: 100 });

    maybeTriggerFriendEnrichment(params.username, settings);
  });
}
