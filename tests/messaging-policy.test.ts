import { describe, expect, it } from 'vitest';
import {
  buildMessageJobInvalidationUpdate,
  buildObsoleteMessageJobFilter,
  composeAppointmentMessageJobs,
} from '@/lib/messaging/jobs';

const appointment = {
  businessId: 'business-a',
  appointmentId: 'appointment-1',
  messagingVersion: 4,
  recipient: '+5491112345678',
  startAt: new Date('2026-08-20T15:00:00.000Z'),
};

describe('appointment messaging policy', () => {
  it('composes a current-version confirmation after confirmation', () => {
    const jobs = composeAppointmentMessageJobs({
      ...appointment,
      event: 'confirmed',
      now: new Date('2026-08-20T12:00:00.000Z'),
      reminderLeadMinutes: 60,
      remindersEnabled: false,
    });

    expect(jobs).toEqual([
      expect.objectContaining({
        businessId: 'business-a',
        appointmentId: 'appointment-1',
        event: 'confirmed',
        occurrence: 'confirmation',
        messagingVersion: 4,
        scheduledAt: new Date('2026-08-20T12:00:00.000Z'),
        recipient: '+5491112345678',
      }),
    ]);
  });

  it('uses the rescheduled event and the new version for eligible work', () => {
    const jobs = composeAppointmentMessageJobs({
      ...appointment,
      event: 'rescheduled',
      messagingVersion: 5,
      now: new Date('2026-08-20T12:00:00.000Z'),
      reminderLeadMinutes: 120,
      remindersEnabled: true,
    });

    expect(jobs.map(({ event, messagingVersion }) => ({ event, messagingVersion }))).toEqual([
      { event: 'rescheduled', messagingVersion: 5 },
      { event: 'reminder', messagingVersion: 5 },
    ]);
    expect(jobs[1].scheduledAt).toEqual(new Date('2026-08-20T13:00:00.000Z'));
  });

  it('skips a reminder for a near-term appointment when its due time is not future', () => {
    const jobs = composeAppointmentMessageJobs({
      ...appointment,
      event: 'confirmed',
      now: new Date('2026-08-20T14:30:00.000Z'),
      reminderLeadMinutes: 60,
      remindersEnabled: true,
    });

    expect(jobs.map(({ event }) => event)).toEqual(['confirmed']);
  });

  it('skips reminders due at appointment start or when reminders are disabled', () => {
    const atStart = composeAppointmentMessageJobs({
      ...appointment,
      event: 'confirmed',
      now: new Date('2026-08-20T12:00:00.000Z'),
      reminderLeadMinutes: 0,
      remindersEnabled: true,
    });
    const disabled = composeAppointmentMessageJobs({
      ...appointment,
      event: 'confirmed',
      now: new Date('2026-08-20T12:00:00.000Z'),
      reminderLeadMinutes: 60,
      remindersEnabled: false,
    });

    expect(atStart.map(({ event }) => event)).toEqual(['confirmed']);
    expect(disabled.map(({ event }) => event)).toEqual(['confirmed']);
  });
});

describe('message job lifecycle policy helpers', () => {
  it('targets only obsolete nonterminal jobs for appointment invalidation', () => {
    expect(buildObsoleteMessageJobFilter({ businessId: 'business-a', appointmentId: 'appointment-1', messagingVersion: 7 })).toEqual({
      businessId: 'business-a',
      appointmentId: 'appointment-1',
      messagingVersion: { $ne: 7 },
      state: { $in: ['scheduled', 'leased', 'retry_wait'] },
    });
  });

  it('creates an explicit invalidation update with a stable mutation time', () => {
    const invalidatedAt = new Date('2026-08-20T12:00:00.000Z');

    expect(buildMessageJobInvalidationUpdate(invalidatedAt)).toEqual({
      $set: {
        state: 'invalidated',
        invalidatedAt,
        leaseToken: null,
        leaseExpiresAt: null,
      },
    });
  });
});
