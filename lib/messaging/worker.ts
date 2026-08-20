/* eslint-disable @typescript-eslint/no-explicit-any */
import { randomUUID, timingSafeEqual } from 'node:crypto';
import { MessageJob } from '@/lib/models/MessageJob';
import { Appointment } from '@/lib/models/Appointment';
import { Business } from '@/lib/models/Business';
import { MessagingConnection } from '@/lib/models/MessagingConnection';
import dbConnect from '@/lib/db';
import { resolveEntitlements, getLocalMonthPeriod } from '@/lib/entitlements';
import { commit, markUncertain, release, releaseReserved, reserve, type UsageContext } from '@/lib/messaging/usage';

export const MAX_WORK_PER_RUN = 20;
export const MAX_ATTEMPTS = 5;
export const LEASE_MS = 60_000;
export const RETRY_DELAYS_MS = [60_000, 300_000, 1_800_000, 7_200_000, 43_200_000] as const;

type ClaimModel = { findOneAndUpdate: (filter: any, update: any, options?: any) => Promise<any> };
type JobModel = { findOne: (filter: any) => Promise<any>; updateOne: (filter: any, update: any) => Promise<any> };
export type MessageSender = (job: any) => Promise<{ providerMessageId?: string } | void>;
export type AutomaticAdmission = (job: any, now: Date, reserveSlot: boolean) => Promise<{
  status: 'admitted' | 'accepted' | 'blocked';
  reason?: 'entitlement_denied' | 'connection_blocked' | 'quota_exceeded' | 'delivery_unknown';
  context?: UsageContext;
  usage?: any;
  audit?: Record<string, unknown>;
  reservationOwned?: boolean;
}>;

export function timingSafeSecretEquals(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  const sameLength = actualBuffer.length === expectedBuffer.length;
  const compared = timingSafeEqual(actualBuffer, sameLength ? expectedBuffer : Buffer.alloc(actualBuffer.length));
  return sameLength && compared;
}

export function isRetryableWorkerError(error: any) {
  if (error?.ambiguous || error?.certainty === 'ambiguous' || error?.code === 'ETIMEDOUT' || error?.code === 'DELIVERY_UNKNOWN') return false;
  return error?.retryable === true || error?.code === 'NETWORK_ERROR' || error?.status === 429 || error?.status >= 500
    || ['ECONNRESET', 'ECONNREFUSED', 'ENETUNREACH'].includes(error?.code);
}

function isAmbiguousProviderOutcome(error: any) {
  return error?.ambiguous === true || error?.certainty === 'ambiguous' || error?.code === 'ETIMEDOUT' || error?.code === 'DELIVERY_UNKNOWN';
}

function failureUpdate(job: any, now: Date, error: any) {
  const attempts = (job.attempts ?? 0) + 1;
  if (isAmbiguousProviderOutcome(error)) return { state: 'dead', failureCode: 'delivery_unknown', attempts };
  if (!isRetryableWorkerError(error) || attempts >= MAX_ATTEMPTS) {
    return { state: 'dead', failureCode: isRetryableWorkerError(error) ? 'retry_exhausted' : 'provider_rejected', attempts };
  }
  return { state: 'retry_wait', attempts, scheduledAt: new Date(now.getTime() + RETRY_DELAYS_MS[attempts - 1]) };
}

function usageAudit(usage: any) {
  return {
    usageAccepted: usage?.acceptedCount ?? 0,
    usageUncertain: usage?.allocations?.filter((allocation: any) => allocation.state === 'uncertain').length ?? 0,
  };
}

export async function claimDueMessageJob(jobModel: ClaimModel, now = new Date(), leaseMs = LEASE_MS, tokenFactory: () => string = randomUUID) {
  const leaseToken = tokenFactory();
  return jobModel.findOneAndUpdate(
    { $or: [{ state: { $in: ['scheduled', 'retry_wait'] }, scheduledAt: { $lte: now } }, { state: 'leased', leaseExpiresAt: { $lte: now } }] },
    { $set: { state: 'leased', leaseToken, leaseExpiresAt: new Date(now.getTime() + leaseMs) } },
    { sort: { scheduledAt: 1 }, new: true },
  );
}

