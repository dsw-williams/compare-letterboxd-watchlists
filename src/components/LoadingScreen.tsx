'use client';

import { useState, useEffect, useRef } from 'react';

type Phase = 'open' | 'action' | 'gone';

const MIN_MS = 1200;
const FALLBACK_MS = 4000;

export default function LoadingScreen() {
  const [phase, setPhase] = useState<Phase>('open');
  const startRef = useRef(Date.now());

  useEffect(() => {
    const handler = () => {
      const elapsed = Date.now() - startRef.current;
      const delay = Math.max(0, MIN_MS - elapsed);
      setTimeout(() => setPhase('action'), delay);
      setTimeout(() => setPhase('gone'), delay + 800);
    };
    window.addEventListener('app:ready', handler, { once: true });
    const fallback = setTimeout(() => handler(), FALLBACK_MS);
    return () => {
      window.removeEventListener('app:ready', handler);
      clearTimeout(fallback);
    };
  }, []);

  if (phase === 'gone') return null;

  return (
    <div
      // All layout-critical styles are inline — ensures the overlay covers the page
      // even before the Tailwind CSS file has loaded (prevents nav bar flash)
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: '#141414',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        opacity: phase === 'action' ? 0 : 1,
        transition: phase === 'action' ? 'opacity 400ms ease 500ms' : undefined,
      }}
    >
      {/* SVG Clapperboard
          viewBox starts at y=-55 to give room for the clapper arm when open at -38°.
          At -38° the top-right corner reaches approx y=-41 in SVG space. */}
      <svg
        width="120"
        height="150"
        viewBox="-5 -55 120 155"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="stripes" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="5" height="10" fill="#ffffff" />
            <rect x="5" width="5" height="10" fill="#1a1a1a" />
          </pattern>
        </defs>

        {/* Board body */}
        <rect x="5" y="30" width="100" height="70" rx="3" fill="#f5f5f5" stroke="#1a1a1a" strokeWidth="2.5" />

        {/* Header bar */}
        <rect x="5" y="30" width="100" height="16" fill="#1a1a1a" />
        <text x="55" y="42" textAnchor="middle" fill="#00c030" fontSize="7" fontWeight="bold" fontFamily="monospace" letterSpacing="1">WATCHLIST</text>

        {/* Info lines */}
        <line x1="5" y1="60" x2="105" y2="60" stroke="#cccccc" strokeWidth="1" />
        <line x1="5" y1="75" x2="105" y2="75" stroke="#cccccc" strokeWidth="1" />
        <line x1="5" y1="90" x2="105" y2="90" stroke="#cccccc" strokeWidth="1" />

        <text x="12" y="71" fill="#888888" fontSize="6" fontFamily="monospace">SCENE</text>
        <text x="55" y="71" fill="#888888" fontSize="6" fontFamily="monospace">TAKE</text>
        <text x="12" y="86" fill="#888888" fontSize="6" fontFamily="monospace">DIRECTOR</text>
        <text x="12" y="97" fill="#888888" fontSize="6" fontFamily="monospace">CAMERA</text>

        {/* Clapper arm — rotates from -38° (open) to 0° (closed) */}
        <g
          style={{
            transformOrigin: '5px 30px',
            transform: phase === 'open' ? 'rotate(-38deg)' : 'rotate(0deg)',
            transition: phase === 'action' ? 'transform 110ms ease-in' : undefined,
          }}
        >
          <rect x="5" y="18" width="100" height="14" rx="2" fill="url(#stripes)" stroke="#1a1a1a" strokeWidth="2.5" />
          <circle cx="5" cy="30" r="3" fill="#1a1a1a" />
        </g>
      </svg>

      {/* Text — same style for both states */}
      <p
        className="text-text-secondary text-sm tracking-widest uppercase"
        style={{ fontFamily: 'var(--font-body), system-ui, sans-serif' }}
      >
        {phase === 'open' ? 'And...' : 'Action!'}
      </p>
    </div>
  );
}
