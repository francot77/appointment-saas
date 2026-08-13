import { describe, expect, it } from 'vitest';
import { getEffectiveBillingStatus, hasBusinessEntitlement } from '@/lib/billingEntitlements';
import { rangesOverlap, timeToMinutes, minutesToTime } from '@/lib/time';
import { date, email, positiveInteger, time } from '@/lib/validation';
import { validateSlug } from '@/lib/slug';
import { publicBookingRateLimit } from '@/lib/publicRateLimit';

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

describe('public booking rate limit', () => {
  it('allows five requests and rejects the sixth', () => {
    const request = new Request('http://localhost/api/public/demo/appointments');
    const scope = `test-${Date.now()}-${Math.random()}`;
    const results = Array.from({ length: 6 }, () => publicBookingRateLimit(request as never, scope));
    expect(results.slice(0, 5)).toEqual([null, null, null, null, null]);
    expect(results[5]).not.toBeNull();
  });
});
