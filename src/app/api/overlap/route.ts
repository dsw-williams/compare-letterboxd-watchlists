import { NextRequest, NextResponse } from 'next/server';
import { getFriend } from '@/lib/storage';
import { Movie } from '@/lib/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const usernamesParam = searchParams.get('usernames') ?? '';
  const usernames = usernamesParam
    .split(',')
    .map((u) => u.trim())
    .filter(Boolean);

  if (usernames.length < 2) {
    return NextResponse.json([]);
  }

  // Fetch all friends
  const friends = await Promise.all(usernames.map((u) => getFriend(u)));
  const validFriends = friends.filter(Boolean) as Awaited<ReturnType<typeof getFriend>>[];

  // Map slug -> { movie, friends who have it }
  const slugMap = new Map<string, { movie: Movie; friends: string[] }>();

  for (const friend of validFriends) {
    if (!friend) continue;
    for (const movie of friend.watchlist) {
      const existing = slugMap.get(movie.slug);
      if (existing) {
        existing.friends.push(friend.username);
        // Keep the most-enriched version of the movie
        if (!existing.movie.poster_url && movie.poster_url) {
          existing.movie = movie;
          existing.friends = existing.friends; // keep same array
        }
      } else {
        slugMap.set(movie.slug, { movie, friends: [friend.username] });
      }
    }
  }

  // All films from any selected watchlist, sorted by overlap count then rating
  const overlap = Array.from(slugMap.values());

  overlap.sort((a, b) => {
    if (b.friends.length !== a.friends.length) return b.friends.length - a.friends.length;
    return (b.movie.rating ?? 0) - (a.movie.rating ?? 0);
  });

  return NextResponse.json(overlap);
}
