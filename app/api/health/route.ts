import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const connection = await dbConnect();
    const databaseReady = connection.connection.readyState === 1;
    return NextResponse.json(
      { status: databaseReady ? 'ok' : 'unavailable', checks: { database: databaseReady ? 'ok' : 'unavailable' } },
      { status: databaseReady ? 200 : 503 }
    );
  } catch {
    return NextResponse.json(
      { status: 'unavailable', checks: { database: 'unavailable' } },
      { status: 503 }
    );
  }
}
