import { NextRequest, NextResponse } from 'next/server';
import { deleteList, upsertList, getLists, getSettings } from '@/lib/storage';

export const runtime = 'nodejs';
import { fetchList } from '@/lib/letterboxd';
import { createStreamingResponse, maybeTriggerListEnrichment } from '@/lib/streaming';

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

  return createStreamingResponse(async (send) => {
    const displayName = existing.custom_name ?? existing.name;
    send({ step: 'scraping', message: `Re-fetching "${displayName}"...` });
    const { title, movies } = await fetchList(existing.owner, existing.slug);

    const settings = await getSettings();

    await upsertList({
      ...existing,
      name: title,
      movies,
      last_synced: new Date().toISOString(),
      // enrichment_pending: true means TMDB enrichment is needed.
      // When there is no API key, enrichment is not possible, so mark it not pending.
      enrichment_pending: !!settings.tmdb_api_key,
    });

    send({ step: 'done' });
    maybeTriggerListEnrichment(listId, settings);
  });
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
