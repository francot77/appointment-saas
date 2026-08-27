import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getCurrentBusiness } from '@/lib/currentBusiness';
import { Payment } from '@/lib/models/Payments';
import { apiError } from '@/lib/apiError';
import { getPaymentValidationDiagnostics, PaymentValidationError, reconcileProviderPayment, toBillingPaymentDTO, type ProviderPayment } from '@/lib/billingReconciliation';
import { createMercadoPagoClients, getMercadoPagoAccessToken, getMercadoPagoErrorStatus, MERCADO_PAGO_TIMEOUT_MS } from '@/lib/mercadoPago';
import { logger } from '@/lib/logger';

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
    if (!business) return apiError('Unauthorized', 401, 'UNAUTHORIZED');
    const body = await req.json().catch(() => ({})) as { paymentId?: unknown; attemptReference?: unknown; preferenceId?: unknown };
    const paymentId = typeof body.paymentId === 'string' ? body.paymentId.trim() : '';
    const attemptReference = typeof body.attemptReference === 'string' ? body.attemptReference.trim() : '';
    const preferenceId = typeof body.preferenceId === 'string' ? body.preferenceId.trim() : '';
    const reference = paymentId || attemptReference || preferenceId;
    if (!reference || reference.length > 150) return apiError('Referencia inválida', 400, 'VALIDATION');
    await dbConnect();
    const local = await Payment.findOne({ businessId: business._id, $or: [{ mpPaymentId: reference }, { preferenceId: reference }, { attemptReference: reference }] }).lean();
    if (!local) {
      logger.error('billing.reconcile.invalid', getPaymentValidationDiagnostics(undefined, 'LOCAL_ATTEMPT_MISSING', false));
      return apiError('Pago no encontrado', 404, 'NOT_FOUND');
    }
    const accessToken = getMercadoPagoAccessToken();
    if (!accessToken) return apiError('Mercado Pago no configurado', 503, 'INTERNAL');
    const { payment: providerClient } = createMercadoPagoClients(accessToken);
    let providerPayment: ProviderPayment | undefined;
    if (local.mpPaymentId === reference) providerPayment = await providerClient.get({ id: reference, requestOptions: { timeout: MERCADO_PAGO_TIMEOUT_MS } });
    else {
      const search = await providerClient.search({ options: { external_reference: local.attemptReference }, requestOptions: { timeout: MERCADO_PAGO_TIMEOUT_MS } });
      providerPayment = search?.results?.[0];
    }
    if (!providerPayment) return apiError('Pago todavía no disponible', 404, 'NOT_FOUND');
    const reconciled = await reconcileProviderPayment(
      { ...providerPayment, id: providerPayment.id },
      String(business._id),
      local,
    );
    if (!reconciled) return apiError('Pago no encontrado', 404, 'NOT_FOUND');
    return NextResponse.json({ payment: toBillingPaymentDTO(reconciled) });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401, 'UNAUTHORIZED');
    if (error instanceof Error && error.message === 'NO_BUSINESS') return apiError('No business', 403, 'FORBIDDEN');
    if (error instanceof PaymentValidationError) {
      logger.error('billing.reconcile.invalid', error.diagnostics);
      return apiError('Pago no válido', 422, 'VALIDATION');
    }
    if (getMercadoPagoErrorStatus(error) === 404) return apiError('Pago todavía no disponible', 404, 'NOT_FOUND');
    if (isTransactionUnsupported(error)) {
      return apiError('Reconciliación requiere MongoDB con soporte para transacciones', 503, 'INTERNAL');
    }
    console.error('POST /api/billing/reconcile failed', { error: error instanceof Error ? error.name : 'unknown' });
    return apiError('No se pudo reconciliar el pago', 502, 'INTERNAL');
  }
}
