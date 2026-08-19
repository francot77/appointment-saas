import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  buildMetaWebhookEventId,
  processMetaWebhookPayload,
  shouldAdvanceDeliveryStatus,
  verifyMetaSignature,
} from '@/lib/messaging/webhook';
import { GET, POST } from '@/app/api/webhooks/meta/whatsapp/route';

const rawBody = JSON.stringify({ object: 'whatsapp_business_account' });
const signature = `sha256=${createHmac('sha256', 'app-secret').update(rawBody).digest('hex')}`;

function payload(status: string, id = 'wamid.1') {
  return {
    object: 'whatsapp_business_account',
    entry: [{ changes: [{ value: {
      metadata: { phone_number_id: 'phone-1' },
      statuses: [{ id, status, timestamp: '1724060000', recipient_id: '5491112345678' }],
    } }] }],
  };
}

function dependencies(options: { existingStatus?: string; replay?: boolean } = {}) {
  const updates: Array<{ filter: Record<string, unknown>; update: Record<string, unknown> }> = [];
  const events: string[] = [];
  return {
    updates,
    events,
    connectionModel: { findOne: async (filter: Record<string, unknown>) => filter.phoneNumberId === 'phone-1' ? { businessId: 'tenant-1', phoneNumberId: 'phone-1' } : null },
    eventModel: { findOneAndUpdate: async () => options.replay ? { lastErrorObject: { updatedExisting: true } } : (events.push('event'), { lastErrorObject: { updatedExisting: false } }) },
    jobModel: {
      findOne: async () => ({ _id: 'job-1', businessId: 'tenant-1', providerMessageId: 'wamid.1', deliveryStatus: options.existingStatus ?? null }),
      updateOne: async (filter: Record<string, unknown>, update: Record<string, unknown>) => { updates.push({ filter, update }); },
    },
  };
}

describe('Meta webhook verification and reconciliation', () => {
  it('serves the official challenge only for the configured verification token', async () => {
    process.env.META_WHATSAPP_VERIFY_TOKEN = 'verify-token';
    const valid = await GET(new Request('http://localhost/api/webhooks/meta/whatsapp?hub.mode=subscribe&hub.verify_token=verify-token&hub.challenge=challenge-1') as any);
    const invalid = await GET(new Request('http://localhost/api/webhooks/meta/whatsapp?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=challenge-1') as any);
    expect(await valid.text()).toBe('challenge-1');
    expect(valid.status).toBe(200);
    expect(invalid.status).toBe(403);
  });

  it('rejects an invalid POST signature before parsing or touching persistence', async () => {
    process.env.META_WHATSAPP_APP_SECRET = 'app-secret';
    const response = await POST(new Request('http://localhost/api/webhooks/meta/whatsapp', {
      method: 'POST', body: rawBody, headers: { 'x-hub-signature-256': 'sha256=wrong' },
    }) as any);
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: 'Invalid signature' });
  });

  it('accepts the official raw-body HMAC signature and rejects altered bytes', () => {
    expect(verifyMetaSignature(rawBody, signature, 'app-secret')).toBe(true);
    expect(verifyMetaSignature(`${rawBody} `, signature, 'app-secret')).toBe(false);
    expect(verifyMetaSignature(rawBody, 'sha256=wrong', 'app-secret')).toBe(false);
  });

  it('builds a stable event id from the canonical provider event', () => {
    const first = buildMetaWebhookEventId(payload('sent'));
    const second = buildMetaWebhookEventId(payload('sent'));
    expect(first).toHaveLength(64);
    expect(second).toBe(first);
  });

  it('routes a status through the persisted phone reference, never a supplied tenant id', async () => {
    const deps = dependencies();
    const result = await processMetaWebhookPayload({ ...payload('sent'), businessId: 'attacker-tenant' }, deps);
    expect(result).toEqual({ processed: 1, replayed: 0, ignored: 0 });
    expect(deps.updates[0].filter).toMatchObject({ businessId: 'tenant-1', providerMessageId: 'wamid.1' });
  });

  it('deduplicates a redelivered event without updating the job again', async () => {
    const deps = dependencies({ replay: true });
    const result = await processMetaWebhookPayload(payload('delivered'), deps);
    expect(result).toEqual({ processed: 0, replayed: 1, ignored: 0 });
    expect(deps.updates).toHaveLength(0);
  });

  it('advances statuses monotonically and ignores lower replays', () => {
    expect(shouldAdvanceDeliveryStatus('accepted', 'sent')).toBe(true);
    expect(shouldAdvanceDeliveryStatus('delivered', 'sent')).toBe(false);
    expect(shouldAdvanceDeliveryStatus('read', 'failed')).toBe(false);
    expect(shouldAdvanceDeliveryStatus('sent', 'failed')).toBe(true);
  });

  it('applies a newer delivery status to the tenant-correlated job', async () => {
    const deps = dependencies({ existingStatus: 'sent' });
    const result = await processMetaWebhookPayload(payload('delivered'), deps);
    expect(result).toEqual({ processed: 1, replayed: 0, ignored: 0 });
    expect(deps.updates[0].update).toMatchObject({ $set: { deliveryStatus: 'delivered', businessId: 'tenant-1' } });
  });

  it('does not regress a delivered job when Meta replays sent', async () => {
    const deps = dependencies({ existingStatus: 'delivered' });
    const result = await processMetaWebhookPayload(payload('sent'), deps);
    expect(result).toEqual({ processed: 0, replayed: 0, ignored: 1 });
    expect(deps.updates).toHaveLength(0);
  });

  it('ignores malformed or unknown-tenant payloads safely', async () => {
    const deps = dependencies();
    expect(await processMetaWebhookPayload({ object: 'other' }, deps)).toEqual({ processed: 0, replayed: 0, ignored: 0 });
    expect(await processMetaWebhookPayload(payload('delivered', 'unknown'), {
      ...deps,
      connectionModel: { findOne: async () => null },
    })).toEqual({ processed: 0, replayed: 0, ignored: 1 });
  });
});