export async function processClaimedMessageJob(input: {
  job: any; jobModel: JobModel; appointmentModel: { findOne: (filter: any) => Promise<any> }; send: MessageSender;
  admitAutomatic?: AutomaticAdmission; now?: Date;
}) {
  const now = input.now ?? new Date();
  if (['sent', 'dead', 'invalidated'].includes(input.job.state)) return { ...input.job, replay: true };
  const job = await input.jobModel.findOne({ _id: input.job._id, state: 'leased', leaseToken: input.job.leaseToken });
  if (!job || ['sent', 'dead', 'invalidated'].includes(job.state)) return { ...(job ?? input.job), state: job?.state ?? 'invalidated', replay: true };

  const appointment = await input.appointmentModel.findOne({ _id: job.appointmentId, businessId: job.businessId });
  if (!appointment || appointment.messagingVersion !== job.messagingVersion || ['cancelled', 'canceled'].includes(appointment.status)) {
    await input.jobModel.updateOne({ _id: job._id, state: 'leased', leaseToken: job.leaseToken }, { $set: { state: 'invalidated', invalidatedAt: now, leaseToken: null, leaseExpiresAt: null } });
    return { ...job, state: 'invalidated' };
  }

  let admission: Awaited<ReturnType<AutomaticAdmission>> | undefined;
  if (job.automatic !== false && input.admitAutomatic) {
    admission = await input.admitAutomatic(job, now, !job.dispatchStartedAt);
    if (admission.status === 'blocked') {
      const update = { state: 'dead', failureCode: admission.reason, usageOutcome: admission.reason, ...admission.audit, leaseToken: null, leaseExpiresAt: null };
      await input.jobModel.updateOne({ _id: job._id, state: 'leased', leaseToken: job.leaseToken }, { $set: update });
      return { ...job, ...update };
    }
    if (admission.status === 'accepted') {
      const update = { state: 'sent', usageOutcome: 'accepted', failureCode: null, ...admission.audit, leaseToken: null, leaseExpiresAt: null };
      await input.jobModel.updateOne({ _id: job._id, state: 'leased', leaseToken: job.leaseToken }, { $set: update });
      return { ...job, ...update, replay: true };
    }
  }

  if (job.dispatchStartedAt && !admission) {
    const update = { state: 'dead', failureCode: 'delivery_unknown', usageOutcome: 'delivery_unknown', attempts: (job.attempts ?? 0) + 1, leaseToken: null, leaseExpiresAt: null };
    await input.jobModel.updateOne({ _id: job._id, state: 'leased', leaseToken: job.leaseToken }, { $set: update });
    return { ...job, ...update };
  }

  const started = await input.jobModel.updateOne({ _id: job._id, state: 'leased', leaseToken: job.leaseToken, dispatchStartedAt: null }, { $set: { dispatchStartedAt: now, ...admission?.audit, usageOutcome: admission?.context ? 'reserved' : undefined } });
  if (started?.modifiedCount === 0 || started?.matchedCount === 0) {
    if (admission?.context && admission.reservationOwned) {
      await releaseReserved(admission.context, {
        jobKey: job.idempotencyKey ?? String(job._id),
        jobId: String(job._id),
      });
    }
    return { ...job, state: 'invalidated' };
  }
  const currentJob = await input.jobModel.findOne({ _id: job._id, state: 'leased', leaseToken: job.leaseToken });
  const currentAppointment = currentJob && await input.appointmentModel.findOne({ _id: currentJob.appointmentId, businessId: currentJob.businessId });
  if (!currentJob || !currentAppointment || currentAppointment.messagingVersion !== currentJob.messagingVersion || ['cancelled', 'canceled'].includes(currentAppointment.status)) {
    if (admission?.context && admission.reservationOwned) {
      await releaseReserved(admission.context, {
        jobKey: currentJob?.idempotencyKey ?? job.idempotencyKey ?? String(job._id),
        jobId: String(currentJob?._id ?? job._id),
      });
    }
    await input.jobModel.updateOne({ _id: job._id, state: 'leased', leaseToken: job.leaseToken }, { $set: { state: 'invalidated', invalidatedAt: now, leaseToken: null, leaseExpiresAt: null } });
    return { ...job, state: 'invalidated' };
  }

  let acceptedProviderMessageId: string | undefined;
  try {
    const response = await input.send(currentJob);
    acceptedProviderMessageId = response?.providerMessageId;
    if (admission?.context && response?.providerMessageId) {
      const result = await commit(admission.context, { jobKey: currentJob.idempotencyKey ?? String(currentJob._id), jobId: String(currentJob._id) }, response.providerMessageId);
      if (!['committed', 'replayed'].includes(result.status)) {
        const update = { state: 'dead', failureCode: 'delivery_unknown', usageOutcome: 'delivery_unknown', ...usageAudit(result.usage), leaseToken: null, leaseExpiresAt: null };
        await input.jobModel.updateOne({ _id: currentJob._id, state: 'leased', leaseToken: currentJob.leaseToken }, { $set: update });
        return { ...currentJob, ...update };
      }
      admission.usage = result.usage;
    }
    const update = { state: 'sent', sentAt: now, leaseToken: null, leaseExpiresAt: null, providerMessageId: response?.providerMessageId ?? null, usageOutcome: admission?.context ? 'accepted' : undefined, ...admission?.audit, ...usageAudit(admission?.usage) };
    await input.jobModel.updateOne({ _id: currentJob._id, state: 'leased', leaseToken: currentJob.leaseToken }, { $set: update, $inc: { attempts: 1 } });
    return { ...currentJob, ...update, attempts: (currentJob.attempts ?? 0) + 1 };
  } catch (error) {
    if (admission?.context) {
      const usageJob = { jobKey: currentJob.idempotencyKey ?? String(currentJob._id), jobId: String(currentJob._id) };
      if (acceptedProviderMessageId) {
        const result = await markUncertain(admission.context, usageJob);
        const update = {
          state: 'dead',
          failureCode: 'delivery_unknown',
          attempts: (currentJob.attempts ?? 0) + 1,
          ...admission.audit,
          ...usageAudit(result.usage),
          usageOutcome: 'delivery_unknown',
          providerMessageId: acceptedProviderMessageId,
          leaseToken: null,
          leaseExpiresAt: null,
        };
        await input.jobModel.updateOne({ _id: currentJob._id, state: 'leased', leaseToken: currentJob.leaseToken }, { $set: update });
        return { ...currentJob, ...update };
      }
      const result = isAmbiguousProviderOutcome(error) ? await markUncertain(admission.context, usageJob) : await release(admission.context, usageJob);
      const update = failureUpdate(currentJob, now, error);
      const audit = { ...admission.audit, ...usageAudit(result.usage), usageOutcome: isAmbiguousProviderOutcome(error) ? 'delivery_unknown' : 'released', dispatchStartedAt: null, leaseToken: null, leaseExpiresAt: null };
      await input.jobModel.updateOne({ _id: currentJob._id, state: 'leased', leaseToken: currentJob.leaseToken }, { $set: { ...update, ...audit } });
      return { ...currentJob, ...update, ...audit };
    }
    const update = failureUpdate(currentJob, now, error);
    await input.jobModel.updateOne({ _id: currentJob._id, state: 'leased', leaseToken: currentJob.leaseToken }, { $set: { ...update, dispatchStartedAt: null, leaseToken: null, leaseExpiresAt: null } });
    return { ...currentJob, ...update };
  }
}

