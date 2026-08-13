import { Types } from 'mongoose';
import { Business } from '@/lib/models/Business';
import { Payment } from '@/lib/models/Payments';
import { BASIC_PRICE_ARS, BASIC_PRODUCT_ID } from '@/lib/billingEntitlements';

export type ProviderPayment = {
  id?: string | number;
  external_reference?: string;
  transaction_amount?: number;
  currency_id?: string;
  status?: string;
  status_detail?: string;
  additional_info?: {
    items?: Array<{ id?: string; unit_price?: number; quantity?: number }>;
  };
};

export type BillingPaymentDTO = {
  id: string;
  status: 'approved' | 'pending' | 'rejected';
  createdAt: string;
  amount: number;
  currency: string;
  providerReference: string;
  paidThrough: string;
};

export function isSupportedProviderStatus(status: string | undefined) {
  return status === 'approved' || status === 'pending' || status === 'rejected' || status === 'cancelled';
}

function normalizeStatus(status: string) {
  return status === 'approved' ? 'approved' as const : status === 'rejected' || status === 'cancelled' ? 'rejected' as const : 'pending' as const;
}

export function validateProviderPayment(payment: ProviderPayment, expectedBusinessId?: string) {
  const businessId = payment.external_reference;
  const item = payment.additional_info?.items?.find((candidate) => candidate.id === BASIC_PRODUCT_ID);
  if (!isSupportedProviderStatus(payment.status) || !businessId || !Types.ObjectId.isValid(businessId) ||
      (expectedBusinessId && businessId !== expectedBusinessId) || payment.currency_id !== 'ARS' ||
      payment.transaction_amount !== BASIC_PRICE_ARS || !item || item.unit_price !== BASIC_PRICE_ARS || item.quantity !== 1) {
    throw new Error('PAYMENT_INVALID');
  }
  return { businessId, nextStatus: normalizeStatus(payment.status as string) };
}

export async function reconcileProviderPayment(payment: ProviderPayment, expectedBusinessId?: string) {
  const { businessId, nextStatus } = validateProviderPayment(payment, expectedBusinessId);
  const paymentId = String(payment.id || '');
  if (!paymentId) throw new Error('PAYMENT_INVALID');

  const connection = await Payment.db;
  const session = await connection.startSession();
  const now = new Date();
  try {
    const applyPayment = () => session.withTransaction(async () => {
      const existing = await Payment.findOne({ mpPaymentId: paymentId }).session(session).lean();
      const business = await Business.findById(businessId).select({ _id: 1, paidUntil: 1, status: 1 }).session(session).lean();
      if (!business) throw new Error('NO_BUSINESS');

      if (existing?.status === 'approved') {
        await Business.updateOne({ _id: business._id }, { $max: { paidUntil: existing.periodTo }, $set: { status: 'active' } }, { session });
        return;
      }
      if (existing?.status === 'rejected') return;

      const currentPaidUntil = business.paidUntil && business.paidUntil > now ? business.paidUntil : now;
      const periodTo = new Date(currentPaidUntil.getTime() + 30 * 24 * 60 * 60 * 1000);
      const fields = {
        amount: payment.transaction_amount,
        currency: payment.currency_id,
        method: 'mp',
        mpPaymentId: paymentId,
        productId: BASIC_PRODUCT_ID,
        providerStatus: payment.status || 'unknown',
        status: nextStatus,
        statusDetail: payment.status_detail || null,
        periodFrom: now,
        periodTo,
      };
      if (!existing) await Payment.create([{ businessId: business._id, ...fields }], { session });
      else await Payment.updateOne({ _id: existing._id, status: 'pending' }, { $set: { ...fields, periodFrom: existing.periodFrom } }, { session });

      if (nextStatus === 'approved') {
        await Business.updateOne({ _id: business._id }, { $set: { paidUntil: periodTo, status: 'active' } }, { session });
      } else if (nextStatus === 'rejected' && (!business.paidUntil || business.paidUntil <= now)) {
        await Business.updateOne({ _id: business._id, status: { $ne: 'cancelled' } }, { $set: { status: 'past_due' } }, { session });
      }
    });
    try {
      await applyPayment();
    } catch (error) {
      if (!(typeof error === 'object' && error !== null && (error as { code?: number }).code === 11000)) throw error;
      await applyPayment();
    }
  } finally {
    await session.endSession();
  }
  return Payment.findOne({ mpPaymentId: paymentId, businessId }).lean();
}

export function toBillingPaymentDTO(payment: {
  _id: unknown;
  status: 'approved' | 'pending' | 'rejected';
  createdAt: Date;
  amount: number;
  currency: string;
  mpPaymentId: string;
  periodTo: Date;
}): BillingPaymentDTO {
  return {
    id: String(payment._id),
    status: payment.status,
    createdAt: payment.createdAt.toISOString(),
    amount: payment.amount,
    currency: payment.currency,
    providerReference: payment.mpPaymentId,
    paidThrough: payment.periodTo.toISOString(),
  };
}
