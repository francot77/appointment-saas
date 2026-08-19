import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

const STATUS_ORDER = { accepted: 0, sent: 1, delivered: 2, read: 3, failed: 1 } as const;
export type MetaDeliveryStatus = keyof typeof STATUS_ORDER;

type MetaStatus = { id?: unknown; status?: unknown; timestamp?: unknown; recipient_id?: unknown; errors?: unknown };
type MetaChange = { value?: { metadata?: { phone_number_id?: unknown }; statuses?: MetaStatus[] } };
type MetaPayload = { object?: unknown; entry?: Array<{ changes?: MetaChange[] }> };

export type WebhookDependencies = {
  connectionModel: { findOne: (filter: Record<string, unknown>) => Promise<any> };
  eventModel: { findOneAndUpdate: (filter: Record<string, unknown>, update: Record<string, unknown>, options: Record<string, unknown>) => Promise<any> };
  jobModel: { findOne: (filter: Record<string, unknown>) => Promise<any>; updateOne: (filter: Record<string, unknown>, update: Record<string, unknown>) => Promise<any> };
  now?: Date;
};

export function verifyMetaSignature(rawBody: string, signatureHeader: string | null | undefined, appSecret: string) {
  if (!signatureHeader?.startsWith('sha256=') || !appSecret) return false;
  const expected = Buffer.from(signatureHeader.slice(7), 'hex');
  const actual = createHmac('sha256', appSecret).update(rawBody, 'utf8').digest();
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function verifyMetaChallenge(mode: string | null, token: string | null, challenge: string | null, expectedToken: string) {
  return mode === 'subscribe' && Boolean(challenge) && token === expectedToken ? challenge : null;
}

export function buildMetaWebhookEventId(event: unknown) {
  return createHash('sha256').update(JSON.stringify(event)).digest('hex');
}

export function shouldAdvanceDeliveryStatus(current: MetaDeliveryStatus | null | undefined, incoming: MetaDeliveryStatus) {
  if (!current) return true;
  if (current === 'failed' && incoming === 'failed') return false;
  if (incoming === 'failed') return current === 'accepted' || current === 'sent';
  return STATUS_ORDER[incoming] > STATUS_ORDER[current];
}

function isStatus(value: unknown): value is MetaDeliveryStatus {
  return value === 'accepted' || value === 'sent' || value === 'delivered' || value === 'read' || value === 'failed';
}

function statusEntries(payload: MetaPayload) {
  if (payload.object !== 'whatsapp_business_account' || !Array.isArray(payload.entry)) return [];
  return payload.entry.flatMap((entry) => (entry.changes ?? []).flatMap((change) => {
    const phoneNumberId = change.value?.metadata?.phone_number_id;
    return (change.value?.statuses ?? []).map((status) => ({ phoneNumberId, status }));
  }));
}

export async function processMetaWebhookPayload(payload: unknown, dependencies: WebhookDependencies) {
  const result = { processed: 0, replayed: 0, ignored: 0 };
  for (const entry of statusEntries(payload as MetaPayload)) {
    const providerMessageId = typeof entry.status.id === 'string' ? entry.status.id : '';
    const incoming = isStatus(entry.status.status) ? entry.status.status : null;
    const phoneNumberId = typeof entry.phoneNumberId === 'string' ? entry.phoneNumberId : '';
    if (!providerMessageId || !incoming || !phoneNumberId) { result.ignored += 1; continue; }

    const connection = await dependencies.connectionModel.findOne({ provider: 'meta_whatsapp_cloud', phoneNumberId });
    const businessId = connection?.businessId ? String(connection.businessId) : '';
    if (!businessId) { result.ignored += 1; continue; }

    const eventId = buildMetaWebhookEventId({ phoneNumberId, providerMessageId, status: entry.status });
    const event = await dependencies.eventModel.findOneAndUpdate(
      { businessId, provider: 'meta_whatsapp_cloud', eventId },
      { $setOnInsert: { businessId, provider: 'meta_whatsapp_cloud', eventId, providerMessageId, status: incoming, processedAt: dependencies.now ?? new Date() } },
      { upsert: true, new: true, includeResultMetadata: true },
    );
    if (event?.lastErrorObject?.updatedExisting === true || event?.value?.lastErrorObject?.updatedExisting === true) { result.replayed += 1; continue; }

    const job = await dependencies.jobModel.findOne({ businessId, providerMessageId });
    if (!job || !shouldAdvanceDeliveryStatus(job.deliveryStatus, incoming)) { result.ignored += 1; continue; }
    await dependencies.jobModel.updateOne(
      { _id: job._id, businessId, providerMessageId, deliveryStatus: job.deliveryStatus ?? null },
      { $set: { businessId, deliveryStatus: incoming, statusUpdatedAt: dependencies.now ?? new Date(), ...(incoming === 'failed' ? { failureCode: 'provider_failed' } : {}) } },
    );
    result.processed += 1;
  }
  return result;
}
