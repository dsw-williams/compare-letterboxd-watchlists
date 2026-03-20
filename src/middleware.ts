import { NextRequest, NextResponse } from 'next/server';

// Must use Node.js runtime so runtime-injected env vars (e.g. from Docker/Unraid)
// are visible via process.env. Edge Runtime only sees build-time env vars.
export const runtime = 'nodejs';

const ALWAYS_ALLOW = [
  '/setup',
  '/_next/',
  '/favicon.ico',
  '/icons/',
  '/apple-icon',
  '/opengraph-image',
];

export function middleware(request: NextRequest) {
  if (process.env.TMDB_API_KEY) return NextResponse.next();

  const { pathname } = request.nextUrl;
  const isAllowed = ALWAYS_ALLOW.some(
    (p) => pathname === p || pathname.startsWith(p)
  );
  if (isAllowed) return NextResponse.next();

  const setupUrl = request.nextUrl.clone();
  setupUrl.pathname = '/setup';
  return NextResponse.redirect(setupUrl, 307);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
