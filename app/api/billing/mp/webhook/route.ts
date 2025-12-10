// app/api/billing/mp/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  console.log('[MP WEBHOOK] PING', {
    url: req.nextUrl.toString(),
    method: req.method,
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
