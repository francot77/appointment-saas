import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getCurrentBusiness } from '@/lib/currentBusiness';
import { apiError } from '@/lib/apiError';
import { resolveEntitlements, getLocalMonthPeriod } from '@/lib/entitlements';
import { AutomaticUsage } from '@/lib/models/AutomaticUsage';

export async function GET() {
  try {
    const business = await getCurrentBusiness();
    await dbConnect();

    const entitlement = resolveEntitlements(business, new Date());
    const usagePeriod = getLocalMonthPeriod(new Date(), entitlement.timezone);
    const usage = await AutomaticUsage.findOne({
      businessId: business._id,
      periodKey: usagePeriod.key,
    }).lean();
    const accepted = usage?.acceptedCount ?? 0;
    const uncertain = usage?.allocations?.filter((allocation: { state?: string }) => allocation.state === 'uncertain').length ?? 0;
    const readModel = resolveEntitlements(
      { ...business, acceptedUsage: accepted, uncertainUsage: uncertain },
      new Date(),
    );

    return NextResponse.json({
      plan: readModel.plan,
      label: readModel.label,
      billingStatus: readModel.billingStatus,
      timezone: readModel.timezone,
      capabilities: readModel.capabilities,
      automaticMessaging: {
        ...readModel.automaticMessaging,
        periodBounds: {
          startsAt: readModel.automaticMessaging.periodStartsAt,
          endsAt: readModel.automaticMessaging.periodEndsAt,
        },
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401, 'UNAUTHORIZED');
    if (error instanceof Error && error.message === 'NO_BUSINESS') return apiError('No business', 403, 'FORBIDDEN');
    console.error('GET /admin/entitlements error', error);
    return apiError('Internal error', 500, 'INTERNAL');
  }
}

// Tenant entitlement routes are read-only; assignment belongs to a trusted operator boundary.
export async function POST() {
  return apiError('Plan assignment is not available to tenant owners', 403, 'FORBIDDEN');
}
