import { Types } from 'mongoose';
import { Business } from '@/lib/models/Business';
import { Payment } from '@/lib/models/Payments';
import { BASIC_PRODUCT_ID } from '@/lib/billingEntitlements';
import { getAcceptedBasicPricesARS } from '@/lib/billingConfig';

export type ProviderPayment = {
  id?: string | number;
  external_reference?: string;
  preference_id?: string;
  transaction_amount?: number;
  currency_id?: string;
  status?: string;
  status_detail?: string;
  additional_info?: {
    items?: Array<{ id?: string; unit_price?: number; quantity?: number }>;
  };
};

export type LocalPaymentAttempt = {
  businessId: unknown;
  amount: number;
  currency?: string;
  attemptReference: string;
  preferenceId?: string | null;
  productId: string;
};

export type BillingPaymentDTO = {
  id: string;
  status: 'approved' | 'pending' | 'rejected';
  createdAt: string;
  amount: number;
  currency: string;
  providerReference: string;
  paidThrough: string;
  attemptReference?: string;
  preferenceId?: string;
  paymentId?: string;
};

export function isSupportedProviderStatus(status: string | undefined) {
  return status === 'approved' || status === 'pending' || status === 'rejected' || status === 'cancelled';
}

function normalizeStatus(status: string) {
  return status === 'approved' ? 'approved' as const : status === 'rejected' || status === 'cancelled' ? 'rejected' as const : 'pending' as const;
}

export function calculatePaymentPeriodTo(paidUntil: Date | undefined, now: Date, periodMonths = 1) {
  const currentPaidUntil = paidUntil && paidUntil > now ? paidUntil : now;
  return new Date(currentPaidUntil.getTime() + periodMonths * 30 * 24 * 60 * 60 * 1000);
}

export function validateProviderPayment(
  payment: ProviderPayment,
  expectedBusinessId?: string,
  localAttempt?: LocalPaymentAttempt,
) {
  const paymentId = typeof payment.id === 'string' || typeof payment.id === 'number'
    ? String(payment.id).trim()
    : '';
  const reference = payment.external_reference || '';
  const businessId = reference.split(':', 1)[0];
  const items = payment.additional_info?.items;
  const basicItem = items?.find((candidate) => candidate.id === BASIC_PRODUCT_ID);
  const acceptedPricesARS = getAcceptedBasicPricesARS();
  const hasValidReference = Boolean(reference) && businessId && Types.ObjectId.isValid(businessId);
  const hasValidAmount = typeof payment.transaction_amount === 'number' &&
    acceptedPricesARS.includes(payment.transaction_amount);
  const localMatches = !localAttempt || (
    String(localAttempt.businessId) === businessId &&
    localAttempt.attemptReference === reference &&
    localAttempt.productId === BASIC_PRODUCT_ID &&
    localAttempt.currency === 'ARS' &&
    acceptedPricesARS.includes(localAttempt.amount) &&
    payment.transaction_amount === localAttempt.amount &&
    (!localAttempt.preferenceId || !payment.preference_id || localAttempt.preferenceId === payment.preference_id)
  );
  const optionalItemMatches = !items || (
    basicItem !== undefined &&
    basicItem.unit_price === payment.transaction_amount &&
    basicItem.quantity === 1
  );
  const hasProductEvidence = localAttempt?.productId === BASIC_PRODUCT_ID || basicItem !== undefined;
  if (!paymentId || !isSupportedProviderStatus(payment.status) || !hasValidReference ||
      (expectedBusinessId && businessId !== expectedBusinessId) || payment.currency_id !== 'ARS' ||
      !hasValidAmount || !hasProductEvidence || !localMatches || !optionalItemMatches) {
    throw new Error('PAYMENT_INVALID');
  }
  return { businessId, attemptReference: reference, nextStatus: normalizeStatus(payment.status as string) };
}

export function isValidPaymentTransition(current: string | undefined, incoming: string) {
  if (!current) return true;
  if (current === 'approved' || current === 'rejected') return false;
  return incoming === 'approved' || incoming === 'pending' || incoming === 'rejected';
}

export async function reconcileProviderPayment(
  payment: ProviderPayment,
  expectedBusinessId?: string,
  knownAttempt?: LocalPaymentAttempt,
) {
  const paymentId = typeof payment.id === 'string' || typeof payment.id === 'number'
    ? String(payment.id).trim()
    : '';
  if (!paymentId) throw new Error('PAYMENT_INVALID');

  const reference = payment.external_reference || '';
  const businessId = reference.split(':', 1)[0];
  const localAttempt = knownAttempt ?? (reference && businessId && Types.ObjectId.isValid(businessId)
    ? await Payment.findOne({ businessId, attemptReference: reference }).lean()
    : undefined);
  if (!localAttempt) throw new Error('PAYMENT_INVALID');
  const { businessId: validatedBusinessId, attemptReference, nextStatus } = validateProviderPayment(
    payment,
    expectedBusinessId,
    localAttempt,
  );

  const connection = await Payment.db;
  const session = await connection.startSession();
  const now = new Date();
  try {
    const applyPayment = () => session.withTransaction(async () => {
      const existing = await Payment.findOne({
        businessId: validatedBusinessId,
        $or: [{ mpPaymentId: paymentId }, { attemptReference }],
      }).session(session).lean();
      const business = await Business.findById(validatedBusinessId).select({ _id: 1, paidUntil: 1, status: 1 }).session(session).lean();
      if (!business) throw new Error('NO_BUSINESS');

      if (existing && !isValidPaymentTransition(existing.status, nextStatus)) {
        if (existing.status === 'rejected') return;
        await Business.updateOne({ _id: business._id }, { $max: { paidUntil: existing.periodTo }, $set: { status: 'active' } }, { session });
        return;
      }

      const periodTo = calculatePaymentPeriodTo(business.paidUntil, now);
      const preferenceId = typeof payment.preference_id === 'string' && payment.preference_id.trim()
        ? payment.preference_id.trim()
        : existing?.preferenceId;
      const fields = {
        amount: payment.transaction_amount,
        currency: payment.currency_id,
        method: 'mp',
        mpPaymentId: paymentId,
        ...(preferenceId ? { preferenceId } : {}),
        attemptReference,
        productVersion: 'v1',
        periodMonths: 1,
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
  return Payment.findOne({ mpPaymentId: paymentId, businessId: validatedBusinessId }).lean();
}

export function toBillingPaymentDTO(payment: {
  _id: unknown;
  status: 'approved' | 'pending' | 'rejected';
  createdAt: Date;
  amount: number;
  currency: string;
  mpPaymentId?: string | null;
  preferenceId?: string | null;
  attemptReference: string;
  periodTo: Date;
}): BillingPaymentDTO {
  return {
    id: String(payment._id),
    status: payment.status,
    createdAt: payment.createdAt.toISOString(),
    amount: payment.amount,
    currency: payment.currency,
    providerReference: payment.mpPaymentId || payment.attemptReference,
    paidThrough: payment.periodTo.toISOString(),
    attemptReference: payment.attemptReference,
    ...(payment.preferenceId ? { preferenceId: payment.preferenceId } : {}),
    ...(payment.mpPaymentId ? { paymentId: payment.mpPaymentId } : {}),
  };
}
