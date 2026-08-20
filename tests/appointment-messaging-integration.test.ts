import { describe, expect, it, vi } from 'vitest';
import {
  integrateAppointmentMessaging,
  type AppointmentMessagingIntegrationDeps,
} from '@/lib/messaging/appointmentLifecycle';

const { findOne, dbConnect } = vi.hoisted(() => ({
  findOne: vi.fn(),
  dbConnect: vi.fn(async () => undefined),
}));

vi.mock('@/lib/models/MessagingConnection', () => ({ MessagingConnection: { findOne } }));
vi.mock('@/lib/db', () => ({ default: dbConnect }));

import { loadMessagingSettings } from '@/lib/messaging/connection';

function deps() {
  const updates: Array<{ filter: Record<string, unknown>; update: Record<string, unknown> }> = [];
  const inserts: unknown[] = [];
  const dependencies: AppointmentMessagingIntegrationDeps = {
    messageJobModel: {
      bulkWrite: async (...args) => { inserts.push(...(args[0] as unknown[])); },
      updateMany: async (filter, update) => { updates.push({ filter, update }); },
    },
  };
  return { dependencies, updates, inserts };
}

const appointment = {
  businessId: 'business-1',
  appointmentId: 'appointment-1',
  messagingVersion: 4,
  recipient: '+5491112345678',
  startAt: new Date('2026-08-20T15:00:00.000Z'),
};

describe('appointment lifecycle messaging integration', () => {
  it('keeps automation disabled with the default lead time when no connection exists', async () => {
    findOne.mockReturnValueOnce({ lean: async () => null });

    await expect(loadMessagingSettings('business-without-connection')).resolves.toEqual({
      enabled: false,
      remindersEnabled: false,
      reminderLeadMinutes: 60,
    });
  });

  it('uses persisted tenant settings for lifecycle scheduling', async () => {
    findOne.mockReturnValueOnce({ lean: async () => ({ enabled: true, leadTimeMinutes: 135, accessTokenEnvelope: {} }) });
    const settings = await loadMessagingSettings('business-1');
    const { dependencies, inserts } = deps();

    await integrateAppointmentMessaging({
      ...appointment,
      event: 'confirmed',
      now: new Date('2026-08-20T12:00:00.000Z'),
      ...settings,
      ...dependencies,
    });

    expect(settings).toEqual({ enabled: true, remindersEnabled: true, reminderLeadMinutes: 135 });
    expect(inserts).toHaveLength(2);
    const reminder = inserts.find((operation) => JSON.stringify(operation).includes('"reminder"')) as {
      updateOne: { update: { $setOnInsert: { scheduledAt: Date } } };
    };
    expect(reminder.updateOne.update.$setOnInsert.scheduledAt).toEqual(new Date('2026-08-20T12:45:00.000Z'));
  });

  it('creates confirmation and future reminder work for a confirmed appointment', async () => {
    const { dependencies, inserts } = deps();

    await integrateAppointmentMessaging({
      ...appointment,
      event: 'confirmed',
      now: new Date('2026-08-20T12:00:00.000Z'),
      remindersEnabled: true,
      reminderLeadMinutes: 60,
      enabled: true,
      ...dependencies,
    });

    expect(inserts).toHaveLength(2);
    expect(inserts).toEqual(expect.arrayContaining([
      expect.objectContaining({
        updateOne: expect.objectContaining({
          update: expect.objectContaining({ $setOnInsert: expect.objectContaining({ event: 'confirmed' }) }),
        }),
      }),
      expect.objectContaining({
        updateOne: expect.objectContaining({
          update: expect.objectContaining({ $setOnInsert: expect.objectContaining({ event: 'reminder' }) }),
        }),
      }),
    ]));
  });

  it('invalidates nonterminal work on cancellation without throwing automation failures', async () => {
    const { dependencies, updates } = deps();
    dependencies.messageJobModel.updateMany = async () => { throw new Error('messaging unavailable'); };

    const result = await integrateAppointmentMessaging({
      ...appointment,
      event: 'cancelled',
      enabled: true,
      ...dependencies,
    });

    expect(result).toEqual({ scheduled: 0, invalidated: false, isolatedFailure: true });
    expect(updates).toHaveLength(0);
  });

  it('does not create work when automation is disabled, preserving the appointment mutation', async () => {
    const { dependencies, inserts, updates } = deps();

    const result = await integrateAppointmentMessaging({
      ...appointment,
      event: 'rescheduled',
      enabled: false,
      ...dependencies,
    });

    expect(result).toEqual({ scheduled: 0, invalidated: true, isolatedFailure: false });
    expect(inserts).toHaveLength(0);
    expect(updates).toHaveLength(1);
  });

  it('keeps appointment scheduling available when automatic usage is exhausted', async () => {
    const { dependencies, inserts } = deps();

    const result = await integrateAppointmentMessaging({
      ...appointment,
      event: 'confirmed',
      enabled: true,
      remindersEnabled: false,
      ...dependencies,
    });

    expect(result.scheduled).toBe(1);
    expect(inserts).toHaveLength(1);
    // Quota is checked by the worker immediately before provider dispatch, not here.
  });

  it('invalidates obsolete versions before scheduling only current-version reschedule work', async () => {
    const { dependencies, inserts, updates } = deps();

    await integrateAppointmentMessaging({
      ...appointment,
      event: 'rescheduled',
      messagingVersion: 5,
      now: new Date('2026-08-20T12:00:00.000Z'),
      remindersEnabled: true,
      reminderLeadMinutes: 120,
      enabled: true,
      ...dependencies,
    });

    expect(updates[0].filter).toMatchObject({
      businessId: 'business-1',
      appointmentId: 'appointment-1',
      messagingVersion: { $ne: 5 },
    });
    expect(inserts.every((operation) => {
      const updateOne = (operation as { updateOne: { update: { $setOnInsert: { messagingVersion?: number } } } }).updateOne;
      return updateOne.update.$setOnInsert.messagingVersion === 5;
    })).toBe(true);
  });
});
