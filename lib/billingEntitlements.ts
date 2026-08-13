import { Types } from 'mongoose';
import { Business } from '@/lib/models/Business';

export const BASIC_PRODUCT_ID = 'basic-monthly';
export const BASIC_PRICE_ARS = 10000;

type BillingBusiness = {
  _id: Types.ObjectId;
  status?: string;
  paidUntil?: Date | null;
};

export function hasBusinessEntitlement(business: BillingBusiness, now = new Date()) {
  const paidUntil = business.paidUntil ? new Date(business.paidUntil) : null;
  if (!paidUntil || paidUntil <= now) return false;
  return business.status === 'trial' || business.status === 'active';
}

export function getEffectiveBillingStatus(business: BillingBusiness, now = new Date()) {
  if (
    (business.status === 'trial' || business.status === 'active') &&
    (!business.paidUntil || new Date(business.paidUntil) <= now)
  ) {
    return 'expired';
  }
  return business.status || 'expired';
}

export async function requireBusinessEntitlement(business: BillingBusiness) {
  if (!hasBusinessEntitlement(business)) {
    const error = new Error('BILLING_REQUIRED');
    throw error;
  }
  return business;
}

export async function markExpiredBusinesses() {
  await Business.updateMany(
    {
      paidUntil: { $lte: new Date() },
      status: { $in: ['trial', 'active'] },
    },
    { $set: { status: 'expired' } }
  );
}
