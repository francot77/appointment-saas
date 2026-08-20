export type ProviderFailureCode = 'TEMPLATE_NOT_APPROVED' | 'TIMEOUT' | 'RATE_LIMITED' | 'PROVIDER_CLIENT_ERROR' | 'PROVIDER_SERVER_ERROR' | 'NETWORK_ERROR';
export type ProviderCertainty = 'accepted' | 'definite_failure' | 'ambiguous';

export type ProviderTemplate = {
  name: string;
  language: 'es_AR';
  category: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION';
  approved: boolean;
};

export type ProviderMessageIntent = {
  recipient: string;
  template: ProviderTemplate;
  parameters: string[];
};

export type ProviderSendResult = { providerMessageId: string; certainty: 'accepted' };

export interface MessagingProvider {
  send(intent: ProviderMessageIntent): Promise<ProviderSendResult>;
}
