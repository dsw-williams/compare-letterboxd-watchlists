import type { Metadata, Viewport } from 'next';
import { Inter, Outfit } from 'next/font/google';
import { headers } from 'next/headers';
import './globals.css';
import Nav from '@/components/Nav';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['800', '900'],
  variable: '--font-display',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');

  return {
    metadataBase: new URL(`${proto}://${host}`),
    title: 'Watchlist — Compare Letterboxd watchlists',
    description: 'Select friends to compare watchlists.',
    openGraph: {
      title: 'Watchlist — Compare Letterboxd watchlists',
      description: 'Select friends to compare watchlists.',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Watchlist — Compare Letterboxd watchlists',
      description: 'Select friends to compare watchlists.',
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body style={{ backgroundColor: '#141414', minHeight: '100vh' }}>
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  );
}
