import { Metadata } from 'next';
import { existsSync } from 'fs';
import SetupPageClient from './SetupPageClient';

export const metadata: Metadata = {
  title: 'Setup — Watchlist',
  robots: { index: false, follow: false },
};

export type EnvType = 'docker' | 'local-dev' | 'production';

function detectEnvironment(): EnvType {
  if (existsSync('/.dockerenv')) return 'docker';
  if (process.env.NODE_ENV === 'development') return 'local-dev';
  return 'production';
}

export default function SetupPage() {
  return <SetupPageClient env={detectEnvironment()} />;
}