export async function admitAutomaticMessageJob(job: any, now: Date, reserveSlot = true) {
  const business = await Business.findById(job.businessId).lean() as any;
  const entitlement = business && resolveEntitlements(business, now);
  const connection = await MessagingConnection.findOne({ businessId: job.businessId }).lean() as any;
  const template = connection?.templates?.find((candidate: any) => candidate.event === job.event);
  const audit = entitlement ? { effectivePlan: entitlement.plan, usageAllowance: entitlement.automaticMessaging.limit, usagePeriodKey: job.usagePeriodKey ?? entitlement.automaticMessaging.period, usageTimezone: job.usageTimezone ?? entitlement.timezone } : {};
  if (!entitlement?.automaticMessaging.available) return { status: 'blocked' as const, reason: 'entitlement_denied' as const, audit };
  if (!connection?.enabled || !connection.accessTokenEnvelope || !template || template.status !== 'APPROVED') return { status: 'blocked' as const, reason: 'connection_blocked' as const, audit };
  const period = job.usagePeriodKey ? { key: job.usagePeriodKey, timezone: job.usageTimezone ?? entitlement.timezone } : getLocalMonthPeriod(now, entitlement.timezone);
  const context: UsageContext = { businessId: job.businessId, periodKey: period.key, timezone: period.timezone, limit: entitlement.automaticMessaging.limit, now };
  const usageJob = { jobKey: job.idempotencyKey ?? String(job._id), jobId: String(job._id) };
  const result = await reserve(context, usageJob);
  if (result.status === 'denied') return { status: 'blocked' as const, reason: 'quota_exceeded' as const, context, usage: result.usage, audit: { ...audit, ...usageAudit(result.usage) } };
  if (!reserveSlot && result.allocation.state === 'reserved') {
    const uncertain = await markUncertain(context, usageJob);
    return { status: 'blocked' as const, reason: 'delivery_unknown' as const, context, usage: uncertain.usage, audit: { ...audit, ...usageAudit(uncertain.usage) } };
  }
  if (result.allocation.state === 'accepted') return { status: 'accepted' as const, context, usage: result.usage, audit: { ...audit, ...usageAudit(result.usage) } };
  if (result.allocation.state === 'uncertain') return { status: 'blocked' as const, reason: 'delivery_unknown' as const, context, usage: result.usage, audit: { ...audit, ...usageAudit(result.usage) } };
  return { status: 'admitted' as const, context, usage: result.usage, reservationOwned: result.status === 'admitted', audit: { ...audit, ...usageAudit(result.usage), usageOutcome: 'reserved', usageReservedAt: result.allocation.reservedAt } };
}

export async function runMessageWorker(input: { claim: () => Promise<any>; process: (job: any) => Promise<any>; now?: Date; maxJobs?: number }) {
  const limit = Math.min(input.maxJobs ?? MAX_WORK_PER_RUN, MAX_WORK_PER_RUN);
  let processed = 0;
  for (; processed < limit; processed += 1) { const job = await input.claim(); if (!job) break; await input.process(job); }
  return { processed };
}

export async function runMongoMessageWorker(send: MessageSender, now = new Date()) {
  await dbConnect();
  return runMessageWorker({ now, claim: () => claimDueMessageJob(MessageJob as unknown as ClaimModel, now), process: (job) => processClaimedMessageJob({ job, jobModel: MessageJob as unknown as JobModel, appointmentModel: Appointment as unknown as { findOne: (filter: any) => Promise<any> }, send, admitAutomatic: admitAutomaticMessageJob, now }) });
}
