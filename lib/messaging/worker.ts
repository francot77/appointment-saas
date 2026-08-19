/* eslint-disable @typescript-eslint/no-explicit-any */
import { randomUUID, timingSafeEqual } from 'node:crypto';
import { MessageJob } from '@/lib/models/MessageJob';
import { Appointment } from '@/lib/models/Appointment';
import dbConnect from '@/lib/db';

export const MAX_WORK_PER_RUN = 20;
export const MAX_ATTEMPTS = 5;
export const LEASE_MS = 60_000;
export const RETRY_DELAYS_MS = [60_000, 300_000, 1_800_000, 7_200_000, 43_200_000] as const;

type ClaimModel = {
  findOneAndUpdate: (filter: any, update: any, options?: any) => Promise<any>;
};

type JobModel = {
  findOne: (filter: any) => Promise<any>;
  updateOne: (filter: any, update: any) => Promise<any>;
};

export type MessageSender = (job: any) => Promise<{ providerMessageId?: string } | void>;

export function timingSafeSecretEquals(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  const sameLength = actualBuffer.length === expectedBuffer.length;
  const compared = timingSafeEqual(
    actualBuffer,
    sameLength ? expectedBuffer : Buffer.alloc(actualBuffer.length),
  );
  return sameLength && compared;
}

export function isRetryableWorkerError(error: any) {
  if (error?.ambiguous || error?.code === 'ETIMEDOUT' || error?.code === 'DELIVERY_UNKNOWN') return false;
  return error?.retryable === true
    || error?.code === 'NETWORK_ERROR'
    || error?.status === 429
    || error?.status >= 500
    || ['ECONNRESET', 'ECONNREFUSED', 'ENETUNREACH'].includes(error?.code);
}

export async function claimDueMessageJob(
  jobModel: ClaimModel,
  now = new Date(),
  leaseMs = LEASE_MS,
  tokenFactory: () => string = randomUUID,
) {
  const leaseToken = tokenFactory();
  return jobModel.findOneAndUpdate(
    {
      $or: [
        { state: { $in: ['scheduled', 'retry_wait'] }, scheduledAt: { $lte: now } },
        { state: 'leased', leaseExpiresAt: { $lte: now } },
      ],
    },
    { $set: { state: 'leased', leaseToken, leaseExpiresAt: new Date(now.getTime() + leaseMs) } },
    { sort: { scheduledAt: 1 }, new: true },
  );
}

function failureUpdate(job: any, now: Date, error: any) {
  const attempts = (job.attempts ?? 0) + 1;
  if (error?.ambiguous || error?.code === 'ETIMEDOUT' || error?.code === 'DELIVERY_UNKNOWN') {
    return { state: 'dead', failureCode: 'delivery_unknown', attempts };
  }
  if (!isRetryableWorkerError(error) || attempts >= MAX_ATTEMPTS) {
    return { state: 'dead', failureCode: isRetryableWorkerError(error) ? 'retry_exhausted' : 'provider_rejected', attempts };
  }
  return {
    state: 'retry_wait',
    attempts,
    scheduledAt: new Date(now.getTime() + RETRY_DELAYS_MS[attempts - 1]),
  };
}

export async function processClaimedMessageJob(input: {
  job: any;
  jobModel: JobModel;
  appointmentModel: { findOne: (filter: any) => Promise<any> };
  send: MessageSender;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  if (['sent', 'dead', 'invalidated'].includes(input.job.state)) return { ...input.job, replay: true };

  const job = await input.jobModel.findOne({ _id: input.job._id, state: 'leased', leaseToken: input.job.leaseToken });
  if (!job) return { ...input.job, state: 'invalidated', replay: true };
  if (['sent', 'dead', 'invalidated'].includes(job.state)) return { ...job, replay: true };

  if (job.dispatchStartedAt) {
    const update = { state: 'dead', failureCode: 'delivery_unknown', attempts: (job.attempts ?? 0) + 1 };
    await input.jobModel.updateOne(
      { _id: job._id, state: 'leased', leaseToken: job.leaseToken },
      { $set: { ...update, leaseToken: null, leaseExpiresAt: null } },
    );
    return { ...job, ...update };
  }

  const appointment = await input.appointmentModel.findOne({
    _id: job.appointmentId,
    businessId: job.businessId,
  });
  if (!appointment || appointment.messagingVersion !== job.messagingVersion || ['cancelled', 'canceled'].includes(appointment.status)) {
    await input.jobModel.updateOne(
      { _id: job._id, state: 'leased', leaseToken: job.leaseToken },
      { $set: { state: 'invalidated', invalidatedAt: now, leaseToken: null, leaseExpiresAt: null } },
    );
    return { ...job, state: 'invalidated' };
  }

  const started = await input.jobModel.updateOne(
    { _id: job._id, state: 'leased', leaseToken: job.leaseToken, dispatchStartedAt: null },
    { $set: { dispatchStartedAt: now } },
  );
  if (started?.modifiedCount === 0 || started?.matchedCount === 0) return { ...job, state: 'invalidated' };

  const currentJob = await input.jobModel.findOne({ _id: job._id, state: 'leased', leaseToken: job.leaseToken });
  const currentAppointment = currentJob && await input.appointmentModel.findOne({
    _id: currentJob.appointmentId,
    businessId: currentJob.businessId,
  });
  if (!currentJob || !currentAppointment || currentAppointment.messagingVersion !== currentJob.messagingVersion
    || ['cancelled', 'canceled'].includes(currentAppointment.status)) {
    await input.jobModel.updateOne(
      { _id: job._id, state: 'leased', leaseToken: job.leaseToken },
      { $set: { state: 'invalidated', invalidatedAt: now, leaseToken: null, leaseExpiresAt: null } },
    );
    return { ...job, state: 'invalidated' };
  }

  try {
    const response = await input.send(currentJob);
    const update = { state: 'sent', sentAt: now, leaseToken: null, leaseExpiresAt: null, providerMessageId: response?.providerMessageId ?? null };
    await input.jobModel.updateOne({ _id: currentJob._id, state: 'leased', leaseToken: currentJob.leaseToken }, { $set: update, $inc: { attempts: 1 } });
    return { ...currentJob, ...update, attempts: (currentJob.attempts ?? 0) + 1 };
  } catch (error) {
    const update = failureUpdate(currentJob, now, error);
    await input.jobModel.updateOne({ _id: currentJob._id, state: 'leased', leaseToken: currentJob.leaseToken }, { $set: { ...update, dispatchStartedAt: null, leaseToken: null, leaseExpiresAt: null } });
    return { ...currentJob, ...update };
  }
}

export async function runMessageWorker(input: {
  claim: () => Promise<any>;
  process: (job: any) => Promise<any>;
  now?: Date;
  maxJobs?: number;
}) {
  const limit = Math.min(input.maxJobs ?? MAX_WORK_PER_RUN, MAX_WORK_PER_RUN);
  let processed = 0;
  for (; processed < limit; processed += 1) {
    const job = await input.claim();
    if (!job) break;
    await input.process(job);
  }
  return { processed };
}

export async function runMongoMessageWorker(send: MessageSender, now = new Date()) {
  await dbConnect();
  return runMessageWorker({
    now,
    claim: () => claimDueMessageJob(MessageJob as unknown as ClaimModel, now),
    process: (job) => processClaimedMessageJob({
      job,
      jobModel: MessageJob as unknown as JobModel,
      appointmentModel: Appointment as unknown as { findOne: (filter: any) => Promise<any> },
      send,
      now,
    }),
  });
}
