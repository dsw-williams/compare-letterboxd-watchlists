import Link from 'next/link';

const BACKDROP_URL = 'https://image.tmdb.org/t/p/original/ywSZYk8D8kOt572L6k2SBDbdlEC.jpg';

export default function NotFound() {
  return (
    <div className="h-[calc(100vh-72px)] bg-bg-primary relative overflow-hidden flex flex-col items-center justify-center">

      {/* ── Backdrop ─────────────────────────────────────── */}
      <div className="absolute inset-0 bg-bg-primary">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={BACKDROP_URL}
            alt=""
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #14181c 0%, #14181ce6 15%, #14181cb3 35%, #14181c66 55%, #14181c26 75%, transparent 100%)' }} />
          <div className="absolute inset-y-0 left-0 w-64" style={{ background: 'linear-gradient(to right, #14181c 0%, #14181cd9 20%, #14181c99 50%, #14181c33 75%, transparent 100%)' }} />
          <div className="absolute inset-y-0 right-0 w-64" style={{ background: 'linear-gradient(to left, #14181c 0%, #14181cd9 20%, #14181c99 50%, #14181c33 75%, transparent 100%)' }} />
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 gap-8">

        {/* Quote */}
        <div className="flex flex-col gap-3 max-w-lg">
          <p className="text-text-primary text-4xl font-black leading-tight" style={{ textShadow: '0 2px 16px rgba(0,0,0,0.9)' }}>
            &ldquo;I&apos;m sorry Dave, I&apos;m afraid I can&apos;t do that.&rdquo;
          </p>
          <p className="text-white/70 text-sm" style={{ textShadow: '0 1px 8px rgba(0,0,0,0.9)' }}>
            — HAL 9000, <span className="italic">2001: A Space Odyssey</span>
          </p>
        </div>

        {/* Back link */}
        <Link
          href="/"
          className="text-sm text-white/80 border border-white/25 rounded-full px-5 py-2 hover:text-white hover:border-white/50 transition-colors backdrop-blur-sm bg-black/20"
        >
          ← Back to watchlists
        </Link>
      </div>

      {/* ── Film credit ───────────────────────────────────── */}
      <p className="absolute bottom-4 left-0 right-0 text-[11px] text-white/40 select-none text-center">
        2001: A Space Odyssey (1968) · dir. Stanley Kubrick
      </p>

    </div>
  );
}
