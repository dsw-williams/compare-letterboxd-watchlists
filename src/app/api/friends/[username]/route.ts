import { NextRequest, NextResponse } from 'next/server';
import { deleteFriend } from '@/lib/storage';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { username: string } }
) {
  await deleteFriend(params.username);
  return NextResponse.json({ success: true });
}
