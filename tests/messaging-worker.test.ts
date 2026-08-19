/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from 'vitest';
import {
  MAX_WORK_PER_RUN,
  RETRY_DELAYS_MS,
  claimDueMessageJob,
  isRetryableWorkerError,
  processClaimedMessageJob,
  runMessageWorker,
  timingSafeSecretEquals,
} from '@/lib/messaging/worker';

type Job = Record<string, any>;

function memoryModel(initial: Job[]) {
  const jobs = initial.map((job) => ({ ...job }));
  return {
    jobs,
    async findOne(filter: any) {
      const job = jobs.find((candidate) => Object.entries(filter).every(([key, value]) => candidate[key] === value));
      return job ? { ...job } : null;
    },
    async findOneAndUpdate(filter: any, update: any) {
      const job = jobs.find((candidate) => {
        const due = candidate.scheduledAt <= filter.$or[0].scheduledAt.$lte;
        const reclaimable = candidate.state === 'leased'
          && candidate.leaseExpiresAt <= filter.$or[1].leaseExpiresAt.$lte;
        return (candidate.state === 'scheduled' || candidate.state === 'retry_wait') && due || reclaimable;
      });
      if (!job) return null;
      Object.assign(job, update.$set);
      return { ...job };
    },
    async updateOne(filter: any, update: any) {
      const job = jobs.find((candidate) => Object.entries(filter).every(([key, value]) => candidate[key] === value));
      if (!job) return { matchedCount: 0, modifiedCount: 0 };
      Object.assign(job, update.$set);
      for (const [key, value] of Object.entries(update.$inc ?? {})) job[key] = (job[key] ?? 0) + (value as number);
      return { matchedCount: 1, modifiedCount: 1 };
    },
  };
}

describe('messaging worker leases', () => {
  it('atomically gives a due job to only one competing claim', async () => {
    const model = memoryModel([{ _id: 'job-1', state: 'scheduled', scheduledAt: new Date(0) }]);
    const now = new Date(1_000);
    const [first, second] = await Promise.all([
      claimDueMessageJob(model, now, 60_000, () => 'lease-a'),
      claimDueMessageJob(model, now, 60_000, () => 'lease-b'),
    ]);

    expect([first, second].filter(Boolean)).toHaveLength(1);
    expect(model.jobs[0].state).toBe('leased');
  });

  it('reclaims an expired lease', async () => {
    const model = memoryModel([{ _id: 'job-1', state: 'leased', leaseExpiresAt: new Date(0), dispatchStartedAt: null }]);
    const claimed = await claimDueMessageJob(model, new Date(1_000), 60_000, () => 'new-lease');
    expect(claimed).toMatchObject({ leaseToken: 'new-lease', state: 'leased' });
  });

  it('quarantines an expired in-flight lease without sending a duplicate', async () => {
    const updates: any[] = [];
    const initialJob = {
      _id: 'job-1', businessId: 'biz', appointmentId: 'appt', messagingVersion: 3,
      state: 'leased', leaseToken: 'old-lease', leaseExpiresAt: new Date(0), dispatchStartedAt: new Date(500),
    };
    const claimModel = memoryModel([initialJob]);
    const claimed = await claimDueMessageJob(claimModel, new Date(1_000), 60_000, () => 'new-lease');
    let sends = 0;

    const result = await processClaimedMessageJob({
      job: claimed,
      jobModel: { findOne: async () => ({ ...claimModel.jobs[0] }), updateOne: async (_filter: any, update: any) => { updates.push(update); } },
      appointmentModel: { findOne: async () => ({ messagingVersion: 3, status: 'confirmed' }) },
      send: async () => { sends += 1; },
      now: new Date(1_000),
    });

    expect(result).toMatchObject({ state: 'dead', failureCode: 'delivery_unknown' });
    expect(sends).toBe(0);
    expect(updates[0].$set).toMatchObject({ state: 'dead', failureCode: 'delivery_unknown', leaseToken: null, leaseExpiresAt: null });
  });
});

