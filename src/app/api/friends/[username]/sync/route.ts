import { NextRequest, NextResponse } from 'next/server';
import { getFriend, upsertFriend, getSettings } from '@/lib/storage';
import { fetchProfileInfo, fetchAllWatched, fetchWatchlist } from '@/lib/letterboxd';
import { enrichMovies } from '@/lib/tmdb';

export async function POST(
  _req: NextRequest,
  { params }: { params: { username: string } }
) {
  const existing = await getFriend(params.username);
  if (!existing) {
    return NextResponse.json({ error: 'Friend not found' }, { status: 404 });
  }

  try {
    const profile = await fetchProfileInfo(params.username);
    const watched = await fetchAllWatched(params.username);
    const watchlist = await fetchWatchlist(params.username);

    const settings = await getSettings();
    let enrichedWatchlist = watchlist;

    if (settings.tmdb_api_key) {
      enrichedWatchlist = await enrichMovies(watchlist, settings.tmdb_api_key);
    }

    const friend = {
      ...existing,
      avatar_url: profile.avatar_url,
      watchlist: enrichedWatchlist,
      watched,
      last_synced: new Date().toISOString(),
    };

    await upsertFriend(friend);
    return NextResponse.json(friend);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Sync failed' },
      { status: 500 }
    );
  }
}
