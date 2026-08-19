import { createHash } from 'node:crypto';

export const MESSAGE_JOB_STATES = ['scheduled', 'leased', 'retry_wait', 'sent', 'dead', 'invalidated'] as const;
export type MessageJobState = (typeof MESSAGE_JOB_STATES)[number];
export type MessageJobEvent = 'confirmed' | 'rescheduled' | 'reminder';
export type MessageChannel = 'whatsapp';

export type MessageJobIdentity = {
  businessId: string;
  appointmentId: string;
  version: number;
  event: MessageJobEvent;
  occurrence: string;
  channel: MessageChannel;
};

export function createMessageJobIdentity(input: MessageJobIdentity) {
  const canonical = ['v1', input.businessId, input.appointmentId, input.version, input.event, input.occurrence, input.channel].join('|');
  return createHash('sha256').update(canonical).digest('hex');
}

export function getAppointmentMessagingVersion(value: { messagingVersion?: unknown }) {
  return typeof value.messagingVersion === 'number'
    && Number.isInteger(value.messagingVersion)
    && value.messagingVersion >= 0
    ? value.messagingVersion
    : 0;
}

const NONTERMINAL_STATES: ReadonlySet<MessageJobState> = new Set(['scheduled', 'leased', 'retry_wait']);

export function shouldInvalidateMessageJob(job: { state: MessageJobState; messagingVersion: number }, appointmentVersion: number) {
  return NONTERMINAL_STATES.has(job.state) && job.messagingVersion !== appointmentVersion;
}

export function isMessageJobDispatchable(job: { state: MessageJobState; messagingVersion: number }, appointmentVersion: number) {
  return (job.state === 'scheduled' || job.state === 'retry_wait') && job.messagingVersion === appointmentVersion;
}
