import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

const FILE_PATH = path.join(process.cwd(), 'src/data/landing-movies.json');

function devOnly() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Dev only' }, { status: 403 });
  }
  return null;
}

export async function GET() {
  const guard = devOnly();
  if (guard) return guard;
  const raw = await fs.readFile(FILE_PATH, 'utf-8');
  return NextResponse.json(JSON.parse(raw));
}

export async function PUT(req: Request) {
  const guard = devOnly();
  if (guard) return guard;
  const body = await req.json();
  await fs.writeFile(FILE_PATH, JSON.stringify(body, null, 2) + '\n', 'utf-8');
  return NextResponse.json({ ok: true });
}
