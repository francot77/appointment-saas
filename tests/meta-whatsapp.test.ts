import { describe, expect, it, vi } from 'vitest';
import {
  MetaWhatsAppCloudProvider,
  MetaProviderClientError,
  MetaProviderServerError,
  MetaProviderTimeoutError,
} from '@/lib/messaging/providers/meta-whatsapp';

const connection = {
  provider: 'meta_whatsapp_cloud' as const,
  phoneNumberId: '123456',
  accessToken: 'EAAB-token',
};

describe('Meta WhatsApp Cloud provider', () => {
  it('sends an approved Utility template with dynamic appointment parameters', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ messages: [{ id: 'wamid.1' }] }), { status: 200 }));
    const provider = new MetaWhatsAppCloudProvider({ accessToken: connection.accessToken, phoneNumberId: connection.phoneNumberId, fetcher });

    const result = await provider.send({
      recipient: '+5491100000000',
      template: { name: 'appointment_confirmed', language: 'es_AR', category: 'UTILITY', approved: true },
      parameters: ['Ana', '20/08/2026', '10:30', 'https://feztime.com/manage/abc'],
    });

    expect(result.providerMessageId).toBe('wamid.1');
    expect(fetcher).toHaveBeenCalledWith(
      'https://graph.facebook.com/v21.0/123456/messages',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer EAAB-token' }),
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: '5491100000000',
          type: 'template',
          template: {
            name: 'appointment_confirmed',
            language: { code: 'es_AR' },
            components: [{ type: 'body', parameters: [
              { type: 'text', text: 'Ana' },
              { type: 'text', text: '20/08/2026' },
              { type: 'text', text: '10:30' },
              { type: 'text', text: 'https://feztime.com/manage/abc' },
            ] }],
          },
        }),
      }),
    );
  });

  it('classifies timeout, 4xx, and 5xx responses without exposing the token', async () => {
    const cases = [
      [vi.fn().mockRejectedValue(Object.assign(new Error('abort'), { name: 'AbortError' })), MetaProviderTimeoutError],
      [vi.fn().mockResolvedValue(new Response('bad request', { status: 400 })), MetaProviderClientError],
      [vi.fn().mockResolvedValue(new Response('server failure', { status: 503 })), MetaProviderServerError],
    ] as const;

    for (const [fetcher, ErrorClass] of cases) {
      const provider = new MetaWhatsAppCloudProvider({ accessToken: connection.accessToken, phoneNumberId: connection.phoneNumberId, fetcher });
      await expect(provider.send({
        recipient: '+5491100000000',
        template: { name: 'appointment_confirmed', language: 'es_AR', category: 'UTILITY', approved: true },
        parameters: ['Ana'],
      })).rejects.toBeInstanceOf(ErrorClass);
      await expect(provider.send({
        recipient: '+5491100000000',
        template: { name: 'appointment_confirmed', language: 'es_AR', category: 'UTILITY', approved: true },
        parameters: ['Ana'],
      })).rejects.not.toThrow('EAAB-token');
    }
  });

  it('does not call Meta for unapproved or non-Utility templates', async () => {
    const fetcher = vi.fn();
    const provider = new MetaWhatsAppCloudProvider({ accessToken: connection.accessToken, phoneNumberId: connection.phoneNumberId, fetcher });

    await expect(provider.send({
      recipient: '+5491100000000',
      template: { name: 'marketing', language: 'es_AR', category: 'MARKETING', approved: false },
      parameters: [],
    })).rejects.toMatchObject({ code: 'TEMPLATE_NOT_APPROVED', retryable: false });
    expect(fetcher).not.toHaveBeenCalled();
  });
});