describe('messaging worker validation and completion', () => {
  it('suppresses stale or cancelled jobs before the sender is called', async () => {
    const updates: any[] = [];
    const job = { _id: 'job-1', businessId: 'biz', appointmentId: 'appt', messagingVersion: 3, state: 'leased', leaseToken: 'lease' };
    const model = {
      findOne: async () => job,
      updateOne: async (_filter: any, update: any) => { updates.push(update); },
    };
    const appointmentModel = { findOne: async () => ({ messagingVersion: 4, status: 'cancelled' }) };
    let sends = 0;

    const result = await processClaimedMessageJob({
      job,
      jobModel: model,
      appointmentModel,
      send: async () => { sends += 1; },
      now: new Date(),
    });

    expect(result).toMatchObject({ state: 'invalidated' });
    expect(sends).toBe(0);
    expect(updates[0].$set.state).toBe('invalidated');
  });

  it('revalidates after marking dispatch started when cancellation races with send', async () => {
    const updates: any[] = [];
    const job = { _id: 'job-1', businessId: 'biz', appointmentId: 'appt', messagingVersion: 3, state: 'leased', leaseToken: 'lease' };
    let invalidated = false;
    const model = {
      findOne: async () => (invalidated ? null : job),
      updateOne: async (_filter: any, update: any) => {
        updates.push(update);
        if (update.$set.dispatchStartedAt) invalidated = true;
        return { modifiedCount: 1, matchedCount: 1 };
      },
    };
    const appointmentModel = { findOne: async () => ({ messagingVersion: 3, status: 'confirmed' }) };
    let sends = 0;

    const result = await processClaimedMessageJob({
      job,
      jobModel: model,
      appointmentModel,
      send: async () => { sends += 1; },
      now: new Date(),
    });

    expect(result).toMatchObject({ state: 'invalidated' });
    expect(sends).toBe(0);
    expect(updates.at(-1).$set.state).toBe('invalidated');
  });

  it('backs off retryable failures and dead-letters after bounded exhaustion', async () => {
    const updates: any[] = [];
    const job = { _id: 'job-1', businessId: 'biz', appointmentId: 'appt', messagingVersion: 3, state: 'leased', leaseToken: 'lease', attempts: 4 };
    const model = {
      findOne: async () => job,
      updateOne: async (_filter: any, update: any) => { updates.push(update); },
    };
    const appointmentModel = { findOne: async () => ({ messagingVersion: 3, status: 'confirmed' }) };

    const result = await processClaimedMessageJob({
      job,
      jobModel: model,
      appointmentModel,
      send: async () => { throw Object.assign(new Error('server'), { status: 503 }); },
      now: new Date('2026-08-20T12:00:00Z'),
    });

    expect(result).toMatchObject({ state: 'dead', failureCode: 'retry_exhausted' });
    expect(updates.at(-1).$set.state).toBe('dead');
    expect(RETRY_DELAYS_MS).toHaveLength(5);
  });

  it('schedules a retryable failure with the bounded backoff and increments attempts', async () => {
    const updates: any[] = [];
    const job = { _id: 'job-1', businessId: 'biz', appointmentId: 'appt', messagingVersion: 3, state: 'leased', leaseToken: 'lease', attempts: 0 };
    const now = new Date('2026-08-20T12:00:00Z');
    const model = {
      findOne: async () => job,
      updateOne: async (_filter: any, update: any) => { updates.push(update); },
    };

    const result = await processClaimedMessageJob({
      job,
      jobModel: model,
      appointmentModel: { findOne: async () => ({ messagingVersion: 3, status: 'confirmed' }) },
      send: async () => { throw Object.assign(new Error('rate limited'), { status: 429 }); },
      now,
    });

    expect(result).toMatchObject({ state: 'retry_wait', attempts: 1 });
    expect(updates.at(-1).$set.scheduledAt).toEqual(new Date(now.getTime() + RETRY_DELAYS_MS[0]));
    expect(updates.at(-1).$set.dispatchStartedAt).toBeNull();
  });

  it('reclaims a retryable failure and retries the provider on the next claim', async () => {
    const now = new Date('2026-08-20T12:00:00Z');
    const model = memoryModel([{
      _id: 'job-1', businessId: 'biz', appointmentId: 'appt', messagingVersion: 3,
      state: 'scheduled', scheduledAt: now, attempts: 0, dispatchStartedAt: null,
    }]);
    let sends = 0;

    const firstClaim = await claimDueMessageJob(model, now, 60_000, () => 'lease-1');
    const firstResult = await processClaimedMessageJob({
      job: firstClaim,
      jobModel: model,
      appointmentModel: { findOne: async () => ({ messagingVersion: 3, status: 'confirmed' }) },
      send: async () => {
        sends += 1;
        throw Object.assign(new Error('rate limited'), { status: 429 });
      },
      now,
    });

    expect(firstResult).toMatchObject({ state: 'retry_wait', attempts: 1 });
    expect(model.jobs[0]).toMatchObject({ state: 'retry_wait', attempts: 1, dispatchStartedAt: null });

    const retryAt = new Date(now.getTime() + RETRY_DELAYS_MS[0]);
    const secondClaim = await claimDueMessageJob(model, retryAt, 60_000, () => 'lease-2');
    const secondResult = await processClaimedMessageJob({
      job: secondClaim,
      jobModel: model,
      appointmentModel: { findOne: async () => ({ messagingVersion: 3, status: 'confirmed' }) },
      send: async () => {
        sends += 1;
        return { providerMessageId: 'provider-1' };
      },
      now: retryAt,
    });

    expect(secondResult).toMatchObject({ state: 'sent', providerMessageId: 'provider-1', attempts: 2 });
    expect(sends).toBe(2);
  });

  it('retries a retryable Meta network error on the next claim', async () => {
    const now = new Date('2026-08-20T12:00:00Z');
    const model = memoryModel([{
      _id: 'job-1', businessId: 'biz', appointmentId: 'appt', messagingVersion: 3,
      state: 'scheduled', scheduledAt: now, attempts: 0, dispatchStartedAt: null,
    }]);
    let sends = 0;

    const firstClaim = await claimDueMessageJob(model, now, 60_000, () => 'lease-1');
    const firstResult = await processClaimedMessageJob({
      job: firstClaim,
      jobModel: model,
      appointmentModel: { findOne: async () => ({ messagingVersion: 3, status: 'confirmed' }) },
      send: async () => {
        sends += 1;
        throw Object.assign(new Error('network unavailable'), { code: 'NETWORK_ERROR', retryable: true });
      },
      now,
    });

    expect(firstResult).toMatchObject({ state: 'retry_wait', attempts: 1 });
    expect(model.jobs[0]).toMatchObject({ state: 'retry_wait', attempts: 1, dispatchStartedAt: null });

    const retryAt = new Date(now.getTime() + RETRY_DELAYS_MS[0]);
    const secondClaim = await claimDueMessageJob(model, retryAt, 60_000, () => 'lease-2');
    const secondResult = await processClaimedMessageJob({
      job: secondClaim,
      jobModel: model,
      appointmentModel: { findOne: async () => ({ messagingVersion: 3, status: 'confirmed' }) },
      send: async () => {
        sends += 1;
        return { providerMessageId: 'provider-1' };
      },
      now: retryAt,
    });

    expect(secondResult).toMatchObject({ state: 'sent', providerMessageId: 'provider-1', attempts: 2 });
    expect(sends).toBe(2);
  });

  it('does not dispatch terminal replay and treats timeout as delivery unknown', async () => {
    const terminal = { _id: 'job-1', state: 'sent', leaseToken: null };
    let sends = 0;
    const terminalResult = await processClaimedMessageJob({
      job: terminal,
      jobModel: { findOne: async () => terminal, updateOne: async () => {} },
      appointmentModel: { findOne: async () => ({ messagingVersion: 1, status: 'confirmed' }) },
      send: async () => { sends += 1; },
      now: new Date(),
    });
    expect(terminalResult).toMatchObject({ state: 'sent', replay: true });
    expect(sends).toBe(0);
    expect(isRetryableWorkerError(Object.assign(new Error('timeout'), { code: 'ETIMEDOUT' }))).toBe(false);
  });
});

describe('messaging scheduler contract', () => {
  it('authenticates with constant-time comparison and bounds work', async () => {
    expect(timingSafeSecretEquals('secret', 'secret')).toBe(true);
    expect(timingSafeSecretEquals('secret', 'wrong')).toBe(false);
    const claimed = Array.from({ length: MAX_WORK_PER_RUN + 5 }, (_, index) => ({ _id: String(index) }));
    let processed = 0;
    const result = await runMessageWorker({
      claim: async () => claimed.shift() ?? null,
      process: async () => { processed += 1; return { state: 'sent' as const }; },
      now: new Date(),
    });
    expect(processed).toBe(MAX_WORK_PER_RUN);
    expect(result.processed).toBe(MAX_WORK_PER_RUN);
  });
});
