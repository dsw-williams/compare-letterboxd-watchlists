'use client';

import type { EnvType } from './page';

interface Props {
  env: EnvType;
}

const ENV_LABELS: Record<EnvType, string> = {
  docker: 'Docker',
  'local-dev': 'Local development',
  production: 'Production',
};

const ENV_PROSE: Record<EnvType, string> = {
  docker:
    'Create a .env file in the same directory as your docker-compose.yml, add your TMDB API key, then restart the container.',
  'local-dev':
    'Add your TMDB API key to a .env.local file in the project root, then restart the dev server.',
  production:
    'Set the TMDB_API_KEY environment variable in your hosting provider\'s dashboard, then redeploy or restart your server.',
};

const ENV_CODE: Record<EnvType, string> = {
  docker: `# Create a .env file next to docker-compose.yml:
TMDB_API_KEY=your_tmdb_api_key_here

# Then restart the container:
docker compose down && docker compose up -d`,
  'local-dev': `# Add to .env.local in the project root:
TMDB_API_KEY=your_tmdb_api_key_here

# Then restart the dev server (Ctrl+C, then):
npm run dev`,
  production: `# Set the environment variable in your hosting dashboard,
# then redeploy or restart your server.
TMDB_API_KEY=your_tmdb_api_key_here`,
};

export default function SetupPageClient({ env }: Props) {

  return (
    <div
      className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-5 py-16"
      style={{ animation: 'fadeUp 0.45s ease-out both' }}
    >
      {/* Logo bar */}
      <div className="flex items-center gap-2.5 mb-12">
        <div className="w-8 h-8 bg-accent-green rounded-[6px] flex items-center justify-center shrink-0">
          <span className="text-lg leading-none">🎬</span>
        </div>
        <span className="text-text-primary font-black text-lg tracking-[0.06em] uppercase">
          Watchlist
        </span>
      </div>

      {/* Sixth Sense headline */}
      <h1 className="font-display text-text-primary font-black text-center text-[2.2rem] sm:text-5xl leading-[1.1] mb-10">
        I see dead pages&hellip;
      </h1>
      
      {/* Instructions card */}
      <div className="w-full max-w-lg bg-bg-card border border-border-subtle rounded-2xl p-8">
        <p className="text-xs font-bold text-accent-green uppercase tracking-[0.12em] mb-3">
          Setup required &mdash; {ENV_LABELS[env]}
        </p>

        <p className="text-text-secondary text-sm leading-relaxed mb-5">
          {ENV_PROSE[env]}
        </p>

        <pre className="bg-bg-primary border border-border-subtle rounded-lg p-4 text-sm text-text-primary font-mono overflow-x-auto whitespace-pre leading-relaxed">
          {ENV_CODE[env]}
        </pre>

        <p className="text-text-tertiary text-xs mt-5 leading-relaxed">
          Get a free TMDB API key at{' '}
          <a
            href="https://www.themoviedb.org/settings/api"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-green hover:underline transition-colors"
          >
            themoviedb.org/settings/api
          </a>
        </p>
      </div>
    </div>
  );
}
