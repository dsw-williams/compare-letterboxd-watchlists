import { NextRequest, NextResponse } from 'next/server';
import { getFriends, getFriend, upsertFriend } from '@/lib/storage';
import { fetchProfileInfo, fetchAllWatched, fetchWatchlist, fetchFavourites } from '@/lib/letterboxd';
import { enrichAndSaveFriend } from '@/lib/tmdb';
import { getSettings } from '@/lib/storage';

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

  // Use streaming response for progress
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(data: object) {
        controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'));
      }

      try {
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
          tmdb_enriched: !settings.tmdb_api_key,
        };

        await upsertFriend(friend);
        send({ step: 'done' });
        controller.close();

        if (settings.tmdb_api_key) {
          enrichAndSaveFriend(username, settings.tmdb_api_key).catch(console.error);
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
