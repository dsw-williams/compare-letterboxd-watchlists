import { NextRequest, NextResponse } from 'next/server';
import { getFriend, upsertFriend, getSettings } from '@/lib/storage';
import { fetchProfileInfo, fetchAllWatched, fetchWatchlist } from '@/lib/letterboxd';
import { enrichAndSaveFriend } from '@/lib/tmdb';

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

    const friend = {
      ...existing,
      avatar_url: profile.avatar_url,
      watchlist,
      watched,
      last_synced: new Date().toISOString(),
      tmdb_enriched: !settings.tmdb_api_key,
    };

    await upsertFriend(friend);

    if (settings.tmdb_api_key) {
      enrichAndSaveFriend(params.username, settings.tmdb_api_key).catch(console.error);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Sync failed' },
      { status: 500 }
    );
  }
}
