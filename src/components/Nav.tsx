'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { Settings } from 'lucide-react';

export default function Nav() {
  const pathname = usePathname();
  const isSettings = pathname === '/settings';

  return (
    <nav className="bg-bg-primary border-b border-border-subtle sticky top-0 z-50">
      <div className="max-w-[1150px] mx-auto px-6 h-[72px] flex items-center justify-between">
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
            <Settings size={18} color="#9ba3af" />
          </div>
        </Link>
      </div>
    </nav>
  );
}
