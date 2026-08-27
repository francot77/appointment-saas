import { describe, expect, it } from 'vitest';
import { AutomaticUsage } from '@/lib/models/AutomaticUsage';
import { commit, markUncertain, reconcileUncertainAsOperator, release, reserve } from '@/lib/messaging/usage';

type AllocationState = 'reserved' | 'uncertain' | 'accepted' | 'released';
type Allocation = { jobKey: string; jobId: string; state: AllocationState; [key: string]: unknown };
type UsageDocument = { businessId: string; periodKey: string; acceptedCount: number; allocations: Allocation[] };
type UsageFilter = {
  businessId?: string;
  periodKey?: string;
  'allocations.jobKey'?: { $ne?: string } | string;
  allocations?: { $elemMatch?: { jobKey: string; state: { $in: AllocationState[] } } };
  $expr?: { $lt: [unknown, number] };
};
type UsageUpdate = {
  $setOnInsert?: UsageDocument;
  $push?: { allocations: Allocation };
  $pull?: { allocations: { jobKey: string; state: AllocationState | { $in: AllocationState[] } } };
  $inc?: { acceptedCount: number };
  $set?: Record<string, unknown>;
};
function isAllocationState(value: unknown): value is AllocationState {
  return value === 'reserved' || value === 'uncertain' || value === 'accepted' || value === 'released';
}

function memoryModel(initial: UsageDocument[] = []) {
  const documents = initial;
  let locked = false;
  async function atomic<T>(operation: () => T) {
    while (locked) await Promise.resolve();
    locked = true;
    try { return operation(); } finally { locked = false; }
  }
  const find = (filter: UsageFilter) => documents.find((doc) => doc.businessId === filter.businessId && doc.periodKey === filter.periodKey);
  return {
    documents,
    async updateOne(filter: UsageFilter, update: UsageUpdate) {
      if (!find(filter) && update.$setOnInsert) documents.push({ ...update.$setOnInsert });
    },
    async findOne(filter: UsageFilter) {
      const doc = find(filter);
      const jobKey = filter['allocations.jobKey'];
      return doc && (!jobKey || (typeof jobKey === 'string' && doc.allocations.some((a) => a.jobKey === jobKey))) ? doc : null;
    },
    async findOneAndUpdate(filter: UsageFilter, update: UsageUpdate, options: { arrayFilters?: unknown[] } = {}) {
      return atomic(() => {
        if (options.arrayFilters && !Object.values(update).some((value) => JSON.stringify(value).includes('$[allocation]'))) {
          throw new Error('unused array filter identifier: allocation');
        }
        const doc = find(filter);
        const active = doc?.allocations.filter((a) => ['reserved', 'uncertain'].includes(a.state)).length ?? 0;
        if (!doc || (filter.$expr && doc.acceptedCount + active >= filter.$expr.$lt[1])) return null;
        const jobKeyFilter = filter['allocations.jobKey'];
        if (typeof jobKeyFilter === 'object' && jobKeyFilter.$ne && doc.allocations.some((a) => a.jobKey === jobKeyFilter.$ne)) return null;
        if (filter.allocations?.$elemMatch) {
          const allocation = doc.allocations.find((a) => a.jobKey === filter.allocations?.$elemMatch?.jobKey && filter.allocations?.$elemMatch?.state.$in.includes(a.state));
          if (!allocation) return null;
          if (update.$pull) {
            const pull = update.$pull.allocations;
            const states = typeof pull.state === 'object' ? pull.state.$in : [pull.state];
            doc.allocations = doc.allocations.filter((a) => !(a.jobKey === pull.jobKey && states.includes(a.state)));
          }
          if (update.$inc) doc.acceptedCount += update.$inc.acceptedCount;
          if (update.$set) {
            allocation.state = Object.values(update.$set)[0] === 'accepted' ? 'accepted' : Object.values(update.$set)[0] === 'uncertain' ? 'uncertain' : allocation.state;
            allocation.providerMessageId = Object.values(update.$set).find((v) => typeof v === 'string' && v !== 'accepted' && v !== 'uncertain') ?? allocation.providerMessageId;
            const set = update.$set;
            const nextState = set['allocations.$[allocation].state'];
            if (isAllocationState(nextState)) allocation.state = nextState;
            allocation.reconcilerId = set['allocations.$[allocation].reconcilerId'] ?? allocation.reconcilerId;
            allocation.reconciliationReason = set['allocations.$[allocation].reconciliationReason'] ?? allocation.reconciliationReason;
            allocation.reconciliationEvidenceRef = set['allocations.$[allocation].reconciliationEvidenceRef'] ?? allocation.reconciliationEvidenceRef;
            allocation.reconciledAt = set['allocations.$[allocation].reconciledAt'] ?? allocation.reconciledAt;
            allocation.providerMessageId = set['allocations.$[allocation].providerMessageId'] ?? allocation.providerMessageId;
          }
          return doc;
        }
        const allocation = update.$push?.allocations;
        if (!allocation) throw new Error('missing allocation');
        doc.allocations.push(allocation);
        return doc;
      });
    },
  };
}

