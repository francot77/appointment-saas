import { AutomaticUsage } from '@/lib/models/AutomaticUsage';

export type UsageState = 'reserved' | 'accepted' | 'uncertain' | 'released';

export type UsageAllocation = {
  jobKey: string;
  jobId: string;
  state: UsageState;
  reservedAt: Date;
  resolvedAt?: Date | null;
  providerMessageId?: string | null;
  reconcilerId?: string | null;
  reconciliationReason?: string | null;
  reconciliationEvidenceRef?: string | null;
  reconciledAt?: Date | null;
};

export type AutomaticUsageDocument = {
  businessId: unknown;
  periodKey: string;
  timezone: string;
  acceptedCount: number;
  allocations: UsageAllocation[];
};

export type UsageModel = {
  updateOne: (filter: Record<string, unknown>, update: Record<string, unknown>, options?: Record<string, unknown>) => Promise<unknown>;
  findOne: (filter: Record<string, unknown>) => Promise<AutomaticUsageDocument | null>;
  findOneAndUpdate: (filter: Record<string, unknown>, update: Record<string, unknown>, options?: Record<string, unknown>) => Promise<AutomaticUsageDocument | null>;
};

const usageModel = AutomaticUsage as unknown as UsageModel;

export type UsageContext = {
  businessId: unknown;
  periodKey: string;
  timezone: string;
  limit: number;
  now?: Date;
  model?: UsageModel;
};

export type UsageJob = {
  jobKey: string;
  jobId: string;
};

export type TrustedReconciliation = {
  role: 'operator';
  reconcilerId: string;
  reason: string;
  evidenceRef: string;
  reconciledAt?: Date;
  providerMessageId?: string;
};

export type ReserveResult =
  | { status: 'admitted'; allocation: UsageAllocation; usage: AutomaticUsageDocument }
  | { status: 'replayed'; allocation: UsageAllocation; usage: AutomaticUsageDocument }
  | { status: 'denied'; reason: 'quota_exceeded'; usage: AutomaticUsageDocument | null };

export type MutationResult = {
  status: 'committed' | 'released' | 'uncertain' | 'replayed' | 'missing';
  usage: AutomaticUsageDocument | null;
};

function documentValue(document: AutomaticUsageDocument | null) {
  return document && typeof (document as unknown as { toObject?: () => AutomaticUsageDocument }).toObject === 'function'
    ? (document as unknown as { toObject: () => AutomaticUsageDocument }).toObject()
    : document;
}

function modelFor(context: UsageContext) {
  return context.model ?? usageModel;
}

async function ensurePeriod(context: UsageContext, now: Date) {
  await modelFor(context).updateOne(
    { businessId: context.businessId, periodKey: context.periodKey },
    {
      $setOnInsert: {
        businessId: context.businessId,
        periodKey: context.periodKey,
        timezone: context.timezone,
        acceptedCount: 0,
        allocations: [],
        createdAt: now,
      },
    },
    { upsert: true },
  );
}

function allocationFilter(context: UsageContext, job: UsageJob) {
  return { businessId: context.businessId, periodKey: context.periodKey, 'allocations.jobKey': job.jobKey };
}

async function findExisting(context: UsageContext, job: UsageJob) {
  const usage = documentValue(await modelFor(context).findOne(allocationFilter(context, job)));
  return usage?.allocations.find((allocation) => allocation.jobKey === job.jobKey);
}

/** Atomically admits one job, or replays its existing allocation. */
export async function reserve(context: UsageContext, job: UsageJob): Promise<ReserveResult> {
  const now = context.now ?? new Date();
  await ensurePeriod(context, now);

  const existing = await findExisting(context, job);
  if (existing) {
    const usage = documentValue(await modelFor(context).findOne({ businessId: context.businessId, periodKey: context.periodKey }));
    return { status: 'replayed', allocation: existing, usage: usage! };
  }

  const usage = documentValue(await modelFor(context).findOneAndUpdate(
    {
      businessId: context.businessId,
      periodKey: context.periodKey,
      'allocations.jobKey': { $ne: job.jobKey },
      $expr: {
        $lt: [
          {
            $add: [
              '$acceptedCount',
              {
                $size: {
                  $filter: {
                    input: { $ifNull: ['$allocations', []] },
                    as: 'allocation',
                    cond: { $in: ['$$allocation.state', ['reserved', 'uncertain']] },
                  },
                },
              },
            ],
          },
          context.limit,
        ],
      },
    },
    { $push: { allocations: { jobKey: job.jobKey, jobId: job.jobId, state: 'reserved', reservedAt: now } } },
    { new: true },
  ));

  if (usage) {
    return { status: 'admitted', allocation: usage.allocations.find((allocation) => allocation.jobKey === job.jobKey)!, usage };
  }

  const replayed = await findExisting(context, job);
  if (replayed) {
    const current = documentValue(await modelFor(context).findOne({ businessId: context.businessId, periodKey: context.periodKey }));
    return { status: 'replayed', allocation: replayed, usage: current! };
  }
  return { status: 'denied', reason: 'quota_exceeded', usage: documentValue(await modelFor(context).findOne({ businessId: context.businessId, periodKey: context.periodKey })) };
}

