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

describe('automatic usage admission', () => {
  const baseJob = { _id: 'job-auto', businessId: 'basic', appointmentId: 'appt', messagingVersion: 1, state: 'leased', leaseToken: 'lease', attempts: 0, idempotencyKey: 'usage-job' };
  const appointmentModel = { findOne: async () => ({ messagingVersion: 1, status: 'confirmed' }) };
  const usageContext = { businessId: 'basic', periodKey: '2026-08', timezone: 'America/Argentina/Buenos_Aires', limit: 1, now: new Date(), model: {
    updateOne: async () => ({}),
    findOne: async () => ({ businessId: 'basic', periodKey: '2026-08', timezone: 'America/Argentina/Buenos_Aires', acceptedCount: 0, allocations: [] }),
    findOneAndUpdate: async (_filter: any, update: any) => ({ businessId: 'basic', periodKey: '2026-08', timezone: 'America/Argentina/Buenos_Aires', acceptedCount: update.$inc?.acceptedCount ?? 0, allocations: [{ jobKey: 'usage-job', jobId: 'job-auto', state: update.$pull ? 'released' : update.$set ? (update.$set['allocations.$[allocation].state'] ?? 'reserved') : 'reserved', reservedAt: new Date() }] }),
  } } as any;

  function jobModel(updates: any[], override: any = {}) {
    return { findOne: async () => ({ ...baseJob, ...override }), updateOne: async (_filter: any, update: any) => { updates.push(update); return { matchedCount: 1, modifiedCount: 1 }; } };
  }

  it('blocks a Basic automatic job before the provider and leaves manual jobs outside usage enforcement', async () => {
    const updates: any[] = [];
    let sends = 0;
    const result = await processClaimedMessageJob({
      job: baseJob, jobModel: jobModel(updates), appointmentModel,
      admitAutomatic: async () => ({ status: 'blocked', reason: 'entitlement_denied', audit: { effectivePlan: 'basic', usageAllowance: 0 } }),
      send: async () => { sends += 1; },
    });
    expect(result).toMatchObject({ state: 'dead', failureCode: 'entitlement_denied' });
    expect(sends).toBe(0);
    expect(updates[0].$set.usageAllowance).toBe(0);

    const connectionBlocked = await processClaimedMessageJob({
      job: baseJob, jobModel: jobModel([]), appointmentModel,
      admitAutomatic: async () => ({ status: 'blocked' as const, reason: 'connection_blocked' as const }),
      send: async () => { sends += 1; },
    });
    expect(connectionBlocked).toMatchObject({ state: 'dead', failureCode: 'connection_blocked' });

    const manual = await processClaimedMessageJob({
      job: { ...baseJob, automatic: false }, jobModel: jobModel([], { automatic: false }), appointmentModel,
      admitAutomatic: async () => { throw new Error('manual flow must not admit usage'); },
      send: async () => ({ providerMessageId: 'manual-provider' }),
    });
    expect(manual.state).toBe('sent');
  });

  it('projects a complete auditable model for a quota-blocked automatic job', async () => {
    const updates: any[] = [];
    let sends = 0;
    const result = await processClaimedMessageJob({
      job: { ...baseJob, provider: 'meta_whatsapp_cloud', providerMessageId: null },
      jobModel: jobModel(updates, { provider: 'meta_whatsapp_cloud', providerMessageId: null }),
      appointmentModel,
      admitAutomatic: async () => ({
        status: 'blocked' as const,
        reason: 'quota_exceeded' as const,
        audit: {
          usagePeriodKey: '2026-08',
          usageTimezone: 'America/Argentina/Buenos_Aires',
          effectivePlan: 'premium',
          usageAllowance: 100,
          usageAccepted: 100,
          usageUncertain: 0,
        },
      }),
      send: async () => { sends += 1; },
    });

    expect(result).toMatchObject({
      _id: 'job-auto',
      businessId: 'basic',
      idempotencyKey: 'usage-job',
      state: 'dead',
      failureCode: 'quota_exceeded',
      usagePeriodKey: '2026-08',
      usageTimezone: 'America/Argentina/Buenos_Aires',
      effectivePlan: 'premium',
      usageAllowance: 100,
      usageOutcome: 'quota_exceeded',
      usageAccepted: 100,
      usageUncertain: 0,
      provider: 'meta_whatsapp_cloud',
      providerMessageId: null,
    });
    expect(updates[0].$set).toMatchObject({
      usagePeriodKey: '2026-08',
      usageTimezone: 'America/Argentina/Buenos_Aires',
      effectivePlan: 'premium',
      usageAllowance: 100,
      usageOutcome: 'quota_exceeded',
      usageAccepted: 100,
      usageUncertain: 0,
    });
    expect(sends).toBe(0);
  });

  it('finalizes an accepted allocation on lease recovery without calling Meta again', async () => {
    let sends = 0;
    const result = await processClaimedMessageJob({
      job: { ...baseJob, dispatchStartedAt: new Date() }, jobModel: jobModel([], { dispatchStartedAt: new Date() }), appointmentModel,
      admitAutomatic: async () => ({ status: 'accepted' as const, audit: { usageOutcome: 'accepted', providerMessageId: 'wamid.recovered' } }),
      send: async () => { sends += 1; },
    });
    expect(result).toMatchObject({ state: 'sent', replay: true, usageOutcome: 'accepted' });
    expect(sends).toBe(0);
  });

  it('releases a reserved slot on definite provider failure and quarantines timeout uncertainty', async () => {
    const definiteUpdates: any[] = [];
    const admitted = async () => ({ status: 'admitted' as const, context: usageContext, audit: { usagePeriodKey: '2026-08', usageTimezone: usageContext.timezone } });
    const definite = await processClaimedMessageJob({
      job: baseJob, jobModel: jobModel(definiteUpdates), appointmentModel, admitAutomatic: admitted,
      send: async () => { throw Object.assign(new Error('429'), { status: 429 }); },
    });
    expect(definite).toMatchObject({ state: 'retry_wait', usageOutcome: 'released' });

    const uncertainUpdates: any[] = [];
    const uncertain = await processClaimedMessageJob({
      job: baseJob, jobModel: jobModel(uncertainUpdates), appointmentModel, admitAutomatic: admitted,
      send: async () => { throw Object.assign(new Error('timeout'), { certainty: 'ambiguous' }); },
    });
    expect(uncertain).toMatchObject({ state: 'dead', failureCode: 'delivery_unknown', usageOutcome: 'delivery_unknown' });
  });

  it('keeps an uncertain reservation when usage commit fails after provider acceptance', async () => {
    const updates: any[] = [];
    const allocation = { jobKey: 'usage-job', jobId: 'job-auto', state: 'reserved', reservedAt: new Date() };
    let usageMutations = 0;
    const usageModel = {
      updateOne: async () => ({}),
      findOne: async () => ({ businessId: 'basic', periodKey: '2026-08', timezone: 'UTC', acceptedCount: 0, allocations: [allocation] }),
      findOneAndUpdate: async (_filter: any, update: any) => {
        usageMutations += 1;
        if (usageMutations === 1) throw new Error('usage commit unavailable');
        allocation.state = update.$set['allocations.$[allocation].state'];
        return { businessId: 'basic', periodKey: '2026-08', timezone: 'UTC', acceptedCount: 0, allocations: [allocation] };
      },
    } as any;
    let sends = 0;
    const result = await processClaimedMessageJob({
      job: baseJob,
      jobModel: jobModel(updates),
      appointmentModel,
      admitAutomatic: async () => ({ status: 'admitted' as const, context: { ...usageContext, model: usageModel }, reservationOwned: true, audit: { usageOutcome: 'reserved' } }),
      send: async () => { sends += 1; return { providerMessageId: 'wamid.accepted-before-commit-failure' }; },
    });

    expect(result).toMatchObject({
      state: 'dead',
      failureCode: 'delivery_unknown',
      usageOutcome: 'delivery_unknown',
      providerMessageId: 'wamid.accepted-before-commit-failure',
    });
    expect(sends).toBe(1);
    expect(usageMutations).toBe(2);
    expect(allocation.state).toBe('uncertain');
    expect(updates.at(-1).$set).not.toMatchObject({ state: 'retry_wait' });
    expect(updates.at(-1).$set).not.toHaveProperty('dispatchStartedAt', null);
  });

  it('releases its reserved slot when invalidated before dispatch starts', async () => {
    const allocation = [
      { jobKey: 'usage-job', jobId: 'job-auto', state: 'reserved', reservedAt: new Date() },
      { jobKey: 'other-uncertain', jobId: 'job-uncertain', state: 'uncertain', reservedAt: new Date() },
      { jobKey: 'other-accepted', jobId: 'job-accepted', state: 'accepted', reservedAt: new Date() },
    ];
    const usageModel = {
      updateOne: async () => ({}),
      findOne: async () => ({ businessId: 'basic', periodKey: '2026-08', timezone: 'UTC', acceptedCount: 1, allocations: allocation }),
      findOneAndUpdate: async (filter: any, update: any) => {
        expect(filter['allocations.jobKey']).toBe('usage-job');
        expect(filter.allocations.$elemMatch.state.$in).toEqual(['reserved']);
        expect(update.$pull.allocations).toEqual({ jobKey: 'usage-job', state: 'reserved' });
        const index = allocation.findIndex((item) => item.jobKey === update.$pull.allocations.jobKey && item.state === 'reserved');
        if (index === -1) return null;
        allocation.splice(index, 1);
        return { businessId: 'basic', periodKey: '2026-08', timezone: 'UTC', acceptedCount: 1, allocations: allocation };
      },
    } as any;
    const updates: any[] = [];
    const result = await processClaimedMessageJob({
      job: baseJob,
      jobModel: {
        findOne: async () => ({ ...baseJob }),
        updateOne: async (_filter: any, update: any) => {
          updates.push(update);
          return update.$set.dispatchStartedAt ? { matchedCount: 0, modifiedCount: 0 } : { matchedCount: 1, modifiedCount: 1 };
        },
      },
      appointmentModel,
      admitAutomatic: async () => ({ status: 'admitted' as const, context: { ...usageContext, model: usageModel }, reservationOwned: true }),
      send: async () => { throw new Error('provider must not be called'); },
    });

    expect(result).toMatchObject({ state: 'invalidated' });
    expect(updates).toHaveLength(1);
    expect(allocation).toEqual(expect.arrayContaining([
      expect.objectContaining({ jobKey: 'other-uncertain', state: 'uncertain' }),
      expect.objectContaining({ jobKey: 'other-accepted', state: 'accepted' }),
    ]));
    expect(allocation).not.toEqual(expect.arrayContaining([expect.objectContaining({ jobKey: 'usage-job' })]));
  });

  it('releases its owned reserved slot when appointment invalidates after dispatch starts', async () => {
    const allocation = [
      { jobKey: 'usage-job', jobId: 'job-auto', state: 'reserved', reservedAt: new Date() },
      { jobKey: 'other-uncertain', jobId: 'job-uncertain', state: 'uncertain', reservedAt: new Date() },
      { jobKey: 'other-accepted', jobId: 'job-accepted', state: 'accepted', reservedAt: new Date() },
    ];
    const usageModel = {
      updateOne: async () => ({}),
      findOne: async () => ({ businessId: 'basic', periodKey: '2026-08', timezone: 'UTC', acceptedCount: 1, allocations: allocation }),
      findOneAndUpdate: async (filter: any, update: any) => {
        expect(filter['allocations.jobKey']).toBe('usage-job');
        expect(filter.allocations.$elemMatch.state.$in).toEqual(['reserved']);
        expect(update.$pull.allocations).toEqual({ jobKey: 'usage-job', state: 'reserved' });
        const index = allocation.findIndex((item) => item.jobKey === update.$pull.allocations.jobKey && item.state === 'reserved');
        if (index === -1) return null;
        allocation.splice(index, 1);
        return { businessId: 'basic', periodKey: '2026-08', timezone: 'UTC', acceptedCount: 1, allocations: allocation };
      },
    } as any;
    const updates: any[] = [];
    let appointmentReads = 0;
    const result = await processClaimedMessageJob({
      job: baseJob,
      jobModel: {
        findOne: async () => ({ ...baseJob }),
        updateOne: async (_filter: any, update: any) => {
          updates.push(update);
          return { matchedCount: 1, modifiedCount: 1 };
        },
      },
      appointmentModel: { findOne: async () => {
        appointmentReads += 1;
        return appointmentReads === 1
          ? { messagingVersion: 1, status: 'confirmed' }
          : { messagingVersion: 2, status: 'confirmed' };
      } },
      admitAutomatic: async () => ({ status: 'admitted' as const, context: { ...usageContext, model: usageModel }, reservationOwned: true }),
      send: async () => { throw new Error('provider must not be called'); },
    });

    expect(result).toMatchObject({ state: 'invalidated' });
    expect(updates).toHaveLength(2);
    expect(updates[0].$set.dispatchStartedAt).toBeDefined();
    expect(updates[1].$set).toMatchObject({ state: 'invalidated', leaseToken: null, leaseExpiresAt: null });
    expect(allocation).toEqual(expect.arrayContaining([
      expect.objectContaining({ jobKey: 'other-uncertain', state: 'uncertain' }),
      expect.objectContaining({ jobKey: 'other-accepted', state: 'accepted' }),
    ]));
    expect(allocation).not.toEqual(expect.arrayContaining([expect.objectContaining({ jobKey: 'usage-job' })]));
  });
});
