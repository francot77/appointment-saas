import { Business } from '@/lib/models/Business';
import { isPlanKey, type PlanKey } from '@/lib/plans/catalog';
import { normalizeBusinessTimezone, isValidIanaTimezone } from '@/lib/entitlements';

export type PlanAssignmentInput = {
  plan: unknown;
  timezone: unknown;
  operatorId: unknown;
};

export type ValidPlanAssignment = {
  plan: PlanKey;
  timezone: string;
  operatorId: string;
};

export function validatePlanAssignment(input: PlanAssignmentInput) {
  if (!isPlanKey(input.plan) || typeof input.operatorId !== 'string' || input.operatorId.trim() === '') {
    return { ok: false as const, error: 'INVALID_OPERATOR_PLAN_ASSIGNMENT' };
  }
  if (typeof input.timezone !== 'string' || !isValidIanaTimezone(input.timezone)) {
    return { ok: false as const, error: 'INVALID_BUSINESS_TIMEZONE' };
  }
  return {
    ok: true as const,
    value: { plan: input.plan, timezone: input.timezone, operatorId: input.operatorId.trim() } satisfies ValidPlanAssignment,
  };
}

/** Trusted server-side boundary. Tenant-owner routes must not call this function. */
export async function assignPlanAsOperator(
  businessId: string,
  input: PlanAssignmentInput
) {
  const validated = validatePlanAssignment(input);
  if (!validated.ok) throw new Error(validated.error);

  return Business.findByIdAndUpdate(
    businessId,
    {
      $set: {
        plan: validated.value.plan,
        timezone: normalizeBusinessTimezone(validated.value.timezone),
        planAssignedBy: validated.value.operatorId,
        planAssignedAt: new Date(),
      },
    },
    { new: true, runValidators: true }
  ).lean();
}
