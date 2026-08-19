import { describe, expect, it } from 'vitest';

import { normalizeMessagingSettings } from '@/lib/messaging/settings-contract';

describe('messaging settings client contract', () => {
  it('normalizes a connected tenant without exposing secret material', () => {
    const view = normalizeMessagingSettings({
      id: 'connection-a',
      businessId: 'tenant-a',
      provider: 'meta_whatsapp_cloud',
      phoneNumberId: '1234567890123456',
      wabaId: '9876543210987654',
      enabled: true,
      templates: [
        { event: 'confirmed', name: 'appointment_confirmed', language: 'es_AR', status: 'APPROVED', category: 'UTILITY' },
        { event: 'reminder', name: 'appointment_reminder', language: 'es_AR', status: 'PENDING', category: 'UTILITY' },
      ],
      leadTimeMinutes: 90,
      hasAccessToken: true,
      hasAppSecret: true,
    });

    expect(view).toMatchObject({
      status: 'connected',
      enabled: true,
      phoneNumberId: '••••••••3456',
      wabaId: '••••••••7654',
      leadTimeMinutes: 90,
    });
    expect(view.templates[0]).toMatchObject({ event: 'confirmed', approved: true });
    expect(view.templates[1]).toMatchObject({ event: 'reminder', approved: false });
    expect(JSON.stringify(view)).not.toContain('secret');
  });

  it('represents a disconnected or failed tenant with safe defaults', () => {
    const view = normalizeMessagingSettings({
      id: '',
      businessId: 'tenant-b',
      provider: 'meta_whatsapp_cloud',
      phoneNumberId: '',
      wabaId: '',
      enabled: false,
      templates: [],
      leadTimeMinutes: 60,
      hasAccessToken: false,
      hasAppSecret: false,
      error: 'BILLING_REQUIRED',
    });

    expect(view).toEqual(expect.objectContaining({
      status: 'disconnected',
      enabled: false,
      phoneNumberId: 'Not connected',
      wabaId: 'Not connected',
      error: 'BILLING_REQUIRED',
      leadTimeMinutes: 60,
    }));
    expect(view.templates).toEqual([]);
  });

  it('keeps a configured but disabled tenant disconnected and applies safe lead-time defaults', () => {
    const view = normalizeMessagingSettings({
      id: 'connection-c',
      businessId: 'tenant-c',
      provider: 'meta_whatsapp_cloud',
      phoneNumberId: '12',
      wabaId: '34',
      enabled: false,
      templates: [{ event: 'rescheduled', name: 'reschedule', language: 'es_AR', status: 'REJECTED' }],
      leadTimeMinutes: Number.NaN,
      hasAccessToken: true,
      hasAppSecret: false,
    });

    expect(view.status).toBe('disconnected');
    expect(view.phoneNumberId).toBe('••••••••12');
    expect(view.leadTimeMinutes).toBe(60);
    expect(view.templates[0]).toMatchObject({ event: 'rescheduled', approved: false, status: 'REJECTED' });
  });
});
