'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

export default function Nav() {
  const pathname = usePathname();
  const isSettings = pathname === '/settings';

  return (
    <nav className="bg-bg-primary border-b border-border-subtle sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-6 h-12 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-[10px] no-underline">
          <div className="w-7 h-7 bg-accent-green rounded-[6px] flex items-center justify-center shrink-0">
            <span className="text-base leading-none">🎬</span>
          </div>
          <span className="text-text-primary font-black text-base tracking-[0.06em] uppercase">
            Watchlist
          </span>
        </Link>

        <Link href="/settings">
          <div
            className={clsx(
              'w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer border',
              isSettings
                ? 'bg-bg-card-hover border-accent-green'
                : 'bg-bg-card border-border-subtle'
            )}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ba3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
            </svg>
          </div>
        </Link>
      </div>
    </nav>
  );
}
