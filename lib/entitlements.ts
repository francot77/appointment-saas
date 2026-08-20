import { getEffectiveBillingStatus, hasBusinessEntitlement } from '@/lib/billingEntitlements';
import { getPlanDefinition, type PlanKey } from '@/lib/plans/catalog';

export const DEFAULT_BUSINESS_TIMEZONE = 'America/Argentina/Buenos_Aires';

type EntitlementBusiness = {
  plan?: unknown;
  timezone?: unknown;
  status?: string;
  paidUntil?: Date | string | null;
  acceptedUsage?: number;
  uncertainUsage?: number;
};

export function isValidIanaTimezone(value: unknown): value is string {
  if (typeof value !== 'string' || value.trim() === '') return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

export function normalizeBusinessTimezone(value: unknown) {
  return isValidIanaTimezone(value) ? value : DEFAULT_BUSINESS_TIMEZONE;
}

function localParts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    calendar: 'iso8601',
    numberingSystem: 'latn',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  };
}

function offsetMilliseconds(date: Date, timezone: string) {
  const parts = localParts(date, timezone);
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return asUtc - date.getTime();
}

function zonedLocalMidnightToUtc(year: number, month: number, timezone: string) {
  const localAsUtc = Date.UTC(year, month - 1, 1);
  let result = new Date(localAsUtc);
  result = new Date(localAsUtc - offsetMilliseconds(result, timezone));
  result = new Date(localAsUtc - offsetMilliseconds(result, timezone));
  return result;
}

export type LocalMonthPeriod = {
  key: string;
  timezone: string;
  startsAt: Date;
  endsAt: Date;
};

export function getLocalMonthPeriod(date: Date, timezoneInput: unknown): LocalMonthPeriod {
  const timezone = normalizeBusinessTimezone(timezoneInput);
  const current = localParts(date, timezone);
  const startsAt = zonedLocalMidnightToUtc(current.year, current.month, timezone);
  const nextYear = current.month === 12 ? current.year + 1 : current.year;
  const nextMonth = current.month === 12 ? 1 : current.month + 1;
  const endsAt = zonedLocalMidnightToUtc(nextYear, nextMonth, timezone);
  return { key: `${current.year}-${String(current.month).padStart(2, '0')}`, timezone, startsAt, endsAt };
}

export function resolveEntitlements(business: EntitlementBusiness, now = new Date()) {
  const planDefinition = getPlanDefinition(business.plan);
  const plan = planDefinition.key as PlanKey;
  const timezone = normalizeBusinessTimezone(business.timezone);
  const billingStatus = getEffectiveBillingStatus(business as never, now);
  const paid = hasBusinessEntitlement(business as never, now);
  const automaticAvailable = planDefinition.capabilities.automaticMessaging &&
    (!planDefinition.requiresActiveBilling.automaticMessaging || paid);
  const accepted = Math.max(0, business.acceptedUsage ?? 0);
  const uncertain = Math.max(0, business.uncertainUsage ?? 0);
  const limit = planDefinition.automaticMessagingMonthlyAllowance;
  const period = getLocalMonthPeriod(now, timezone);

  return {
    plan,
    label: planDefinition.displayName,
    billingStatus,
    timezone,
    capabilities: {
      appointments: planDefinition.capabilities.appointments,
      manualMessaging: planDefinition.capabilities.manualMessaging,
      automaticMessaging: automaticAvailable,
    },
    automaticMessaging: {
      available: automaticAvailable,
      limit,
      accepted,
      uncertain,
      remaining: automaticAvailable ? Math.max(0, limit - accepted - uncertain) : 0,
      period: period.key,
      periodStartsAt: period.startsAt,
      periodEndsAt: period.endsAt,
    },
  };
}
