import { NextRequest, NextResponse } from 'next/server';
import { getFriends, getFriend, upsertFriend, getSettings } from '@/lib/storage';

export const runtime = 'nodejs';
import { fetchProfileInfo, fetchAllWatched, fetchWatchlist, fetchFavourites } from '@/lib/letterboxd';
import { createStreamingResponse, maybeTriggerFriendEnrichment } from '@/lib/streaming';

export async function GET() {
  const friends = await getFriends();
  return NextResponse.json(friends);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const username: string = (body.username ?? '').trim().toLowerCase();

  if (!username) {
    return NextResponse.json({ error: 'Username required' }, { status: 400 });
  }

  const existing = await getFriend(username);
  if (existing) {
    return NextResponse.json({ error: 'Friend already added' }, { status: 409 });
  }

  return createStreamingResponse(async (send) => {
    send({ step: 'profile', message: 'Fetching profile...' });
    const profile = await fetchProfileInfo(username);

    send({ step: 'watched', message: 'Scraping watched films...' });
    const watched = await fetchAllWatched(username);

    send({ step: 'watchlist', message: 'Scraping watchlist...' });
    const watchlist = await fetchWatchlist(username);

    send({ step: 'favourites', message: 'Fetching favourite films...' });
    const favourites = await fetchFavourites(username);

    const settings = await getSettings();

    const friend = {
      username,
      avatar_url: profile.avatar_url,
      watchlist,
      watched,
      favourites,
      last_synced: new Date().toISOString(),
      // enrichment_pending: true means TMDB enrichment is needed.
      // When there is no API key, enrichment is not possible, so mark it not pending.
      enrichment_pending: !!settings.tmdb_api_key,
    };

    await upsertFriend(friend);
    send({ step: 'done' });

    maybeTriggerFriendEnrichment(username, settings);
  });
}
