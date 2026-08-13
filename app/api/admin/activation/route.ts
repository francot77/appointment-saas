import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getCurrentBusiness } from '@/lib/currentBusiness';
import { apiError } from '@/lib/apiError';
import { BusinessSettings } from '@/lib/models/BusinessSettings';
import { ScheduleDay } from '@/lib/models/ScheduleDay';
import { Service } from '@/lib/models/Service';
import { timeToMinutes } from '@/lib/time';
import { time } from '@/lib/validation';

export async function GET() {
  try {
    const business = await getCurrentBusiness({ requireEntitlement: true });
    await dbConnect();

    const [serviceCount, scheduleDays, settings] = await Promise.all([
      Service.countDocuments({ businessId: business._id, active: true }),
      ScheduleDay.find({ businessId: business._id }).select({ blocks: 1 }).lean(),
      BusinessSettings.findOne({ businessId: business._id })
        .select({ publicName: 1, heroTitle: 1, primaryColor: 1 })
        .lean(),
    ]);

    const profileConfigured = Boolean(
      settings?.publicName?.trim() &&
      settings?.heroTitle?.trim() &&
      settings?.primaryColor
    );
    const workingHoursConfigured = scheduleDays.some((day) =>
      (day.blocks || []).some((block: { start?: string; end?: string; enabled?: boolean }) =>
        block.enabled !== false &&
        time(block.start || '').ok &&
        time(block.end || '').ok &&
        timeToMinutes(block.start || '') < timeToMinutes(block.end || '')
      )
    );
    const publicLinkAvailable = typeof business.slug === 'string' && business.slug.length > 0;

    return NextResponse.json({
      checklist: {
        serviceConfigured: serviceCount > 0,
        workingHoursConfigured,
        profileConfigured,
        publicLinkAvailable,
      },
      slug: publicLinkAvailable ? business.slug : null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '';
    if (message === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    if (message === 'NO_BUSINESS') return apiError('No business', 403);
    if (message === 'BILLING_REQUIRED') return apiError('Billing required', 402, 'FORBIDDEN');
    console.error('GET /admin/activation error', err instanceof Error ? err.name : 'UnknownError');
    return apiError('Internal error', 500);
  }
}
