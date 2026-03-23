'use client';
import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import Card from '@/components/ui/Card';
import InputField from '@/components/ui/InputField';
import PrimaryButton from '@/components/ui/PrimaryButton';
import IconButton from '@/components/ui/IconButton';

interface LandingMovie {
  title: string;
  year: string;
  director: string;
  poster_url: string;
}

interface SearchResult {
  id: number;
  title: string;
  year: string;
  poster_url: string | null;
}

interface ImageData {
  title: string;
  year: string;
  director: string | null;
  posters: string[];
}

const THUMB_POSTER = 'https://image.tmdb.org/t/p/w185';
const FULL = 'https://image.tmdb.org/t/p/original';

export default function LandingMoviesEditor() {
  const [movies, setMovies] = useState<LandingMovie[]>([]);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [loadingImages, setLoadingImages] = useState(false);
  const [selectedPoster, setSelectedPoster] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');


  useEffect(() => {
    fetch('/api/dev/landing-movies')
      .then((r) => r.json())
      .then(setMovies)
      .catch(() => {});
  }, []);

  async function search() {
    if (!query.trim()) return;
    setSearching(true);
    setResults([]);
    setImageData(null);
    setSelectedPoster(null);
    try {
      const r = await fetch(`/api/dev/tmdb/search?q=${encodeURIComponent(query)}`);
      setResults(await r.json());
    } finally {
      setSearching(false);
    }
  }

  async function selectMovie(result: SearchResult) {
    setLoadingImages(true);
    setImageData(null);
    setSelectedPoster(null);
    try {
      const r = await fetch(`/api/dev/tmdb/images?id=${result.id}`);
      setImageData(await r.json());
    } finally {
      setLoadingImages(false);
    }
  }

  async function addToList() {
    if (!imageData || !selectedPoster) return;
    const entry: LandingMovie = {
      title: imageData.title,
      year: imageData.year,
      director: imageData.director ?? '',
      poster_url: `${FULL}${selectedPoster}`,
    };
    const updated = [...movies, entry];
    setSaving(true);
    try {
      await fetch('/api/dev/landing-movies', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      setMovies(updated);
      setQuery('');
      setResults([]);
      setImageData(null);
      setSelectedPoster(null);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function removeMovie(index: number) {
    const updated = movies.filter((_, i) => i !== index);
    await fetch('/api/dev/landing-movies', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
    setMovies(updated);
  }

  const canAdd = !!imageData && !!selectedPoster;

  return (
    <div className="flex flex-col gap-8">

      {/* ── Current list ────────────────────────────────────── */}
      <div>
        <p className="text-xs text-text-tertiary mb-3">
          {movies.length === 0 ? 'No movies yet.' : `${movies.length} movie${movies.length !== 1 ? 's' : ''} in list`}
          {saveStatus === 'saved' && <span className="ml-2 text-accent-green">✓ Saved</span>}
        </p>
        {movies.length > 0 && (
          <div className="flex gap-3 flex-wrap">
            {movies.map((m, i) => (
              <Card key={i} className="p-3 flex gap-3 items-start w-[200px] relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.poster_url.replace('/original/', '/w185/')}
                  alt={m.title}
                  className="w-12 rounded shrink-0 object-cover"
                  style={{ aspectRatio: '2/3' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary font-semibold leading-snug truncate">{m.title}</p>
                  <p className="text-xs text-text-tertiary">{m.year}</p>
                  {m.director && <p className="text-xs text-text-tertiary truncate">{m.director}</p>}
                </div>
                <IconButton
                  title="Remove"
                  onClick={() => removeMovie(i)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 hover:bg-bg-danger transition-opacity"
                >
                  <Trash2 size={14} />
                </IconButton>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ── Search ──────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-bold text-text-secondary uppercase tracking-[0.1em] mb-3">Search TMDB</p>
        <div className="flex gap-2 mb-4 max-w-[400px]">
          <InputField
            type="text"
            placeholder="Movie title…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') search(); }}
            className="flex-1 h-9 px-3"
          />
          <PrimaryButton onClick={search} disabled={searching || !query.trim()} className="text-sm h-9 px-4 shrink-0">
            {searching ? 'Searching…' : 'Search'}
          </PrimaryButton>
        </div>

        {results.length > 0 && (
          <div className="flex gap-3 flex-wrap mb-6">
            {results.map((r) => (
              <button
                key={r.id}
                onClick={() => selectMovie(r)}
                className="flex flex-col items-center gap-1.5 w-[100px] group cursor-pointer"
              >
                <div className="w-full rounded-lg overflow-hidden bg-bg-card border border-border-subtle group-hover:border-accent-green transition-colors" style={{ aspectRatio: '2/3' }}>
                  {r.poster_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.poster_url} alt={r.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-tertiary text-xs px-1 text-center">{r.title}</div>
                  )}
                </div>
                <p className="text-xs text-text-secondary text-center leading-snug line-clamp-2">{r.title}</p>
                <p className="text-11 text-text-tertiary">{r.year}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Image picker ────────────────────────────────────── */}
      {loadingImages && (
        <p className="text-sm text-text-tertiary">Loading images…</p>
      )}

      {imageData && (
        <div>
          <p className="text-xs font-bold text-text-secondary uppercase tracking-[0.1em] mb-1">
            {imageData.title} ({imageData.year}){imageData.director ? ` · dir. ${imageData.director}` : ''}
          </p>

          {/* Posters */}
          <p className="text-xs text-text-tertiary mb-2">Select poster</p>
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
            {imageData.posters.map((path) => (
              <button
                key={path}
                onClick={() => setSelectedPoster(path)}
                className={`shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${selectedPoster === path ? 'border-accent-green' : 'border-transparent'}`}
                style={{ width: 80, height: 120 }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${THUMB_POSTER}${path}`}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
            {imageData.posters.length === 0 && (
              <p className="text-xs text-text-tertiary">No posters available.</p>
            )}
          </div>

          <PrimaryButton onClick={addToList} disabled={!canAdd || saving} className="text-sm">
            {saving ? 'Saving…' : 'Add to list'}
          </PrimaryButton>
        </div>
      )}
    </div>
  );
}
