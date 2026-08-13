import crypto from 'node:crypto';
import { Types } from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment as MPPayment } from 'mercadopago';
import dbConnect from '@/lib/db';
import { Business } from '@/lib/models/Business';
import { Payment } from '@/lib/models/Payments';
import { apiError } from '@/lib/apiError';
import { BASIC_PRICE_ARS, BASIC_PRODUCT_ID } from '@/lib/billingEntitlements';

export const runtime = 'nodejs';

function verifySignature(req: NextRequest, dataId: string, secret: string) {
  const signature = req.headers.get('x-signature');
  const requestId = req.headers.get('x-request-id');
  if (!signature || !requestId || !dataId) return false;

  const parts = signature.split(',').reduce<Record<string, string>>((result, part) => {
    const [key, value] = part.trim().split('=', 2);
    if (key && value) result[key] = value;
    return result;
  }, {});
  if (!parts.ts || !parts.v1 || !/^\d+$/.test(parts.ts)) return false;
  if (Math.abs(Date.now() - Number(parts.ts) * 1000) > 5 * 60 * 1000) return false;

  const manifest = `id:${dataId};request-id:${requestId};ts:${parts.ts};`;
  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
  const received = Buffer.from(parts.v1, 'hex');
  const computed = Buffer.from(expected, 'hex');
  return received.length === computed.length && crypto.timingSafeEqual(received, computed);
}

function isDuplicateKey(error: unknown) {
  return typeof error === 'object' && error !== null && (error as { code?: number }).code === 11000;
}

function isTransactionUnsupported(error: unknown) {
  const code = typeof error === 'object' && error !== null
    ? (error as { code?: number }).code
    : undefined;
  const message = error instanceof Error ? error.message : '';
  return code === 20 || code === 251 || /transaction numbers are only allowed|transactions are not supported/i.test(message);
}

function normalizeStatus(status: string | undefined) {
  if (status === 'approved') return 'approved' as const;
  if (status === 'rejected' || status === 'cancelled') return 'rejected' as const;
  return 'pending' as const;
}

function isSupportedStatus(status: string | undefined) {
  return status === 'approved' || status === 'pending' || status === 'rejected' || status === 'cancelled';
}

export async function POST(req: NextRequest) {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return apiError('Webhook no configurado', 500, 'INTERNAL');

  const dataId = req.nextUrl.searchParams.get('data.id');
  if (!dataId || !verifySignature(req, dataId, secret)) {
    return apiError('Firma de webhook inválida', 401, 'UNAUTHORIZED');
  }

  try {
    const body = await req.json().catch(() => null) as { type?: unknown; data?: { id?: unknown } } | null;
    const topic = req.nextUrl.searchParams.get('type') || body?.type;
    const paymentId = String(body?.data?.id ?? dataId);
    if (topic !== 'payment' || !paymentId || paymentId !== dataId) return NextResponse.json({ ok: true });

    await dbConnect();
    const accessToken = process.env.NODE_ENV === 'production'
      ? process.env.MP_ACCESS_TOKEN_PROD
      : process.env.MP_ACCESS_TOKEN_TEST;
    if (!accessToken) return apiError('Mercado Pago no configurado', 500, 'INTERNAL');

    const client = new MercadoPagoConfig({ accessToken });
    const providerPayment = await new MPPayment(client).get({ id: paymentId });
    const payment = providerPayment as typeof providerPayment & {
      external_reference?: string;
      transaction_amount?: number;
      currency_id?: string;
      status?: string;
      status_detail?: string;
      additional_info?: { items?: Array<{ id?: string; unit_price?: number; quantity?: number }> };
    };
    if (!isSupportedStatus(payment.status)) return apiError('Estado de pago no válido', 422, 'VALIDATION');
    const businessId = payment.external_reference;
    const item = payment.additional_info?.items?.find((candidate) => candidate.id === BASIC_PRODUCT_ID);
    if (!businessId || !Types.ObjectId.isValid(businessId)) return NextResponse.json({ ok: true });
    if (payment.currency_id !== 'ARS' || payment.transaction_amount !== BASIC_PRICE_ARS ||
        !item || item.unit_price !== BASIC_PRICE_ARS || item.quantity !== 1) {
      return apiError('Pago no válido', 422, 'VALIDATION');
    }

    const nextStatus = normalizeStatus(payment.status);
    const now = new Date();
    const connection = await dbConnect();
    const session = await connection.startSession();
    try {
      const applyPayment = () => session.withTransaction(async () => {
        const existing = await Payment.findOne({ mpPaymentId: paymentId }).session(session).lean();
        const business = await Business.findById(businessId)
          .select({ _id: 1, paidUntil: 1, status: 1 })
          .session(session)
          .lean();
        if (!business) return;

        if (existing?.status === 'approved') {
          await Business.updateOne(
            { _id: business._id },
            { $max: { paidUntil: existing.periodTo }, $set: { status: 'active' } },
            { session }
          );
          return;
        }
        if (existing?.status === 'rejected') return;

        const currentPaidUntil = business.paidUntil && business.paidUntil > now ? business.paidUntil : now;
        const periodTo = new Date(currentPaidUntil.getTime() + 30 * 24 * 60 * 60 * 1000);
        if (!existing) {
          await Payment.create([{
            businessId: business._id,
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
          }], { session });
        } else {
          await Payment.updateOne(
            { _id: existing._id, status: 'pending' },
            { $set: { status: nextStatus, providerStatus: payment.status || 'unknown', statusDetail: payment.status_detail || null, periodTo } },
            { session }
          );
        }

        if (nextStatus === 'approved') {
          await Business.updateOne(
            { _id: business._id },
            { $set: { paidUntil: periodTo, status: 'active' } },
            { session }
          );
        } else if (nextStatus === 'rejected' && (!business.paidUntil || business.paidUntil <= now)) {
          await Business.updateOne(
            { _id: business._id, status: { $ne: 'cancelled' } },
            { $set: { status: 'past_due' } },
            { session }
          );
        }
      });
      try {
        await applyPayment();
      } catch (error) {
        if (!isDuplicateKey(error)) throw error;
        await applyPayment();
      }
    } finally {
      await session.endSession();
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (isTransactionUnsupported(error)) {
      return apiError('Webhook requiere MongoDB con soporte para transacciones', 503, 'INTERNAL');
    }
    console.error('[MP WEBHOOK] failed', { error: error instanceof Error ? error.name : 'unknown' });
    return apiError('WEBHOOK_ERROR', 500, 'INTERNAL');
  }
}
