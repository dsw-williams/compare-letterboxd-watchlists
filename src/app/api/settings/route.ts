import { NextRequest, NextResponse } from 'next/server';
import { getSettings, saveSettings } from '@/lib/storage';

export const runtime = 'nodejs';

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json(settings);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  await saveSettings(body);
  return NextResponse.json(body);
}
