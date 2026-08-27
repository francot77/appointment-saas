import { describe, expect, it } from 'vitest';
import { isValidPaymentTransition, toBillingPaymentDTO, validateProviderPayment } from '@/lib/billingReconciliation';
import { Payment } from '@/lib/models/Payments';
import { buildBasicPreferenceBody, createMercadoPagoClients, createMercadoPagoConfig, getMercadoPagoErrorStatus, MERCADO_PAGO_TIMEOUT_MS } from '@/lib/mercadoPago';

const businessId = '507f1f77bcf86cd799439011';
const validPayment = {
  id: 'payment-1',
  external_reference: `${businessId}:attempt-1`,
  transaction_amount: 10000,
  currency_id: 'ARS',
  status: 'approved',
  additional_info: { items: [{ id: 'basic-monthly', unit_price: 10000, quantity: 1 }] },
};

describe('billing commercialization integrity', () => {
  it('persists the safe checkout-attempt contract without provider payload fields', () => {
    expect(Payment.schema.path('businessId')).toBeTruthy();
    expect(Payment.schema.path('attemptReference').isRequired).toBe(true);
    expect(Payment.schema.path('preferenceId')).toBeTruthy();
    expect(Payment.schema.path('productVersion').isRequired).toBe(true);
    expect(Payment.schema.path('periodMonths').isRequired).toBe(true);
    expect(Payment.schema.path('rawProviderPayload')).toBeUndefined();
  });

  it('leaves provider identifiers absent on pending attempts and allows multiple attempts', async () => {
    const first = new Payment({
      businessId,
      amount: 10000,
      attemptReference: `${businessId}:attempt-1`,
      status: 'pending',
      periodFrom: new Date(),
      periodTo: new Date(),
      productId: 'basic-monthly',
      providerStatus: 'created',
    });
    const second = new Payment({ ...first.toObject(), _id: undefined, attemptReference: `${businessId}:attempt-2` });
    await expect(first.validate()).resolves.toBeUndefined();
    await expect(second.validate()).resolves.toBeUndefined();
    expect(first.mpPaymentId).toBeUndefined();
    expect(first.preferenceId).toBeUndefined();
    expect(first.toObject()).not.toHaveProperty('mpPaymentId');
    expect(first.toObject()).not.toHaveProperty('preferenceId');
  });

  it('uniquely indexes only non-empty provider identifiers', () => {
    const indexes = Payment.schema.indexes();
    expect(indexes).toEqual(expect.arrayContaining([
      [{ mpPaymentId: 1 }, expect.objectContaining({ unique: true, partialFilterExpression: { mpPaymentId: { $type: 'string', $gt: '' } } })],
      [{ preferenceId: 1 }, expect.objectContaining({ unique: true, partialFilterExpression: { preferenceId: { $type: 'string', $gt: '' } } })],
      [{ businessId: 1, attemptReference: 1 }, expect.objectContaining({ unique: true })],
    ]));
  });

  it('keeps reconciliation/history references compatible before and after provider IDs arrive', () => {
    const pending = { _id: 'attempt', status: 'pending' as const, createdAt: new Date(), amount: 10000, currency: 'ARS', attemptReference: `${businessId}:attempt-1`, periodTo: new Date(), mpPaymentId: undefined };
    const resolved = { ...pending, mpPaymentId: 'payment-1' };
    expect(toBillingPaymentDTO(pending).providerReference).toBe(pending.attemptReference);
    expect(toBillingPaymentDTO(resolved).providerReference).toBe('payment-1');
  });

  it('accepts the server-owned product and amount only', () => {
    expect(validateProviderPayment(validPayment, businessId).attemptReference).toBe(`${businessId}:attempt-1`);
    expect(() => validateProviderPayment({ ...validPayment, transaction_amount: 999 }, businessId)).toThrow('PAYMENT_INVALID');
    expect(() => validateProviderPayment({ ...validPayment, additional_info: { items: [{ id: 'premium-monthly', unit_price: 10000, quantity: 1 }] } }, businessId)).toThrow('PAYMENT_INVALID');
    expect(() => validateProviderPayment({ ...validPayment, currency_id: 'USD' }, businessId)).toThrow('PAYMENT_INVALID');
  });

  it('keeps terminal states terminal and permits pending recovery', () => {
    expect(isValidPaymentTransition(undefined, 'pending')).toBe(true);
    expect(isValidPaymentTransition('pending', 'approved')).toBe(true);
    expect(isValidPaymentTransition('approved', 'rejected')).toBe(false);
    expect(isValidPaymentTransition('rejected', 'approved')).toBe(false);
  });

  it('rejects a provider reference belonging to another tenant', () => {
    expect(() => validateProviderPayment(validPayment, '507f1f77bcf86cd799439012')).toThrow('PAYMENT_INVALID');
  });

  it('uses the v3 clients with bounded timeout and exposes provider status safely', () => {
    const config = createMercadoPagoConfig('test-token');
    expect(config.options).toMatchObject({ timeout: MERCADO_PAGO_TIMEOUT_MS, maxRetries: 1 });
    const clients = createMercadoPagoClients('test-token');
    expect(clients.payment).toBeTruthy();
    expect(clients.preference).toBeTruthy();
    expect(getMercadoPagoErrorStatus({ status: 404 })).toBe(404);
    expect(getMercadoPagoErrorStatus(new Error('provider failure'))).toBeUndefined();
  });

  it('builds a server-owned Checkout Pro preference shape at the configured price', () => {
    const body = buildBasicPreferenceBody({ appUrl: 'https://pay.example.test', attemptReference: `${businessId}:attempt-1`, priceARS: 100 });
    expect(body.items).toEqual([{ id: 'basic-monthly', title: 'Suscripción mensual turnos', description: 'Plan básico - 1 mes', unit_price: 100, currency_id: 'ARS', quantity: 1 }]);
    expect(body.external_reference).toBe(`${businessId}:attempt-1`);
    expect(body.notification_url).toBe('https://pay.example.test/api/billing/mp/webhook');
    expect(body.back_urls.success).toBe('https://pay.example.test/billing?status=success');
    expect(body.auto_return).toBe('approved');
  });
});
