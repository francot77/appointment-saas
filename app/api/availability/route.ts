import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');
  const serviceId = searchParams.get('serviceId');
  return NextResponse.json(
    {
      error: 'LEGACY_ENDPOINT',
      message: 'Usá /api/public/[slug]/availability',
      details: { date, serviceId },
    },
    { status: 410 }
  );
}
