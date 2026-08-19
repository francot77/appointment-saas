import type { MessagingProvider, ProviderMessageIntent, ProviderSendResult } from '@/lib/messaging/providers/types';

type Fetcher = (input: string | URL, init?: RequestInit) => Promise<Response>;
type MetaOptions = { accessToken: string; phoneNumberId: string; fetcher?: Fetcher; timeoutMs?: number; graphVersion?: string };

export class MetaProviderError extends Error {
  constructor(public readonly code: string, message: string, public readonly retryable: boolean, public readonly status?: number) {
    super(message);
    this.name = 'MetaProviderError';
  }
}
export class MetaProviderTimeoutError extends MetaProviderError { constructor() { super('TIMEOUT', 'Meta request timed out', true); } }
export class MetaProviderClientError extends MetaProviderError { constructor(status: number) { super('PROVIDER_CLIENT_ERROR', `Meta rejected the request (${status})`, false, status); } }
export class MetaProviderServerError extends MetaProviderError { constructor(status: number) { super('PROVIDER_SERVER_ERROR', `Meta service failed (${status})`, true, status); } }
export class MetaProviderRateLimitError extends MetaProviderError { constructor() { super('RATE_LIMITED', 'Meta rate limit reached', true, 429); } }

export function isRetryableProviderError(error: unknown): boolean {
  return error instanceof MetaProviderError && error.retryable;
}

export class MetaWhatsAppCloudProvider implements MessagingProvider {
  private readonly fetcher: Fetcher;
  private readonly timeoutMs: number;
  private readonly graphVersion: string;
  constructor(private readonly options: MetaOptions) {
    this.fetcher = options.fetcher ?? fetch;
    this.timeoutMs = options.timeoutMs ?? 10_000;
    this.graphVersion = options.graphVersion ?? 'v21.0';
  }

  async send(intent: ProviderMessageIntent): Promise<ProviderSendResult> {
    if (!intent.template.approved || intent.template.category !== 'UTILITY' || intent.template.language !== 'es_AR') {
      throw new MetaProviderError('TEMPLATE_NOT_APPROVED', 'Configured template is not an approved es_AR Utility template', false);
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    const body = {
      messaging_product: 'whatsapp',
      to: intent.recipient.replace(/\D/g, ''),
      type: 'template',
      template: {
        name: intent.template.name,
        language: { code: intent.template.language },
        components: intent.parameters.length ? [{ type: 'body', parameters: intent.parameters.map((text) => ({ type: 'text', text })) }] : undefined,
      },
    };
    try {
      const response = await this.fetcher(`https://graph.facebook.com/${this.graphVersion}/${this.options.phoneNumberId}/messages`, {
        method: 'POST', headers: { Authorization: `Bearer ${this.options.accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body), signal: controller.signal,
      });
      if (response.status === 429) throw new MetaProviderRateLimitError();
      if (response.status >= 500) throw new MetaProviderServerError(response.status);
      if (response.status >= 400) throw new MetaProviderClientError(response.status);
      const payload = await response.json() as { messages?: Array<{ id?: string }> };
      const providerMessageId = payload.messages?.[0]?.id;
      if (!providerMessageId) throw new MetaProviderError('PROVIDER_CLIENT_ERROR', 'Meta response did not include a message id', false, response.status);
      return { providerMessageId };
    } catch (error) {
      if (error instanceof MetaProviderError) throw error;
      if (error instanceof Error && error.name === 'AbortError') throw new MetaProviderTimeoutError();
      throw new MetaProviderError('NETWORK_ERROR', 'Meta request failed before a response was received', true);
    } finally { clearTimeout(timer); }
  }
}