function context(model: ReturnType<typeof memoryModel>, limit = 1) {
  return { model, businessId: 'business-a', periodKey: '2026-08', timezone: 'UTC', limit, now: new Date(0) };
}

describe('automatic usage accounting', () => {
  it('admits exactly one of two concurrent final-slot jobs and rejects off-by-one', async () => {
    const model = memoryModel();
    const input = context(model);
    const results = await Promise.all([
      reserve({ ...input, model } as never, { jobKey: 'job-a', jobId: 'a' }),
      reserve({ ...input, model } as never, { jobKey: 'job-b', jobId: 'b' }),
    ]);
    expect(results.filter((result) => result.status === 'admitted')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'denied')).toHaveLength(1);
    expect(model.documents[0].allocations).toHaveLength(1);
  });

  it('replays duplicate reserve and commits only once', async () => {
    const model = memoryModel();
    const input = context(model);
    expect((await reserve(input as never, { jobKey: 'job-a', jobId: 'a' })).status).toBe('admitted');
    expect((await reserve(input as never, { jobKey: 'job-a', jobId: 'a' })).status).toBe('replayed');
    expect((await commit(input as never, { jobKey: 'job-a', jobId: 'a' }, 'wamid.1')).status).toBe('committed');
    expect((await commit(input as never, { jobKey: 'job-a', jobId: 'a' }, 'wamid.1')).status).toBe('replayed');
    expect(model.documents[0].acceptedCount).toBe(1);
  });

  it('releases definite failures and uncertain outcomes without unused array filters', async () => {
    const model = memoryModel();
    const input = context(model, 2);
    await reserve(input as never, { jobKey: 'job-a', jobId: 'a' });
    expect((await release(input as never, { jobKey: 'job-a', jobId: 'a' })).status).toBe('released');
    await reserve(input as never, { jobKey: 'job-b', jobId: 'b' });
    expect((await markUncertain(input as never, { jobKey: 'job-b', jobId: 'b' })).status).toBe('uncertain');
    expect(model.documents[0].acceptedCount).toBe(0);
    expect((await release(input as never, { jobKey: 'job-b', jobId: 'b' })).status).toBe('released');
    expect(model.documents[0].allocations).toHaveLength(0);
    expect((await release(input as never, { jobKey: 'job-b', jobId: 'b' })).status).toBe('missing');
  });

  it('does not release an accepted allocation', async () => {
    const model = memoryModel();
    const input = context(model, 2);
    await reserve(input as never, { jobKey: 'job-a', jobId: 'a' });
    expect((await commit(input as never, { jobKey: 'job-a', jobId: 'a' }, 'wamid.1')).status).toBe('committed');
    expect((await release(input as never, { jobKey: 'job-a', jobId: 'a' })).status).toBe('replayed');
    expect(model.documents[0].allocations).toHaveLength(1);
  });

  it('keeps tenants and calendar periods in separate counters', async () => {
    const model = memoryModel();
    await reserve({ ...context(model), businessId: 'business-a' } as never, { jobKey: 'same-key', jobId: 'a' });
    await reserve({ ...context(model), businessId: 'business-b' } as never, { jobKey: 'same-key', jobId: 'b' });
    await reserve({ ...context(model), periodKey: '2026-09' } as never, { jobKey: 'same-key', jobId: 'c' });
    expect(model.documents).toHaveLength(3);
    expect(model.documents.every((document) => Array.isArray(document.allocations))).toBe(true);
  });

  it('trusted reconciliation commits an uncertain allocation once with immutable audit data', async () => {
    const model = memoryModel();
    const input = context(model);
    await reserve(input as never, { jobKey: 'job-a', jobId: 'a' });
    await markUncertain(input as never, { jobKey: 'job-a', jobId: 'a' });

    const audit = { role: 'operator' as const, reconcilerId: 'ops-1', reason: 'Provider confirmed delivery', evidenceRef: 'case-42', reconciledAt: new Date(1), providerMessageId: 'wamid.reconciled' };
    expect((await reconcileUncertainAsOperator(input as never, { jobKey: 'job-a', jobId: 'a' }, 'commit', audit)).status).toBe('committed');
    expect((await reconcileUncertainAsOperator(input as never, { jobKey: 'job-a', jobId: 'a' }, 'commit', audit)).status).toBe('replayed');
    expect(model.documents[0]).toMatchObject({ acceptedCount: 1, allocations: [{ state: 'accepted', reconcilerId: 'ops-1', reconciliationReason: audit.reason, reconciliationEvidenceRef: audit.evidenceRef, reconciledAt: audit.reconciledAt }] });
  });

  it('trusted reconciliation releases uncertainty while retaining the audit record', async () => {
    const model = memoryModel();
    const input = context(model);
    await reserve(input as never, { jobKey: 'job-a', jobId: 'a' });
    await markUncertain(input as never, { jobKey: 'job-a', jobId: 'a' });

    const audit = { role: 'operator' as const, reconcilerId: 'ops-2', reason: 'Provider confirmed rejection', evidenceRef: 'case-43', reconciledAt: new Date(2) };
    expect((await reconcileUncertainAsOperator(input as never, { jobKey: 'job-a', jobId: 'a' }, 'release', audit)).status).toBe('released');
    expect((await reconcileUncertainAsOperator(input as never, { jobKey: 'job-a', jobId: 'a' }, 'release', audit)).status).toBe('replayed');
    expect(model.documents[0]).toMatchObject({ acceptedCount: 0, allocations: [{ state: 'released', reconcilerId: 'ops-2', reconciliationReason: audit.reason, reconciliationEvidenceRef: audit.evidenceRef, reconciledAt: audit.reconciledAt }] });
  });

  it('rejects a non-operator reconciliation caller before mutation', async () => {
    const model = memoryModel();
    const input = context(model);
    await reserve(input as never, { jobKey: 'job-a', jobId: 'a' });
    await markUncertain(input as never, { jobKey: 'job-a', jobId: 'a' });

    await expect(reconcileUncertainAsOperator(input as never, { jobKey: 'job-a', jobId: 'a' }, 'release', { role: 'operator', reconcilerId: '', reason: 'no', evidenceRef: 'case-44' })).rejects.toThrow('UNAUTHORIZED_TRUSTED_RECONCILER');
    expect(model.documents[0].allocations[0].state).toBe('uncertain');
  });

  it('isolates tenants and periods and declares the required indexes', () => {
    const indexes = AutomaticUsage.schema.indexes();
    expect(indexes).toEqual(expect.arrayContaining([
      [{ businessId: 1, periodKey: 1 }, { unique: true }],
      [{ businessId: 1, 'allocations.jobKey': 1 }, {}],
    ]));
  });
});
