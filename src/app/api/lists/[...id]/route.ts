import { NextRequest, NextResponse } from 'next/server';
import { deleteList, upsertList, getLists } from '@/lib/storage';
import { fetchList } from '@/lib/letterboxd';
import { enrichAndSaveList } from '@/lib/tmdb';
import { getSettings } from '@/lib/storage';

async function resolveId(params: Promise<{ id: string[] }>) {
  const { id } = await params;
  return id.join('/');
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string[] }> }
) {
  const listId = await resolveId(params);
  const existing = (await getLists()).find((l) => l.id === listId);
  if (!existing) {
    return NextResponse.json({ error: 'List not found' }, { status: 404 });
  }

  const { owner, slug } = existing;
  const { title, movies } = await fetchList(owner, slug);

  const settings = await getSettings();

  await upsertList({
    ...existing,
    name: title,
    movies,
    last_synced: new Date().toISOString(),
    tmdb_enriched: !settings.tmdb_api_key,
  });

  if (settings.tmdb_api_key) {
    enrichAndSaveList(listId, settings.tmdb_api_key).catch(console.error);
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string[] }> }
) {
  const listId = await resolveId(params);
  const existing = (await getLists()).find((l) => l.id === listId);
  if (!existing) {
    return NextResponse.json({ error: 'List not found' }, { status: 404 });
  }
  const body = await req.json();
  await upsertList({ ...existing, custom_name: body.custom_name ?? undefined });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string[] }> }
) {
  const listId = await resolveId(params);
  await deleteList(listId);
  return NextResponse.json({ ok: true });
}
