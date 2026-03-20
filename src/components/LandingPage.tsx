'use client';
import { useState, useEffect, useRef } from 'react';
import { DEFAULT_LISTS } from '@/config/defaultLists';

interface PosterMovie {
  id: number;
  poster_url: string;
}

interface BackdropData {
  title: string;
  year: string;
  director: string | null;
  backdrop_url: string | null;
  poster_movies: PosterMovie[];
}

async function streamImport(
  endpoint: string,
  body: object,
  onProgress: (msg: string) => void
): Promise<void> {
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok || !res.body) return;
    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8', { fatal: false });
    let buffer = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines.filter(Boolean)) {
        try {
          const data = JSON.parse(line);
          if (data.step === 'error') return;
          if (data.step !== 'done' && data.message) onProgress(data.message);
          if (data.step === 'done') return;
        } catch { /* skip malformed lines */ }
      }
    }
  } catch { /* silently continue */ }
}

type Step = 'hero' | 'friends' | 'lists' | 'importing';

// ── Collapsed summary card ────────────────────────────────
function CollapsedCard({
  title,
  summary,
  onClick,
}: {
  title: string;
  summary: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 bg-bg-card/80 backdrop-blur-sm border border-border-subtle rounded-xl px-4 py-3 ${
        onClick ? 'cursor-pointer hover:bg-bg-card transition-colors' : ''
      }`}
    >
      <div className="w-5 h-5 rounded-full bg-accent-green flex items-center justify-center shrink-0">
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <span className="text-sm text-text-primary font-medium">{title}</span>
      <span className="text-sm text-text-tertiary">— {summary}</span>
      {onClick && <span className="ml-auto text-xs text-text-tertiary">Edit</span>}
    </div>
  );
}

export default function LandingPage() {
  const [step, setStep] = useState<Step>('hero');
  const [yourUsername, setYourUsername] = useState('');
  const [friendInput, setFriendInput] = useState('');
  const [friendsList, setFriendsList] = useState<string[]>([]);
  const [selectedDefaults, setSelectedDefaults] = useState<string[]>([]);
  const [backdrop, setBackdrop] = useState<BackdropData | null>(null);
  const [importStatus, setImportStatus] = useState('');
  const [importProgress, setImportProgress] = useState({ done: 0, total: 0 });
  const [importDone, setImportDone] = useState(false);
  const [heroExiting, setHeroExiting] = useState(false);
  const [friendsNextError, setFriendsNextError] = useState(false);
  const importingRef = useRef(false);
  const backdropFetched = useRef(false);

  useEffect(() => {
    if (backdropFetched.current) return;
    backdropFetched.current = true;
    fetch('/api/tmdb/backdrop')
      .then((r) => r.json())
      .then(setBackdrop)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (step !== 'importing' || importingRef.current) return;
    importingRef.current = true;
    runImports();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  async function runImports() {
    const allItems: Array<{ endpoint: string; body: object; label: string }> = [
      { endpoint: '/api/friends', body: { username: yourUsername }, label: yourUsername },
      ...friendsList.map((u) => ({ endpoint: '/api/friends', body: { username: u }, label: u })),
      ...selectedDefaults.map((url) => {
        const found = DEFAULT_LISTS.find((d) => d.url === url);
        return { endpoint: '/api/lists', body: { url }, label: found?.name ?? url };
      }),
    ];

    setImportProgress({ done: 0, total: allItems.length });

    for (let i = 0; i < allItems.length; i++) {
      const item = allItems[i];
      setImportStatus(`Importing ${item.label}…`);
      await streamImport(item.endpoint, item.body, (msg) => setImportStatus(msg));
      setImportProgress({ done: i + 1, total: allItems.length });
    }

    setImportDone(true);
    setTimeout(() => { window.location.href = '/'; }, 2000);
  }

  function startOnboarding() {
    if (!yourUsername.trim()) return;
    setHeroExiting(true);
    setTimeout(() => { setHeroExiting(false); setStep('friends'); }, 500);
  }

  function addFriend() {
    const u = friendInput.trim().toLowerCase();
    if (u && !friendsList.includes(u)) setFriendsList((prev) => [...prev, u]);
    setFriendInput('');
  }

  function toggleDefault(url: string) {
    setSelectedDefaults((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
    );
  }

  function goBack() {
    if (step === 'friends') setStep('hero');
    if (step === 'lists') setStep('friends');
  }

  const friendsSummary = friendsList.length > 0
    ? `${friendsList.length} friend${friendsList.length > 1 ? 's' : ''} added`
    : 'None added';

  const filmCredit = backdrop?.backdrop_url
    ? [backdrop.title, backdrop.year ? `(${backdrop.year})` : '', backdrop.director ? `· dir. ${backdrop.director}` : '']
        .filter(Boolean).join(' ')
    : null;

  const posterMovies = backdrop?.poster_movies ?? [];

  return (
    <div className="min-h-screen bg-bg-primary relative overflow-hidden flex flex-col">

      {/* ── Backdrop (absolute, constrained to same width as poster grid) ── */}
      {backdrop?.backdrop_url && (
        <div className="absolute inset-0 bg-bg-primary">
          <div className="max-w-[1400px] mx-auto h-full relative overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={backdrop.backdrop_url}
              alt=""
              className="w-full h-full object-cover object-top"
            />
            {/* Bottom-to-top fade — eased */}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #141414 0%, #141414e6 15%, #141414b3 35%, #14141466 55%, #14141426 75%, transparent 100%)' }} />
            {/* Left edge fade — eased */}
            <div className="absolute inset-y-0 left-0 w-64" style={{ background: 'linear-gradient(to right, #141414 0%, #141414d9 20%, #14141499 50%, #14141433 75%, transparent 100%)' }} />
            {/* Right edge fade — eased */}
            <div className="absolute inset-y-0 right-0 w-64" style={{ background: 'linear-gradient(to left, #141414 0%, #141414d9 20%, #14141499 50%, #14141433 75%, transparent 100%)' }} />
          </div>
        </div>
      )}

      {/* ── All content above backdrop ─────────────────────── */}
      <div className="relative z-10 flex flex-col flex-1 min-h-screen">

        {/* ── Form area ────────────────────────────────────── */}
        <div className="flex-1 flex flex-col items-center justify-center px-5 pt-12 pb-4 gap-4">

          {/* ══ HERO MODE ══════════════════════════════════ */}
          {step === 'hero' && (
            <div
              key="hero"
              className="w-full max-w-md"
              style={{ animation: heroExiting ? 'fadeOut 0.5s ease-in-out both' : 'fadeUp 0.3s ease-out both' }}
            >
              {/* App logo + wordmark */}
              <div className="flex items-center justify-center gap-2.5 mb-6">
                <div className="w-8 h-8 bg-accent-green rounded-[6px] flex items-center justify-center shrink-0">
                  <span className="text-lg leading-none">🎬</span>
                </div>
                <span className="text-text-primary font-black text-lg tracking-[0.06em] uppercase">
                  Watchlist
                </span>
              </div>

              <h1 className="text-text-primary text-center font-black leading-[1.1] mb-8 text-[2.6rem] sm:text-5xl">
                Compare Letterboxd watchlists. Pick what to watch.
              </h1>

              {/* Input + button on one row */}
              <div className="flex gap-2">
                <div className="flex-1 flex items-center bg-bg-input border border-border-subtle rounded-lg h-11 overflow-hidden">
                  <span className="text-text-tertiary text-sm px-3 whitespace-nowrap border-r border-border-subtle h-full flex items-center">
                    letterboxd.com/
                  </span>
                  <input
                    type="text"
                    value={yourUsername}
                    onChange={(e) => setYourUsername(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') startOnboarding();
                    }}
                    placeholder="your username"
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    className="flex-1 bg-transparent border-none outline-none text-text-primary text-sm px-3 h-full min-w-0"
                    autoFocus
                  />
                </div>
                <button
                  onClick={startOnboarding}
                  disabled={!yourUsername.trim()}
                  className="h-11 px-5 bg-accent-green hover:bg-accent-green-hover disabled:bg-accent-green-disabled disabled:cursor-not-allowed text-white font-bold rounded-lg text-sm transition-colors shrink-0"
                >
                  Start →
                </button>
              </div>

              {/* Film credit */}
              {filmCredit && (
                <p className="text-[11px] text-white/40 select-none text-center mt-4">
                  {filmCredit}
                </p>
              )}
            </div>
          )}

          {/* ══ FORM MODE ══════════════════════════════════ */}
          {(step === 'friends' || step === 'lists') && (
            <div className="w-full max-w-md flex flex-col gap-2" style={{ animation: 'fadeUp 0.4s ease-out both' }}>
              <CollapsedCard title="Your username" summary={yourUsername} />

              {step === 'lists' && (
                <div style={{ animation: 'fadeUp 0.4s ease-out both' }}>
                  <CollapsedCard
                    title="Your friends"
                    summary={friendsSummary}
                    onClick={() => setStep('friends')}
                  />
                </div>
              )}

              <div
                key={step}
                className="bg-bg-card/90 backdrop-blur-sm border border-border-subtle rounded-2xl p-6"
                style={{ animation: 'fadeUp 0.4s ease-out 0.08s both' }}
              >
                <button
                  onClick={goBack}
                  className="flex items-center gap-1 text-text-tertiary text-sm hover:text-text-primary transition-colors mb-4"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Back
                </button>

                {/* ── Friends step ──────────────────────── */}
                {step === 'friends' && (
                  <>
                    <h2 className="text-text-primary font-black text-2xl mb-1">Add your friends</h2>
                    <p className="text-text-tertiary text-sm mb-5">Add Letterboxd usernames. You can add more later.</p>

                    <div className="flex items-center bg-bg-input border border-border-subtle rounded-lg h-11 overflow-hidden mb-3">
                      <span className="text-text-tertiary text-sm px-3 whitespace-nowrap border-r border-border-subtle h-full flex items-center">
                        letterboxd.com/
                      </span>
                      <input
                        type="text"
                        value={friendInput}
                        onChange={(e) => setFriendInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') addFriend(); }}
                        placeholder="username"
                        autoComplete="off"
                        autoCapitalize="none"
                        spellCheck={false}
                        className="flex-1 bg-transparent border-none outline-none text-text-primary text-sm px-3 h-full"
                      />
                      <button
                        onClick={addFriend}
                        className="px-3 text-accent-green text-sm font-medium h-full border-l border-border-subtle hover:text-accent-green-hover transition-colors"
                      >
                        Add
                      </button>
                    </div>

                    {friendsList.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {friendsList.map((u) => (
                          <div key={u} className="flex items-center gap-1.5 bg-bg-card-hover border border-border-subtle rounded-full px-3 py-1 text-sm text-text-primary">
                            <span>{u}</span>
                            <button
                              onClick={() => setFriendsList((prev) => prev.filter((x) => x !== u))}
                              className="text-text-tertiary hover:text-text-primary transition-colors leading-none text-base"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {friendsList.length === 0 && friendsNextError && (
                      <p className="text-red-400 text-sm mt-4">Add at least one friend, or use Skip to continue without.</p>
                    )}
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => setStep('lists')} className="flex-1 h-10 rounded-lg text-sm text-text-secondary border border-border-subtle hover:border-border-strong hover:text-text-primary transition-colors">
                        Skip for now
                      </button>
                      <button
                        onClick={() => {
                          if (friendsList.length === 0) { setFriendsNextError(true); return; }
                          setFriendsNextError(false);
                          setStep('lists');
                        }}
                        className="flex-1 h-10 bg-accent-green hover:bg-accent-green-hover text-white font-semibold rounded-lg text-sm transition-colors"
                      >
                        Next →
                      </button>
                    </div>
                  </>
                )}

                {/* ── Lists step ────────────────────────── */}
                {step === 'lists' && (
                  <>
                    <h2 className="text-text-primary font-black text-2xl mb-1">Track Letterboxd lists</h2>
                    <p className="text-text-tertiary text-sm mb-5">Add lists to discover films together. You can add more later.</p>

                    {DEFAULT_LISTS.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {DEFAULT_LISTS.map((l) => {
                          const active = selectedDefaults.includes(l.url);
                          return (
                            <button
                              key={l.url}
                              onClick={() => toggleDefault(l.url)}
                              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                                active
                                  ? 'bg-accent-green border-accent-green text-white'
                                  : 'bg-transparent border-border-subtle text-text-secondary hover:border-border-strong hover:text-text-primary'
                              }`}
                            >
                              {active ? '✓ ' : ''}{l.name}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex gap-2 mt-5">
                      <button onClick={() => setStep('importing')} className="flex-1 h-10 rounded-lg text-sm text-text-secondary border border-border-subtle hover:border-border-strong hover:text-text-primary transition-colors">
                        Skip for now
                      </button>
                      <button onClick={() => setStep('importing')} className="flex-1 h-10 bg-accent-green hover:bg-accent-green-hover text-white font-semibold rounded-lg text-sm transition-colors">
                        Finish →
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ══ IMPORTING MODE ═════════════════════════════ */}
          {step === 'importing' && (
            <div
              key="importing"
              className="w-full max-w-md"
              style={{ animation: 'fadeUp 0.28s ease-out both' }}
            >
              <div className="bg-bg-card/90 backdrop-blur-sm border border-border-subtle rounded-2xl p-10 text-center">
                {importDone ? (
                  <>
                    <div className="w-12 h-12 rounded-full bg-accent-green flex items-center justify-center mx-auto mb-6">
                      <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
                        <path d="M2 8L7 13L18 2" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <h2 className="text-text-primary font-black text-2xl mb-2">You&apos;re all set!</h2>
                    <p className="text-text-tertiary text-sm">Taking you to your watchlists…</p>
                  </>
                ) : (
                  <>
                    <div
                      className="w-10 h-10 border-2 border-border-subtle border-t-accent-green rounded-full mx-auto mb-6"
                      style={{ animation: 'spin 0.9s linear infinite' }}
                    />
                    <h2 className="text-text-primary font-black text-2xl mb-3">Setting up…</h2>
                    {importStatus && (
                      <p className="text-text-secondary text-sm mb-2 min-h-[20px]">{importStatus}</p>
                    )}
                    {importProgress.total > 0 && (
                      <p className="text-text-tertiary text-sm">
                        {importProgress.done} / {importProgress.total}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Poster grid (hero step only) ─────────────────── */}
        {step === 'hero' && posterMovies.length > 0 && (
          <div className="relative overflow-hidden" style={{ height: '42vh', animation: heroExiting ? 'fadeOut 0.5s ease-in-out both' : undefined }}>
            {/* Poster grid — same column sizing as MovieGrid, constrained to page width */}
            <div className="max-w-[1400px] mx-auto px-6">
            <div
              className="grid gap-3 pointer-events-none"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}
            >
              {posterMovies.map((m) => (
                <div key={m.id} className="aspect-[2/3] rounded-lg overflow-hidden bg-bg-card">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.poster_url}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
            </div>
            {/* Fade to dark — covers bottom 70% so only the top row peek is visible */}
            <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/80 to-transparent pointer-events-none" />
          </div>
        )}

      </div>
    </div>
  );
}
