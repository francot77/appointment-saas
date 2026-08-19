import { describe, expect, it } from 'vitest';
import { Appointment } from '@/lib/models/Appointment';
import { MessageJob, MESSAGE_JOB_STATES } from '@/lib/models/MessageJob';
import {
  createMessageJobIdentity,
  getAppointmentMessagingVersion,
  isMessageJobDispatchable,
  shouldInvalidateMessageJob,
} from '@/lib/messaging/domain';

const identity = {
  businessId: 'business-a',
  appointmentId: 'appointment-1',
  version: 3,
  event: 'confirmed' as const,
  occurrence: 'confirmation',
  channel: 'whatsapp' as const,
};

describe('messaging foundation contracts', () => {
  it('exposes the complete provider-neutral job state machine', () => {
    expect(MESSAGE_JOB_STATES).toEqual([
      'scheduled',
      'leased',
      'retry_wait',
      'sent',
      'dead',
      'invalidated',
    ]);
  });

  it('creates a deterministic identity for the same tenant and occurrence', () => {
    const first = createMessageJobIdentity(identity);
    const second = createMessageJobIdentity({ ...identity });
    const otherTenant = createMessageJobIdentity({ ...identity, businessId: 'business-b' });

    expect(first).toMatch(/^[a-f0-9]{64}$/);
    expect(second).toBe(first);
    expect(otherTenant).not.toBe(first);
  });

  it('normalizes missing legacy appointment versions to zero without changing explicit versions', () => {
    expect(getAppointmentMessagingVersion({})).toBe(0);
    expect(getAppointmentMessagingVersion({ messagingVersion: 4 })).toBe(4);
    expect(getAppointmentMessagingVersion({ messagingVersion: -1 })).toBe(0);
  });

  it('invalidates only obsolete nonterminal jobs when an appointment advances', () => {
    expect(shouldInvalidateMessageJob({ state: 'scheduled', messagingVersion: 3 }, 4)).toBe(true);
    expect(shouldInvalidateMessageJob({ state: 'leased', messagingVersion: 3 }, 4)).toBe(true);
    expect(shouldInvalidateMessageJob({ state: 'sent', messagingVersion: 3 }, 4)).toBe(false);
    expect(shouldInvalidateMessageJob({ state: 'scheduled', messagingVersion: 4 }, 4)).toBe(false);
  });

  it('rejects stale-version jobs from dispatch and accepts current due states', () => {
    expect(isMessageJobDispatchable({ state: 'scheduled', messagingVersion: 3 }, 4)).toBe(false);
    expect(isMessageJobDispatchable({ state: 'retry_wait', messagingVersion: 4 }, 4)).toBe(true);
    expect(isMessageJobDispatchable({ state: 'sent', messagingVersion: 4 }, 4)).toBe(false);
  });
});

describe('message job persistence contract', () => {
  it('defines tenant-safe duplicate, due, and lease-expiry indexes', () => {
    const indexes = MessageJob.schema.indexes();
    expect(indexes).toContainEqual([
      { businessId: 1, idempotencyKey: 1 },
      { unique: true },
    ]);
    expect(indexes).toContainEqual([
      { businessId: 1, state: 1, scheduledAt: 1 },
      {},
    ]);
    expect(indexes).toContainEqual([
      { businessId: 1, state: 1, leaseExpiresAt: 1 },
      {},
    ]);
  });

  it('constrains persisted jobs to the foundation fields and states', () => {
    const job = new MessageJob({
      businessId: '507f1f77bcf86cd799439011',
      appointmentId: '507f1f77bcf86cd799439012',
      event: 'confirmed',
      occurrence: 'confirmation',
      recipient: '+5491112345678',
      content: { template: 'appointment_confirmed' },
      scheduledAt: new Date('2026-08-20T12:00:00.000Z'),
      messagingVersion: 2,
      idempotencyKey: createMessageJobIdentity({ ...identity, version: 2 }),
    });

    expect(job.state).toBe('scheduled');
    expect(job.attempts).toBe(0);
    expect(job.businessId.toString()).toBe('507f1f77bcf86cd799439011');
    expect(job.validateSync()?.errors.state).toBeUndefined();
  });
});

describe('appointment messaging compatibility', () => {
  it('defaults new appointments to version one', () => {
    const appointment = new Appointment({
      businessId: '507f1f77bcf86cd799439011',
      clientName: 'Client',
      clientPhone: '+5491112345678',
      serviceId: '507f1f77bcf86cd799439013',
      date: '2026-08-20',
      startTime: '10:00',
      endTime: '10:30',
    });

    expect(appointment.messagingVersion).toBe(1);
  });
});
