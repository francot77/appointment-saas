import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  return NextResponse.json(
    {
      error: 'LEGACY_ENDPOINT',
      message: 'Usá /api/public/[slug]/... o /api/admin/services',
      details: { slug },
    },
    { status: 410 }
  );
}
