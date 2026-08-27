import { describe, expect, it } from 'vitest';
import { MessagingConnection } from '@/lib/models/MessagingConnection';
import { MessageJob } from '@/lib/models/MessageJob';
import { ProviderWebhookEvent } from '@/lib/models/ProviderWebhookEvent';
import { Appointment } from '@/lib/models/Appointment';

describe('messaging production contracts', () => {
  it('requires replica-set-compatible persistence for tenant jobs and webhook deduplication', () => {
    expect(MessageJob.schema.indexes()).toContainEqual([
      { businessId: 1, idempotencyKey: 1 },
      { unique: true },
    ]);
    expect(ProviderWebhookEvent.schema.indexes()).toContainEqual([
      { businessId: 1, provider: 1, eventId: 1 },
      { unique: true },
    ]);
    expect(Appointment.schema.path('messagingVersion')).toMatchObject({ defaultValue: 1, options: { min: 0 } });
  });

  it('keeps provider routing unique per tenant and sender identity', () => {
    expect(MessagingConnection.schema.indexes()).toContainEqual([
      { businessId: 1 },
      { unique: true },
    ]);
    expect(MessagingConnection.schema.indexes()).toContainEqual([
      { provider: 1, phoneNumberId: 1 },
      { unique: true },
    ]);
    expect((MessagingConnection.schema.path('enabled') as { defaultValue?: unknown }).defaultValue).toBe(false);
  });

  it('preserves the manual appointment contract while automation remains additive', () => {
    for (const field of ['status', 'date', 'startTime', 'endTime', 'reminderSent', 'clientToken']) {
      expect(Appointment.schema.path(field)).toBeDefined();
    }
    expect(Appointment.schema.path('messagingVersion')).toBeDefined();
  });
});
