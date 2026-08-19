import {
  buildMessageJobInvalidationUpdate,
  buildObsoleteMessageJobFilter,
  composeAppointmentMessageJobs,
} from '@/lib/messaging/jobs';

type MessageJobModel = {
  bulkWrite: (...args: never[]) => Promise<unknown>;
  updateMany: (filter: Record<string, unknown>, update: Record<string, unknown>, options?: Record<string, unknown>) => Promise<unknown>;
};

export type AppointmentMessagingIntegrationDeps = {
  messageJobModel: MessageJobModel;
  session?: unknown;
};

export type AppointmentMessagingIntegrationInput = AppointmentMessagingIntegrationDeps & {
  businessId: string;
  appointmentId: string;
  messagingVersion: number;
  recipient: string;
  startAt?: Date;
  event: 'confirmed' | 'rescheduled' | 'cancelled';
  now?: Date;
  enabled: boolean;
  remindersEnabled?: boolean;
  reminderLeadMinutes?: number;
  content?: Record<string, unknown>;
};

export type AppointmentMessagingIntegrationResult = {
  scheduled: number;
  invalidated: boolean;
  isolatedFailure: boolean;
};

const EMPTY_RESULT = { scheduled: 0, invalidated: false, isolatedFailure: false } as const;

/**
 * Persists provider-neutral work next to an appointment mutation. The caller
 * supplies the active transaction session; messaging errors are deliberately
 * isolated so they cannot change the appointment mutation outcome.
 */
export async function integrateAppointmentMessaging(
  input: AppointmentMessagingIntegrationInput,
): Promise<AppointmentMessagingIntegrationResult> {
  const { messageJobModel, session } = input;
  let invalidated = false;

  try {
    if (input.event === 'cancelled' || input.event === 'rescheduled') {
      await messageJobModel.updateMany(
        buildObsoleteMessageJobFilter(input),
        buildMessageJobInvalidationUpdate(input.now ?? new Date()),
        session ? { session } : undefined,
      );
      invalidated = true;
    }

    if (!input.enabled || input.event === 'cancelled') {
      return { scheduled: 0, invalidated, isolatedFailure: false };
    }

    if (!input.startAt) {
      return { scheduled: 0, invalidated, isolatedFailure: false };
    }

    const jobs = composeAppointmentMessageJobs({
      businessId: input.businessId,
      appointmentId: input.appointmentId,
      messagingVersion: input.messagingVersion,
      recipient: input.recipient,
      startAt: input.startAt,
      event: input.event,
      now: input.now ?? new Date(),
      remindersEnabled: input.remindersEnabled ?? false,
      reminderLeadMinutes: input.reminderLeadMinutes ?? 0,
      content: input.content,
    });

    const bulkWrite = messageJobModel.bulkWrite as unknown as (
      operations: Array<Record<string, unknown>>,
      options?: Record<string, unknown>,
    ) => Promise<unknown>;
    await bulkWrite(
      jobs.map((job) => ({
        updateOne: {
          filter: { businessId: job.businessId, idempotencyKey: job.idempotencyKey },
          update: { $setOnInsert: job },
          upsert: true,
        },
      })),
      session ? { session } : undefined,
    );

    return { scheduled: jobs.length, invalidated, isolatedFailure: false };
  } catch {
    return { ...EMPTY_RESULT, isolatedFailure: true };
  }
}
