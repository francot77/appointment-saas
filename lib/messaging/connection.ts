import type { SecretEnvelope } from '@/lib/messaging/crypto';
import dbConnect from '@/lib/db';
import { getMessagingKeyring, decryptSecret } from '@/lib/messaging/crypto';
import { MetaWhatsAppCloudProvider } from '@/lib/messaging/providers/meta-whatsapp';
import type { MessagingProvider } from '@/lib/messaging/providers/types';
import { MessagingConnection } from '@/lib/models/MessagingConnection';

export type MessagingTemplateConfig = {
  event: 'confirmed' | 'rescheduled' | 'reminder';
  name: string;
  language: 'es_AR';
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  category?: 'UTILITY';
};

export type MessagingConnectionSecret = {
  _id: string;
  businessId: string;
  provider: 'meta_whatsapp_cloud';
  phoneNumberId: string;
  wabaId: string;
  enabled: boolean;
  accessTokenEnvelope: SecretEnvelope;
  appSecretEnvelope?: SecretEnvelope | null;
  verificationTokenEnvelope?: SecretEnvelope | null;
  templates: MessagingTemplateConfig[];
  leadTimeMinutes: number;
};

export type AppointmentMessagingSettings = {
  enabled: boolean;
  remindersEnabled: boolean;
  reminderLeadMinutes: number;
};

type MessageJobForSending = {
  businessId: string;
  event: MessagingTemplateConfig['event'];
  recipient: string;
  content?: { parameters?: unknown[] };
};

export async function loadMessagingSettings(businessId: string): Promise<AppointmentMessagingSettings> {
  await dbConnect();
  const connection = await MessagingConnection.findOne({ businessId }).lean();
  const enabled = Boolean(connection?.enabled && connection.accessTokenEnvelope);
  return {
    enabled,
    remindersEnabled: enabled,
    reminderLeadMinutes: typeof connection?.leadTimeMinutes === 'number' ? connection.leadTimeMinutes : 60,
  };
}

export async function createConfiguredMessageSender(): Promise<(job: MessageJobForSending) => Promise<{ providerMessageId?: string }>> {
  await dbConnect();
  return async (job: MessageJobForSending) => {
    const connection = await MessagingConnection.findOne({ businessId: job.businessId }).lean() as MessagingConnectionSecret | null;
    if (!connection?.enabled || !connection.accessTokenEnvelope) {
      throw Object.assign(new Error('Messaging connection is disabled or disconnected'), { code: 'MESSAGING_NOT_CONFIGURED' });
    }

    const provider: MessagingProvider = connection.provider === 'meta_whatsapp_cloud'
      ? new MetaWhatsAppCloudProvider({
        accessToken: decryptSecret(connection.accessTokenEnvelope, getMessagingKeyring()),
        phoneNumberId: connection.phoneNumberId,
      })
      : (() => { throw new Error('Unsupported messaging provider'); })();
    const configuredTemplate = connection.templates.find((template) => template.event === job.event);
    if (!configuredTemplate) {
      throw Object.assign(new Error('Messaging template is not configured'), { code: 'MESSAGING_NOT_CONFIGURED' });
    }
    return provider.send({
      recipient: job.recipient,
      template: {
        name: configuredTemplate.name,
        language: configuredTemplate.language,
        category: configuredTemplate.category ?? 'UTILITY',
        approved: configuredTemplate.status === 'APPROVED',
      },
      parameters: Array.isArray(job.content?.parameters) ? job.content.parameters.map(String) : [],
    });
  };
}

export function redactMessagingConnection(connection: MessagingConnectionSecret) {
  return {
    id: String(connection._id),
    businessId: String(connection.businessId),
    provider: connection.provider,
    phoneNumberId: connection.phoneNumberId,
    wabaId: connection.wabaId,
    enabled: connection.enabled,
    status: connection.enabled && Boolean(connection.accessTokenEnvelope) ? 'connected' as const : 'disconnected' as const,
    templates: connection.templates,
    leadTimeMinutes: connection.leadTimeMinutes,
    hasAccessToken: Boolean(connection.accessTokenEnvelope),
    hasAppSecret: Boolean(connection.appSecretEnvelope),
  };
}
