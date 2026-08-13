import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { dbConnect, getBusinessBySlug, getCurrentBusiness, paymentFind, paymentCount } = vi.hoisted(() => ({
  dbConnect: vi.fn(),
  getBusinessBySlug: vi.fn(),
  getCurrentBusiness: vi.fn(),
  paymentFind: vi.fn(),
  paymentCount: vi.fn(),
}));

vi.mock('@/lib/db', () => ({ default: dbConnect }));
vi.mock('@/lib/getBusinessBySlug', () => ({ getBusinessBySlug }));
vi.mock('@/lib/currentBusiness', () => ({ getCurrentBusiness }));
vi.mock('@/lib/models/Service', () => ({ Service: { findOne: vi.fn() } }));
vi.mock('@/lib/models/ScheduleDay', () => ({ ScheduleDay: { findOne: vi.fn() } }));
vi.mock('@/lib/models/Appointment', () => ({ Appointment: { find: vi.fn(), create: vi.fn() } }));
vi.mock('@/lib/models/AppointmentBookingLock', () => ({ AppointmentBookingLock: { updateOne: vi.fn(), deleteOne: vi.fn() } }));
vi.mock('@/lib/models/Payments', () => ({ Payment: { find: paymentFind, countDocuments: paymentCount } }));

import { POST as publicBooking } from '@/app/api/public/[slug]/appointments/route';
import { POST as adminServices } from '@/app/api/admin/services/route';
import { GET as billingHistory } from '@/app/api/billing/history/route';

describe('high-risk route contracts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects malformed public booking input before touching tenant data', async () => {
    const response = await publicBooking(
      new Request('http://localhost/api/public/demo/appointments', {
        method: 'POST',
        body: JSON.stringify({ clientName: '', clientPhone: '123' }),
      }) as never,
      { params: Promise.resolve({ slug: 'demo' }) },
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ code: 'VALIDATION' });
    expect(getBusinessBySlug).not.toHaveBeenCalled();
    expect(dbConnect).not.toHaveBeenCalled();
  });

  it('enforces billing entitlement at an admin route boundary', async () => {
    getCurrentBusiness.mockRejectedValue(new Error('BILLING_REQUIRED'));

    const response = await adminServices(new NextRequest('http://localhost/api/admin/services', {
      method: 'POST',
      body: JSON.stringify({}),
    }));

    expect(response.status).toBe(402);
    expect(await response.json()).toEqual({ error: 'Billing required', code: 'FORBIDDEN' });
    expect(getCurrentBusiness).toHaveBeenCalledWith({ requireEntitlement: true });
  });

  it('scopes billing history queries to the authenticated business', async () => {
    const businessId = 'business-a';
    const query = {
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([]),
    };
    getCurrentBusiness.mockResolvedValue({ _id: businessId });
    dbConnect.mockResolvedValue(undefined);
    paymentFind.mockReturnValue(query);
    paymentCount.mockResolvedValue(0);

    const response = await billingHistory(new NextRequest('http://localhost/api/billing/history'));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ payments: [], total: 0, page: 1, limit: 20 });
    expect(paymentFind).toHaveBeenCalledWith({ businessId });
    expect(paymentCount).toHaveBeenCalledWith({ businessId });
  });
});
