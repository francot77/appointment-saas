import {
  createMessageJobIdentity,
  type MessageJobEvent,
} from '@/lib/messaging/domain';

const NONTERMINAL_JOB_STATES = ['scheduled', 'leased', 'retry_wait'] as const;

export type AppointmentMessagingPolicyInput = {
  businessId: string;
  appointmentId: string;
  messagingVersion: number;
  recipient: string;
  startAt: Date;
  event: Extract<MessageJobEvent, 'confirmed' | 'rescheduled'>;
  now: Date;
  remindersEnabled: boolean;
  reminderLeadMinutes: number;
  content?: Record<string, unknown>;
};

export type MessageJobIntent = {
  businessId: string;
  appointmentId: string;
  event: MessageJobEvent;
  occurrence: string;
  recipient: string;
  content: Record<string, unknown>;
  scheduledAt: Date;
  messagingVersion: number;
  idempotencyKey: string;
  state: 'scheduled';
  attempts: 0;
};

export type ObsoleteMessageJobFilter = {
  businessId: string;
  appointmentId: string;
  messagingVersion: { $ne: number };
  state: { $in: readonly ['scheduled', 'leased', 'retry_wait'] };
};

function createIntent(
  input: AppointmentMessagingPolicyInput,
  event: MessageJobEvent,
  occurrence: string,
  scheduledAt: Date,
): MessageJobIntent {
  const identity = {
    businessId: input.businessId,
    appointmentId: input.appointmentId,
    version: input.messagingVersion,
    event,
    occurrence,
    channel: 'whatsapp' as const,
  };

  return {
    businessId: input.businessId,
    appointmentId: input.appointmentId,
    event,
    occurrence,
    recipient: input.recipient,
    content: input.content ?? { event },
    scheduledAt: new Date(scheduledAt),
    messagingVersion: input.messagingVersion,
    idempotencyKey: createMessageJobIdentity(identity),
    state: 'scheduled',
    attempts: 0,
  };
}

export function composeAppointmentMessageJobs(input: AppointmentMessagingPolicyInput): MessageJobIntent[] {
  const jobs = [createIntent(input, input.event, input.event === 'confirmed' ? 'confirmation' : 'reschedule', input.now)];
  const reminderAt = new Date(input.startAt);
  reminderAt.setTime(reminderAt.getTime() - Math.max(0, input.reminderLeadMinutes) * 60_000);

  if (input.remindersEnabled && reminderAt > input.now && reminderAt < input.startAt) {
    jobs.push(createIntent(input, 'reminder', 'reminder', reminderAt));
  }

  return jobs;
}

export function buildObsoleteMessageJobFilter(input: {
  businessId: string;
  appointmentId: string;
  messagingVersion: number;
}): ObsoleteMessageJobFilter {
  return {
    businessId: input.businessId,
    appointmentId: input.appointmentId,
    messagingVersion: { $ne: input.messagingVersion },
    state: { $in: NONTERMINAL_JOB_STATES },
  };
}

export function buildMessageJobInvalidationUpdate(invalidatedAt: Date) {
  return {
    $set: {
      state: 'invalidated' as const,
      invalidatedAt: new Date(invalidatedAt),
      leaseToken: null,
      leaseExpiresAt: null,
    },
  };
}
