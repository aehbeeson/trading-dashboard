import { NextRequest, NextResponse } from 'next/server';
import { APPS_SCRIPT_URL } from '@/lib/sheets';

export async function POST(req: NextRequest) {
  try {
    const body    = await req.json();
    const encoded = encodeURIComponent(JSON.stringify(body));
    const url     = `${APPS_SCRIPT_URL}?action=saveForecast&data=${encoded}`;

    const res  = await fetch(url, { redirect: 'follow', cache: 'no-store' });
    const text = await res.text();

    try {
      return NextResponse.json(JSON.parse(text));
    } catch {
      return NextResponse.json({ ok: true });
    }
  } catch (err) {
    console.error('forecast save failed:', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
