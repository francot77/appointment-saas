import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';

export const MERCADO_PAGO_TIMEOUT_MS = 10_000;

export function getMercadoPagoAccessToken() {
  return process.env.NODE_ENV === 'production'
    ? process.env.MP_ACCESS_TOKEN_PROD
    : process.env.MP_ACCESS_TOKEN_TEST;
}

export function buildBasicPreferenceBody(input: {
  appUrl: string;
  attemptReference: string;
  name?: string;
  email?: string;
  priceARS: number;
}) {
  return {
    items: [{
      id: 'basic-monthly',
      title: 'Suscripción mensual turnos',
      description: 'Plan básico - 1 mes',
      unit_price: input.priceARS,
      currency_id: 'ARS',
      quantity: 1,
    }],
    external_reference: input.attemptReference,
    metadata: { product_id: 'basic-monthly', plan: 'basic' },
    back_urls: {
      success: `${input.appUrl}/billing?status=success`,
      failure: `${input.appUrl}/billing?status=failure`,
      pending: `${input.appUrl}/billing?status=pending`,
    },
    auto_return: 'approved' as const,
    notification_url: `${input.appUrl}/api/billing/mp/webhook`,
    payer: { name: input.name || 'Cliente', email: input.email || undefined },
  };
}

export function createMercadoPagoClients(accessToken: string) {
  const config = createMercadoPagoConfig(accessToken);
  return { payment: new Payment(config), preference: new Preference(config) };
}

export function createMercadoPagoConfig(accessToken: string) {
  return new MercadoPagoConfig({
    accessToken,
    options: { timeout: MERCADO_PAGO_TIMEOUT_MS, maxRetries: 1 },
  });
}

export function getMercadoPagoErrorStatus(error: unknown) {
  return typeof error === 'object' && error !== null && 'status' in error
    ? (error as { status?: unknown }).status
    : undefined;
}
