import { NextRequest, NextResponse } from 'next/server';
import { runMongoMessageWorker, timingSafeSecretEquals } from '@/lib/messaging/worker';
import { createConfiguredMessageSender } from '@/lib/messaging/connection';

export async function GET(request: NextRequest) {
  const configuredSecret = process.env.INTERNAL_MESSAGING_RUN_SECRET;
  const authorization = request.headers.get('authorization') ?? '';
  const suppliedSecret = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';

  if (!configuredSecret || !timingSafeSecretEquals(suppliedSecret, configuredSecret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await runMongoMessageWorker(await createConfiguredMessageSender());
  return NextResponse.json(result, { status: 200 });
}
