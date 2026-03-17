import { ImageResponse } from 'next/og';
import { readFile } from 'fs/promises';
import path from 'path';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const font = await readFile(path.join(process.cwd(), 'public/fonts/Outfit-Black.ttf'));

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          backgroundColor: '#141414',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 28,
        }}
      >
        <div
          style={{
            width: 150,
            height: 150,
            backgroundColor: '#00c030',
            borderRadius: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 90,
          }}
        >
          🎬
        </div>
        <div
          style={{
            color: '#ffffff',
            fontSize: 84,
            fontWeight: 900,
            fontFamily: 'Outfit',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          Watchlist
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: 'Outfit', data: font, weight: 900 }],
    }
  );
}
