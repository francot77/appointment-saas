import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment as MPPayment } from 'mercadopago';
import dbConnect from '@/lib/db';
import { apiError } from '@/lib/apiError';
import { reconcileProviderPayment, isSupportedProviderStatus } from '@/lib/billingReconciliation';
import { logger } from '@/lib/logger';

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

function isTransactionUnsupported(error: unknown) {
  const code = typeof error === 'object' && error !== null
    ? (error as { code?: number }).code
    : undefined;
  const message = error instanceof Error ? error.message : '';
  return code === 20 || code === 251 || /transaction numbers are only allowed|transactions are not supported/i.test(message);
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
    if (!isSupportedProviderStatus(payment.status)) return apiError('Estado de pago no válido', 422, 'VALIDATION');
    try {
      await reconcileProviderPayment({ ...payment, id: paymentId });
    } catch (error) {
      if (error instanceof Error && error.message === 'PAYMENT_INVALID') return apiError('Pago no válido', 422, 'VALIDATION');
      if (error instanceof Error && error.message === 'NO_BUSINESS') return NextResponse.json({ ok: true });
      throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (isTransactionUnsupported(error)) {
      return apiError('Webhook requiere MongoDB con soporte para transacciones', 503, 'INTERNAL');
    }
    logger.error('billing.webhook.failed', { route: '/api/billing/mp/webhook', errorName: error instanceof Error ? error.name : 'unknown' });
    return apiError('WEBHOOK_ERROR', 500, 'INTERNAL');
  }
}
