import { describe, expect, it } from 'vitest';
import { processClaimedMessageJob } from '@/lib/messaging/worker';

describe('provider reference persistence boundary', () => {
  it('persists the provider message id on the lease-scoped terminal update', async () => {
    const updates: Array<{ filter: Record<string, unknown>; update: Record<string, unknown> }> = [];
    const job = {
      _id: 'job-1', businessId: 'tenant-a', appointmentId: 'appointment-a', messagingVersion: 1,
      state: 'leased', leaseToken: 'lease-1', attempts: 0,
    };
    const result = await processClaimedMessageJob({
      job,
      jobModel: {
        findOne: async () => job,
        updateOne: async (filter, update) => { updates.push({ filter, update }); return { matchedCount: 1, modifiedCount: 1 }; },
      },
      appointmentModel: { findOne: async () => ({ messagingVersion: 1, status: 'confirmed' }) },
      send: async () => ({ providerMessageId: 'wamid.persisted' }),
      now: new Date('2026-08-19T12:00:00.000Z'),
    });

    expect(result.providerMessageId).toBe('wamid.persisted');
    expect(updates.at(-1)?.filter).toMatchObject({ _id: 'job-1', state: 'leased', leaseToken: 'lease-1' });
    expect(updates.at(-1)?.update).toMatchObject({ $set: expect.objectContaining({ providerMessageId: 'wamid.persisted', state: 'sent' }) });
  });
});
