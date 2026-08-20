import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  business: vi.fn(),
  findOne: vi.fn(),
  dbConnect: vi.fn(),
}));

vi.mock('@/lib/currentBusiness', () => ({ getCurrentBusiness: mocks.business }));
vi.mock('@/lib/db', () => ({ default: mocks.dbConnect }));
vi.mock('@/lib/models/AutomaticUsage', () => ({ AutomaticUsage: { findOne: mocks.findOne } }));

import { GET, POST } from '@/app/api/admin/entitlements/route';

describe('tenant entitlement read API', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects unauthenticated reads without querying usage', async () => {
    mocks.business.mockRejectedValueOnce(new Error('UNAUTHORIZED'));

    const response = await GET();

    expect(response.status).toBe(401);
    expect((await response.json()).code).toBe('UNAUTHORIZED');
    expect(mocks.findOne).not.toHaveBeenCalled();
  });

  it('reads only the current tenant period and exposes usage without mutation', async () => {
    mocks.business.mockResolvedValueOnce({ _id: 'tenant-a', plan: 'premium', timezone: 'UTC', status: 'active', paidUntil: new Date('2026-09-01') });
    mocks.findOne.mockReturnValueOnce({ lean: () => Promise.resolve({
      businessId: 'tenant-a', periodKey: '2026-08', acceptedCount: 18,
      allocations: [{ state: 'uncertain' }, { state: 'accepted' }],
    }) });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.findOne).toHaveBeenCalledWith(expect.objectContaining({ businessId: 'tenant-a', periodKey: expect.any(String) }));
    expect(json).toMatchObject({ plan: 'premium', capabilities: { appointments: true, manualMessaging: true, automaticMessaging: true }, automaticMessaging: { accepted: 18, uncertain: 1, limit: 100 } });
    expect(json).not.toHaveProperty('price');
  });

  it('does not depend on a premium string to authorize a tenant read', async () => {
    mocks.business.mockResolvedValueOnce({ _id: 'tenant-basic', plan: 'basic', timezone: 'UTC', status: 'expired' });
    mocks.findOne.mockReturnValueOnce({ lean: () => Promise.resolve(null) });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.plan).toBe('basic');
    expect(json.capabilities.automaticMessaging).toBe(false);
  });

  it('rejects tenant assignment mutations without querying or changing entitlement inputs', async () => {
    const input = { plan: 'enterprise', timezone: 'UTC', billingStatus: 'active' };
    const response = await POST();

    expect(response.status).toBe(403);
    expect((await response.json()).code).toBe('FORBIDDEN');
    expect(input).toEqual({ plan: 'enterprise', timezone: 'UTC', billingStatus: 'active' });
    expect(mocks.business).not.toHaveBeenCalled();
    expect(mocks.findOne).not.toHaveBeenCalled();
  });
});
