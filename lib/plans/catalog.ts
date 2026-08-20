export type PlanKey = 'basic' | 'premium' | 'enterprise';

export type PlanCapabilities = {
  appointments: boolean;
  manualMessaging: boolean;
  automaticMessaging: boolean;
};

export type PlanDefinition = {
  key: PlanKey;
  displayName: string;
  capabilities: PlanCapabilities;
  requiresActiveBilling: {
    automaticMessaging: boolean;
  };
  automaticMessagingMonthlyAllowance: number;
};

export const PLAN_CATALOG: Record<PlanKey, PlanDefinition> = {
  basic: {
    key: 'basic',
    displayName: 'Basic',
    capabilities: { appointments: true, manualMessaging: true, automaticMessaging: false },
    requiresActiveBilling: { automaticMessaging: true },
    automaticMessagingMonthlyAllowance: 0,
  },
  premium: {
    key: 'premium',
    displayName: 'Premium',
    capabilities: { appointments: true, manualMessaging: true, automaticMessaging: true },
    requiresActiveBilling: { automaticMessaging: true },
    automaticMessagingMonthlyAllowance: 100,
  },
  enterprise: {
    key: 'enterprise',
    displayName: 'Enterprise',
    capabilities: { appointments: true, manualMessaging: true, automaticMessaging: true },
    requiresActiveBilling: { automaticMessaging: true },
    automaticMessagingMonthlyAllowance: 1000,
  },
};

export function isPlanKey(value: unknown): value is PlanKey {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(PLAN_CATALOG, value);
}

export function getPlanDefinition(value: unknown): PlanDefinition {
  return PLAN_CATALOG[isPlanKey(value) ? value : 'basic'];
}
