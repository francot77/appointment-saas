import { afterEach, describe, expect, it, vi } from 'vitest';
import { getEffectiveBillingStatus, hasBusinessEntitlement } from '@/lib/billingEntitlements';
import { getAcceptedBasicPricesARS, getBasicPriceARS, getPublicAppUrl, parseBasicPriceARS } from '@/lib/billingConfig';
import { validateProviderPayment } from '@/lib/billingReconciliation';
import { rangesOverlap, timeToMinutes, minutesToTime } from '@/lib/time';
import { date, email, positiveInteger, time } from '@/lib/validation';
import { validateSlug } from '@/lib/slug';
import { publicBookingRateLimit } from '@/lib/publicRateLimit';
import { getSeoBaseUrl } from '@/lib/seo';
import { createClientToken, clientTokenExpiry, toPublicAppointmentDto } from '@/lib/clientAppointment';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('validation helpers', () => {
  it('normalizes valid email and rejects invalid dates and times', () => {
    expect(email(' Owner@Example.com ')).toEqual({ ok: true, value: 'owner@example.com' });
    expect(date('2026-02-29').ok).toBe(false);
    expect(time('24:00').ok).toBe(false);
  });

  it('rejects booleans and non-positive integers', () => {
    expect(positiveInteger(true, 'duration').ok).toBe(false);
    expect(positiveInteger(0, 'duration').ok).toBe(false);
    expect(positiveInteger('30', 'duration')).toEqual({ ok: true, value: 30 });
  });

  it('normalizes and protects reserved slugs', () => {
    expect(validateSlug('  Mi Negocio ')).toMatchObject({ ok: true, slug: 'mi-negocio' });
    expect(validateSlug('dashboard')).toMatchObject({ ok: false, code: 'RESERVED' });
  });
});

describe('time and overlap helpers', () => {
  it('round-trips minutes and treats touching ranges as available', () => {
    expect(timeToMinutes('09:30')).toBe(570);
    expect(minutesToTime(570)).toBe('09:30');
    expect(rangesOverlap(540, 600, 600, 660)).toBe(false);
    expect(rangesOverlap(540, 600, 570, 630)).toBe(true);
  });
});

describe('billing entitlement helpers', () => {
  const now = new Date('2026-01-01T00:00:00.000Z');
  const business = { _id: '507f1f77bcf86cd799439011' as never, status: 'active' };

  it('requires a future paid period and reports expired effective status', () => {
    expect(hasBusinessEntitlement({ ...business, paidUntil: new Date('2026-01-02') }, now)).toBe(true);
    expect(hasBusinessEntitlement({ ...business, paidUntil: new Date('2025-12-31') }, now)).toBe(false);
    expect(getEffectiveBillingStatus({ ...business, paidUntil: new Date('2025-12-31') }, now)).toBe('expired');
  });
});

describe('billing payment configuration', () => {
  it('parses positive integer ARS prices and keeps a safe non-production default', () => {
    expect(parseBasicPriceARS('100')).toBe(100);
    expect(parseBasicPriceARS('100.50')).toBeNull();
    expect(parseBasicPriceARS('-1')).toBeNull();
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('MP_BASIC_PRICE_ARS', '');
    expect(getBasicPriceARS()).toBe(10000);
  });

  it('fails closed in production when price or public URL configuration is unsafe', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('MP_BASIC_PRICE_ARS', 'invalid');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');
    expect(() => getBasicPriceARS()).toThrow('BILLING_PRICE_NOT_CONFIGURED');
    vi.stubEnv('MP_BASIC_PRICE_ARS', '100');
    expect(() => getPublicAppUrl()).toThrow('PUBLIC_APP_URL_INVALID');
  });

  it('accepts the current price and explicitly listed transition prices only', () => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('MP_BASIC_PRICE_ARS', '10000');
    vi.stubEnv('MP_ACCEPTED_PRICES_ARS', '100,10000,100');
    expect(getAcceptedBasicPricesARS()).toEqual([10000, 100]);

    const payment = (amount: number) => ({
      id: 'payment-1',
      external_reference: '507f1f77bcf86cd799439011',
      transaction_amount: amount,
      currency_id: 'ARS',
      status: 'approved',
      additional_info: { items: [{ id: 'basic-monthly', unit_price: amount, quantity: 1 }] },
    });
    const localAttempt = (amount: number) => ({
      businessId: '507f1f77bcf86cd799439011',
      amount,
      currency: 'ARS',
      attemptReference: '507f1f77bcf86cd799439011',
      productId: 'basic-monthly',
    });
    expect(() => validateProviderPayment(payment(100), undefined, localAttempt(100))).not.toThrow();
    expect(() => validateProviderPayment(payment(10000), undefined, localAttempt(10000))).not.toThrow();

    vi.stubEnv('MP_ACCEPTED_PRICES_ARS', '10000');
    expect(() => validateProviderPayment(payment(100), undefined, localAttempt(100))).toThrow('PAYMENT_INVALID');
  });

  it('rejects malformed accepted-price configuration in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('MP_BASIC_PRICE_ARS', '10000');
    vi.stubEnv('MP_ACCEPTED_PRICES_ARS', '100,not-a-price');
    expect(() => getAcceptedBasicPricesARS()).toThrow('BILLING_ACCEPTED_PRICES_INVALID');
  });

  it('uses the configured public URL outside production', () => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('APP_URL', 'https://payments.example.test/');
    expect(getPublicAppUrl()).toBe('https://payments.example.test');
  });

  it('uses the safe local SEO URL outside production when no URL is configured', () => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '');
    vi.stubEnv('APP_URL', '');
    expect(getSeoBaseUrl()).toBe('http://localhost:3000');
  });

  it('fails closed for SEO URLs in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '');
    vi.stubEnv('APP_URL', '');
    expect(() => getSeoBaseUrl()).toThrow('PUBLIC_APP_URL_NOT_CONFIGURED');
  });
});

describe('public booking rate limit', () => {
  it('allows five requests and rejects the sixth', () => {
    const request = new Request('http://localhost/api/public/demo/appointments');
    const scope = `test-${Date.now()}-${Math.random()}`;
    const results = Array.from({ length: 6 }, () => publicBookingRateLimit(request as never, scope));
    expect(results.slice(0, 5)).toEqual([null, null, null, null, null]);
    expect(results[5]).not.toBeNull();
  });
});

describe('public appointment access', () => {
  it('creates a random bearer token with a bounded expiry', () => {
    const token = createClientToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(clientTokenExpiry(new Date('2026-01-01T00:00:00.000Z')).toISOString()).toBe('2026-01-31T00:00:00.000Z');
  });

  it('returns the minimal public appointment DTO without PII', () => {
    const dto = toPublicAppointmentDto({
      appointment: {
        _id: 'appointment-id', date: '2026-01-02', startTime: '10:00', endTime: '11:00', status: 'request',
        clientToken: 'token', clientTokenExpiresAt: new Date('2026-01-31T00:00:00.000Z'),
      },
      businessSlug: 'demo',
      service: { name: 'Corte', durationMinutes: 60 },
    });
    expect(dto.appointment).toMatchObject({ id: 'appointment-id', businessSlug: 'demo', managementUrl: '/r/token' });
    expect(dto.appointment).not.toHaveProperty('clientName');
    expect(dto.appointment).not.toHaveProperty('clientPhone');
    expect(dto.appointment).not.toHaveProperty('notes');
  });
});
