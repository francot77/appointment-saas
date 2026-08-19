/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { ProviderWebhookEvent } from '@/lib/models/ProviderWebhookEvent';
import { MessagingConnection } from '@/lib/models/MessagingConnection';
import { MessageJob } from '@/lib/models/MessageJob';
import { processMetaWebhookPayload, verifyMetaChallenge, verifyMetaSignature } from '@/lib/messaging/webhook';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const challenge = verifyMetaChallenge(url.searchParams.get('hub.mode'), url.searchParams.get('hub.verify_token'), url.searchParams.get('hub.challenge'), process.env.META_WHATSAPP_VERIFY_TOKEN ?? '');
  return challenge === null ? new NextResponse('Forbidden', { status: 403 }) : new NextResponse(challenge, { status: 200 });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  if (!verifyMetaSignature(rawBody, request.headers.get('x-hub-signature-256'), process.env.META_WHATSAPP_APP_SECRET ?? '')) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
  }
  try {
    const payload = JSON.parse(rawBody) as unknown;
    await dbConnect();
    const result = await processMetaWebhookPayload(payload, {
      connectionModel: MessagingConnection as any,
      eventModel: ProviderWebhookEvent as any,
      jobModel: MessageJob as any,
    });
    return NextResponse.json(result, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Malformed webhook payload' }, { status: 400 });
  }
}
