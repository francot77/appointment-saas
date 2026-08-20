import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  return NextResponse.json(
    {
      error: 'LEGACY_ENDPOINT',
      message: 'Usá /api/public/[slug]/appointments',
      details: body,
    },
    { status: 410 }
  );
}
