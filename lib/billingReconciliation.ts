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
    items?: unknown[];
  };
};

export const PAYMENT_VALIDATION_REASON_CODES = [
  'MISSING_PROVIDER_ID',
  'UNSUPPORTED_STATUS',
  'INVALID_EXTERNAL_REFERENCE',
  'EXPECTED_BUSINESS_MISMATCH',
  'WRONG_CURRENCY',
  'AMOUNT_NOT_ACCEPTED',
  'LOCAL_ATTEMPT_MISSING',
  'LOCAL_ATTEMPT_MISMATCH',
  'LOCAL_PRODUCT_MISMATCH',
  'LOCAL_CURRENCY_AMOUNT_MISMATCH',
  'PREFERENCE_MISMATCH',
] as const;

export type PaymentValidationReasonCode = typeof PAYMENT_VALIDATION_REASON_CODES[number];

export type PaymentValidationDiagnostics = {
  reasonCode: PaymentValidationReasonCode;
  status: 'approved' | 'pending' | 'rejected' | 'cancelled' | 'unknown';
  currency: 'ARS' | 'other' | 'missing';
  amountAccepted: boolean;
  amountARS?: number;
  hasExternalReference: boolean;
  hasProviderId: boolean;
  hasPreferenceId: boolean;
  hasOptionalItems: boolean;
  localAttemptFound: boolean;
};

export class PaymentValidationError extends Error {
  readonly reasonCode: PaymentValidationReasonCode;
  readonly diagnostics: PaymentValidationDiagnostics;

  constructor(reasonCode: PaymentValidationReasonCode, diagnostics: Omit<PaymentValidationDiagnostics, 'reasonCode'>) {
    super('PAYMENT_INVALID');
    this.name = 'PaymentValidationError';
    this.reasonCode = reasonCode;
    this.diagnostics = { reasonCode, ...diagnostics };
  }
}

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

export function getPaymentValidationDiagnostics(
  payment: ProviderPayment | undefined,
  reasonCode: PaymentValidationReasonCode,
  localAttemptFound: boolean,
): PaymentValidationDiagnostics {
  const amount = payment?.transaction_amount;
  let accepted = false;
  try {
    accepted = typeof amount === 'number' && getAcceptedBasicPricesARS().includes(amount);
  } catch {
    // Diagnostics must remain available even when billing configuration is invalid.
  }
  const status = payment?.status;
  const externalReference = typeof payment?.external_reference === 'string' ? payment.external_reference.trim() : '';
  const preferenceId = typeof payment?.preference_id === 'string' ? payment.preference_id.trim() : '';
  return {
    reasonCode,
    status: isSupportedProviderStatus(status) ? status : 'unknown',
    currency: payment?.currency_id === 'ARS' ? 'ARS' : typeof payment?.currency_id === 'string' && payment.currency_id ? 'other' : 'missing',
    amountAccepted: accepted,
    ...(accepted ? { amountARS: amount } : {}),
    hasExternalReference: Boolean(externalReference),
    hasProviderId: Boolean(payment && (typeof payment.id === 'string' || typeof payment.id === 'number') && String(payment.id).trim()),
    hasPreferenceId: Boolean(preferenceId),
    hasOptionalItems: Array.isArray(payment?.additional_info?.items),
    localAttemptFound,
  };
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
  const reference = typeof payment.external_reference === 'string' ? payment.external_reference.trim() : '';
  const businessId = reference.split(':', 1)[0];
  const acceptedPricesARS = getAcceptedBasicPricesARS();
  const hasValidReference = Boolean(reference) && businessId && Types.ObjectId.isValid(businessId);
  const hasValidAmount = typeof payment.transaction_amount === 'number' &&
    acceptedPricesARS.includes(payment.transaction_amount);
  const fail = (reasonCode: PaymentValidationReasonCode): never => {
    throw new PaymentValidationError(reasonCode, getPaymentValidationDiagnostics(payment, reasonCode, Boolean(localAttempt)));
  };
  if (!paymentId) fail('MISSING_PROVIDER_ID');
  if (!isSupportedProviderStatus(payment.status)) fail('UNSUPPORTED_STATUS');
  if (!hasValidReference) fail('INVALID_EXTERNAL_REFERENCE');
  if (expectedBusinessId && businessId !== expectedBusinessId) fail('EXPECTED_BUSINESS_MISMATCH');
  if (payment.currency_id !== 'ARS') fail('WRONG_CURRENCY');
  if (!hasValidAmount) fail('AMOUNT_NOT_ACCEPTED');
  const attempt = localAttempt ?? fail('LOCAL_ATTEMPT_MISSING');
  if (String(attempt.businessId) !== businessId || attempt.attemptReference !== reference) fail('LOCAL_ATTEMPT_MISMATCH');
  if (attempt.productId !== BASIC_PRODUCT_ID) fail('LOCAL_PRODUCT_MISMATCH');
  if (attempt.currency !== 'ARS' || !acceptedPricesARS.includes(attempt.amount) || payment.transaction_amount !== attempt.amount) fail('LOCAL_CURRENCY_AMOUNT_MISMATCH');
  if (attempt.preferenceId && payment.preference_id && attempt.preferenceId !== payment.preference_id) fail('PREFERENCE_MISMATCH');
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
  if (!paymentId) throw new PaymentValidationError('MISSING_PROVIDER_ID', getPaymentValidationDiagnostics(payment, 'MISSING_PROVIDER_ID', false));

  const reference = typeof payment.external_reference === 'string' ? payment.external_reference.trim() : '';
  const businessId = reference.split(':', 1)[0];
  const localAttempt = knownAttempt ?? (reference && businessId && Types.ObjectId.isValid(businessId)
    ? await Payment.findOne({ businessId, attemptReference: reference }).lean()
    : undefined);
  if (!localAttempt) throw new PaymentValidationError('LOCAL_ATTEMPT_MISSING', getPaymentValidationDiagnostics(payment, 'LOCAL_ATTEMPT_MISSING', false));
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
