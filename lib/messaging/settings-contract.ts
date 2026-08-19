export type MessagingSettingsTemplate = {
  event: 'confirmed' | 'rescheduled' | 'reminder';
  name: string;
  language: 'es_AR';
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  category?: 'UTILITY';
};

export type MessagingSettingsPayload = {
  id: string;
  businessId: string;
  provider: 'meta_whatsapp_cloud';
  phoneNumberId: string;
  wabaId: string;
  enabled: boolean;
  templates: MessagingSettingsTemplate[];
  leadTimeMinutes: number;
  hasAccessToken: boolean;
  hasAppSecret: boolean;
  error?: string;
};

export type MessagingSettingsView = {
  status: 'connected' | 'disconnected';
  enabled: boolean;
  phoneNumberId: string;
  wabaId: string;
  leadTimeMinutes: number;
  templates: Array<MessagingSettingsTemplate & { approved: boolean }>;
  error?: string;
};

export function maskMessagingIdentifier(value: string) {
  const normalized = String(value || '').trim();
  if (!normalized) return 'Not connected';
  return `••••••••${normalized.slice(-4)}`;
}

export function normalizeMessagingSettings(payload: MessagingSettingsPayload): MessagingSettingsView {
  return {
    status: payload.enabled && payload.hasAccessToken ? 'connected' : 'disconnected',
    enabled: Boolean(payload.enabled),
    phoneNumberId: maskMessagingIdentifier(payload.phoneNumberId),
    wabaId: maskMessagingIdentifier(payload.wabaId),
    leadTimeMinutes: Number.isFinite(payload.leadTimeMinutes) ? payload.leadTimeMinutes : 60,
    templates: (payload.templates || []).map((template) => ({
      ...template,
      approved: template.status === 'APPROVED',
    })),
    ...(payload.error ? { error: payload.error } : {}),
  };
}
