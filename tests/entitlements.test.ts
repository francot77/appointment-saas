import { describe, expect, it } from 'vitest';
import {
  DEFAULT_BUSINESS_TIMEZONE,
  getLocalMonthPeriod,
  isValidIanaTimezone,
  normalizeBusinessTimezone,
  resolveEntitlements,
} from '@/lib/entitlements';
import { PLAN_CATALOG, getPlanDefinition } from '@/lib/plans/catalog';
import { validatePlanAssignment } from '@/lib/plans/assignment';
import { presentAutomaticMessaging } from '@/lib/entitlementPresentation';

describe('plan catalog', () => {
  it('exposes stable plans with capabilities and allowance independent of pricing', () => {
    expect(Object.keys(PLAN_CATALOG)).toEqual(['basic', 'premium', 'enterprise']);
    expect(getPlanDefinition('basic')).toMatchObject({
      key: 'basic',
      displayName: 'Basic',
      capabilities: { appointments: true, manualMessaging: true, automaticMessaging: false },
    });
    expect(getPlanDefinition('premium').automaticMessagingMonthlyAllowance).toBeGreaterThan(0);
    expect(getPlanDefinition('enterprise').automaticMessagingMonthlyAllowance).toBeGreaterThan(
      getPlanDefinition('premium').automaticMessagingMonthlyAllowance
    );
    expect(getPlanDefinition('premium')).not.toHaveProperty('price');
  });
});

describe('effective entitlements', () => {
  const now = new Date('2026-03-01T00:30:00.000Z');

  it('uses safe legacy defaults and preserves the paid-period billing gate', () => {
    const result = resolveEntitlements(
      { plan: undefined, timezone: 'Not/A-Timezone', status: 'active', paidUntil: new Date('2026-03-02') },
      now
    );

    expect(result).toMatchObject({
      plan: 'basic',
      timezone: DEFAULT_BUSINESS_TIMEZONE,
      billingStatus: 'active',
      capabilities: { appointments: true, manualMessaging: true, automaticMessaging: false },
      automaticMessaging: { available: false, limit: 0, accepted: 0, uncertain: 0, remaining: 0 },
    });
  });

  it('removes payment-dependent automatic capability without changing assignment', () => {
    const result = resolveEntitlements(
      { plan: 'premium', timezone: 'America/New_York', status: 'expired', paidUntil: new Date('2026-02-01') },
      now
    );

    expect(result.plan).toBe('premium');
    expect(result.billingStatus).toBe('expired');
    expect(result.capabilities.automaticMessaging).toBe(false);
    expect(result.automaticMessaging.limit).toBe(getPlanDefinition('premium').automaticMessagingMonthlyAllowance);
    expect(result.capabilities.appointments).toBe(true);
    expect(result.capabilities.manualMessaging).toBe(true);
  });

  it('applies upgrades and downgrades immediately while leaving usage inputs untouched', () => {
    const upgraded = resolveEntitlements(
      { plan: 'enterprise', timezone: 'UTC', status: 'trial', paidUntil: new Date('2026-03-02'), acceptedUsage: 4, uncertainUsage: 1 },
      now
    );
    const downgraded = resolveEntitlements(
      { plan: 'basic', timezone: 'UTC', status: 'trial', paidUntil: new Date('2026-03-02'), acceptedUsage: 4, uncertainUsage: 1 },
      now
    );

    expect(upgraded.automaticMessaging.limit).toBe(getPlanDefinition('enterprise').automaticMessagingMonthlyAllowance);
    expect(upgraded.automaticMessaging.accepted).toBe(4);
    expect(upgraded.automaticMessaging.uncertain).toBe(1);
    expect(downgraded.automaticMessaging.available).toBe(false);
    expect(downgraded.automaticMessaging.accepted).toBe(4);
  });
});

describe('business timezone and assignment validation', () => {
  it('validates IANA zones and falls back safely', () => {
    expect(isValidIanaTimezone('America/Argentina/Buenos_Aires')).toBe(true);
    expect(isValidIanaTimezone('Not/A-Timezone')).toBe(false);
    expect(normalizeBusinessTimezone('Not/A-Timezone')).toBe(DEFAULT_BUSINESS_TIMEZONE);
  });

  it('derives calendar months from business-local time at a UTC boundary', () => {
    const period = getLocalMonthPeriod(new Date('2026-03-01T02:30:00.000Z'), 'America/Argentina/Buenos_Aires');
    expect(period.key).toBe('2026-02');
    expect(period.timezone).toBe('America/Argentina/Buenos_Aires');
    expect(period.startsAt.toISOString()).toBe('2026-02-01T03:00:00.000Z');
    expect(period.endsAt.toISOString()).toBe('2026-03-01T03:00:00.000Z');
  });

  it('accepts only known plan keys and requires an operator identity', () => {
    expect(validatePlanAssignment({ plan: 'enterprise', timezone: 'UTC', operatorId: 'operator-1' })).toEqual({
      ok: true,
      value: { plan: 'enterprise', timezone: 'UTC', operatorId: 'operator-1' },
    });
    expect(validatePlanAssignment({ plan: 'premium', timezone: 'UTC', operatorId: '' }).ok).toBe(false);
    expect(validatePlanAssignment({ plan: 'unknown', timezone: 'UTC', operatorId: 'operator-1' }).ok).toBe(false);
  });
});

describe('entitlement usage presentation', () => {
  const base = { label: 'Premium' as const, plan: 'premium' as const };

  it('distinguishes available, approaching, reached, and uncertain states', () => {
    expect(presentAutomaticMessaging({ ...base, automaticMessaging: { available: true, limit: 100, accepted: 10, uncertain: 0, remaining: 90, period: '2026-08' } }).state).toBe('accepted');
    expect(presentAutomaticMessaging({ ...base, automaticMessaging: { available: true, limit: 100, accepted: 85, uncertain: 0, remaining: 15, period: '2026-08' } }).state).toBe('approaching');
    expect(presentAutomaticMessaging({ ...base, automaticMessaging: { available: true, limit: 100, accepted: 100, uncertain: 0, remaining: 0, period: '2026-08' } }).state).toBe('reached');
    expect(presentAutomaticMessaging({ ...base, automaticMessaging: { available: true, limit: 100, accepted: 10, uncertain: 1, remaining: 89, period: '2026-08' } }).state).toBe('uncertain');
  });

  it('offers an upgrade only for unavailable Basic messaging', () => {
    expect(presentAutomaticMessaging({ plan: 'basic', label: 'Basic', automaticMessaging: { available: false, limit: 0, accepted: 0, uncertain: 0, remaining: 0, period: '2026-08' } })).toMatchObject({ state: 'unavailable', upgrade: true });
    expect(presentAutomaticMessaging({ plan: 'enterprise', label: 'Enterprise', automaticMessaging: { available: true, limit: 1000, accepted: 0, uncertain: 0, remaining: 1000, period: '2026-08' } })).toMatchObject({ state: 'custom', upgrade: false });
  });
});
