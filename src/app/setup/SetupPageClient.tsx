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
    'Set TMDB_API_KEY as an environment variable for your container, then restart it. You can do this via a .env file with Docker Compose, or directly in your Docker GUI (Unraid, Portainer, Synology, etc.).',
  'local-dev':
    'Add your TMDB API key to a .env.local file in the project root, then restart the dev server.',
  production:
    'Set the TMDB_API_KEY environment variable in your hosting provider\'s dashboard, then redeploy or restart your server.',
};

const ENV_CODE: Record<EnvType, string> = {
  docker: `# Option A — Docker Compose (.env file next to docker-compose.yml):
TMDB_API_KEY=your_tmdb_api_key_here
# Then: docker compose down && docker compose up -d

# Option B — Docker run (--env flag):
docker run -e TMDB_API_KEY=your_key ...

# Option C — Docker GUI (Unraid, Portainer, Synology, etc.):
# Add TMDB_API_KEY as an environment variable in the container
# settings UI, then restart the container.`,
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
      className="min-h-[calc(100vh-72px)] flex flex-col items-center justify-center px-5 py-16"
      style={{ animation: 'fadeUp 0.45s ease-out both' }}
    >
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
