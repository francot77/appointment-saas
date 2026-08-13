import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment as MPPayment } from 'mercadopago';
import dbConnect from '@/lib/db';
import { getCurrentBusiness } from '@/lib/currentBusiness';
import { Payment } from '@/lib/models/Payments';
import { apiError } from '@/lib/apiError';
import { reconcileProviderPayment, toBillingPaymentDTO } from '@/lib/billingReconciliation';

export const runtime = 'nodejs';

function isTransactionUnsupported(error: unknown) {
  const code = typeof error === 'object' && error !== null
    ? (error as { code?: number }).code
    : undefined;
  const message = error instanceof Error ? error.message : '';
  return code === 20 || code === 251 || /transaction numbers are only allowed|transactions are not supported/i.test(message);
}

export async function POST(req: NextRequest) {
  try {
    const business = await getCurrentBusiness();
    const body = await req.json().catch(() => ({})) as { paymentId?: unknown };
    const paymentId = typeof body.paymentId === 'string' ? body.paymentId.trim() : '';
    if (!paymentId || paymentId.length > 100) return apiError('paymentId inválido', 400, 'VALIDATION');
    await dbConnect();
    const local = await Payment.findOne({ businessId: business._id, mpPaymentId: paymentId }).select({ _id: 1 }).lean();
    if (!local) return apiError('Pago no encontrado', 404, 'NOT_FOUND');
    const accessToken = process.env.NODE_ENV === 'production' ? process.env.MP_ACCESS_TOKEN_PROD : process.env.MP_ACCESS_TOKEN_TEST;
    if (!accessToken) return apiError('Mercado Pago no configurado', 503, 'INTERNAL');
    const providerPayment = await new MPPayment(new MercadoPagoConfig({ accessToken })).get({ id: paymentId });
    const reconciled = await reconcileProviderPayment({ ...providerPayment, id: paymentId }, String(business._id));
    if (!reconciled) return apiError('Pago no encontrado', 404, 'NOT_FOUND');
    return NextResponse.json({ payment: toBillingPaymentDTO(reconciled) });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401, 'UNAUTHORIZED');
    if (error instanceof Error && error.message === 'NO_BUSINESS') return apiError('No business', 403, 'FORBIDDEN');
    if (error instanceof Error && error.message === 'PAYMENT_INVALID') return apiError('Pago no válido', 422, 'VALIDATION');
    if (isTransactionUnsupported(error)) {
      return apiError('Reconciliación requiere MongoDB con soporte para transacciones', 503, 'INTERNAL');
    }
    console.error('POST /api/billing/reconcile failed', { error: error instanceof Error ? error.name : 'unknown' });
    return apiError('No se pudo reconciliar el pago', 502, 'INTERNAL');
  }
}