async function mutateAllocation(
  context: UsageContext,
  job: UsageJob,
  allowedStates: UsageState[],
  update: Record<string, unknown>,
): Promise<MutationResult> {
  const options = { new: true } as Record<string, unknown>;
  const updateUsesAllocationFilter = Object.values(update).some((value) =>
    JSON.stringify(value).includes('$[allocation]'),
  );
  if (updateUsesAllocationFilter) {
    options.arrayFilters = [{ 'allocation.jobKey': job.jobKey, 'allocation.state': { $in: allowedStates } }];
  }
  const usage = documentValue(await modelFor(context).findOneAndUpdate(
    {
      ...allocationFilter(context, job),
      allocations: { $elemMatch: { jobKey: job.jobKey, state: { $in: allowedStates } } },
    },
    update,
    options,
  ));
  if (usage) {
    const state = usage.allocations.find((allocation) => allocation.jobKey === job.jobKey)?.state;
    return { status: state === 'accepted' ? 'committed' : state === 'uncertain' ? 'uncertain' : 'released', usage };
  }

  const existing = await findExisting(context, job);
  if (existing?.state === 'accepted') return { status: 'replayed', usage: documentValue(await modelFor(context).findOne({ businessId: context.businessId, periodKey: context.periodKey })) };
  if (existing?.state === 'uncertain') return { status: 'uncertain', usage: documentValue(await modelFor(context).findOne({ businessId: context.businessId, periodKey: context.periodKey })) };
  if (existing?.state === 'released') return { status: 'replayed', usage: documentValue(await modelFor(context).findOne({ businessId: context.businessId, periodKey: context.periodKey })) };
  return { status: 'missing', usage: documentValue(await modelFor(context).findOne({ businessId: context.businessId, periodKey: context.periodKey })) };
}

export function commit(context: UsageContext, job: UsageJob, providerMessageId: string) {
  return mutateAllocation(context, job, ['reserved', 'uncertain'], {
    $set: {
      'allocations.$[allocation].state': 'accepted',
      'allocations.$[allocation].resolvedAt': context.now ?? new Date(),
      'allocations.$[allocation].providerMessageId': providerMessageId,
    },
    $inc: { acceptedCount: 1 },
  },);
}

export function markUncertain(context: UsageContext, job: UsageJob) {
  return mutateAllocation(context, job, ['reserved'], {
    $set: {
      'allocations.$[allocation].state': 'uncertain',
      'allocations.$[allocation].resolvedAt': context.now ?? new Date(),
    },
  });
}

export function release(context: UsageContext, job: UsageJob) {
  return mutateAllocation(context, job, ['reserved', 'uncertain'], {
    $pull: { allocations: { jobKey: job.jobKey, state: { $in: ['reserved', 'uncertain'] } } },
  });
}

export function releaseReserved(context: UsageContext, job: UsageJob) {
  return mutateAllocation(context, job, ['reserved'], {
    $pull: { allocations: { jobKey: job.jobKey, state: 'reserved' } },
  });
}

/** Backend-only reconciliation for a quarantined provider outcome. */
export async function reconcileUncertainAsOperator(
  context: UsageContext,
  job: UsageJob,
  decision: 'commit' | 'release',
  audit: TrustedReconciliation,
) {
  if (
    audit.role !== 'operator' ||
    audit.reconcilerId.trim() === '' ||
    audit.reason.trim() === '' ||
    audit.evidenceRef.trim() === ''
  ) {
    throw new Error('UNAUTHORIZED_TRUSTED_RECONCILER');
  }

  const resolvedAt = audit.reconciledAt ?? context.now ?? new Date();
  const state = decision === 'commit' ? 'accepted' : 'released';
  const set: Record<string, unknown> = {
    'allocations.$[allocation].state': state,
    'allocations.$[allocation].resolvedAt': resolvedAt,
    'allocations.$[allocation].reconcilerId': audit.reconcilerId.trim(),
    'allocations.$[allocation].reconciliationReason': audit.reason.trim(),
    'allocations.$[allocation].reconciliationEvidenceRef': audit.evidenceRef.trim(),
    'allocations.$[allocation].reconciledAt': resolvedAt,
  };
  if (decision === 'commit' && audit.providerMessageId) {
    set['allocations.$[allocation].providerMessageId'] = audit.providerMessageId;
  }

  return mutateAllocation(context, job, ['uncertain'], {
    $set: set,
    ...(decision === 'commit' ? { $inc: { acceptedCount: 1 } } : {}),
  });
}

export const reserveUsage = reserve;
export const commitUsage = commit;
export const markUsageUncertain = markUncertain;
export const releaseUsage = release;
