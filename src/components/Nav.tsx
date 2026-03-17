'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Nav() {
  const pathname = usePathname();
  const isSettings = pathname === '/settings';

  return (
    <nav
      style={{
        backgroundColor: '#141414',
        borderBottom: '1px solid #2a2d35',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div className="nav-inner" style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 24px',
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
        <div
          style={{
            width: '28px',
            height: '28px',
            backgroundColor: '#00c030',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: '16px', lineHeight: 1 }}>🎬</span>
        </div>
        <span style={{ color: '#ffffff', fontWeight: 900, fontSize: '16px', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'var(--font-display), system-ui, sans-serif' }}>
          Watchlist
        </span>
      </Link>

      <Link href="/settings">
        <div
          style={{
            width: '36px',
            height: '36px',
            backgroundColor: isSettings ? '#252830' : '#1e2128',
            border: `1px solid ${isSettings ? '#00c030' : '#2a2d35'}`,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
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
