import { NextRequest, NextResponse } from 'next/server';
import { deleteFriend, getFriend, upsertFriend } from '@/lib/storage';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { username: string } }
) {
  await deleteFriend(params.username);
  return NextResponse.json({ success: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { username: string } }
) {
  const existing = await getFriend(params.username);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const body = await req.json();
  await upsertFriend({ ...existing, custom_name: body.custom_name ?? undefined });
  return NextResponse.json({ ok: true });
}
