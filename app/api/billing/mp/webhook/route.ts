/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/billing/mp/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment as MPPayment } from 'mercadopago';
import dbConnect from '@/lib/db';
import { Business } from '@/lib/models/Business';
import { Payment } from '@/lib/models/Payments';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    // Determinar si estamos en producción o test
    const isProduction = process.env.NODE_ENV === 'production';
    const accessToken = isProduction
      ? process.env.MP_ACCESS_TOKEN_PROD
      : process.env.MP_ACCESS_TOKEN_TEST;

    if (!accessToken) {
      console.error(
        '[MP WEBHOOK] Missing access token',
        isProduction ? 'PROD' : 'TEST'
      );
      return NextResponse.json(
        { error: 'Sin access token' },
        { status: 500 }
      );
    }

    const client = new MercadoPagoConfig({ accessToken });
    const mpPayment = new MPPayment(client);

    const searchParams = req.nextUrl.searchParams;
    const topic = searchParams.get('topic') || searchParams.get('type');
    const paymentId =
      searchParams.get('id') || searchParams.get('data.id');

    console.log('[MP WEBHOOK] Received notification', {
      topic,
      paymentId,
      environment: isProduction ? 'production' : 'test',
    });

    // Solo procesar notificaciones de pagos
    if (topic !== 'payment' || !paymentId) {
      console.log('[MP WEBHOOK] Ignoring non-payment notification', { topic });
      return NextResponse.json({ ok: true });
    }

    // Obtener detalles del pago desde MercadoPago
    const p: any = await mpPayment.get({ id: paymentId });

    const status = p.status; // 'approved', 'pending', 'rejected', 'in_process', etc.
    const externalReference = p.external_reference;
    const mpPaymentId = String(p.id);

    if (!externalReference) {
      console.warn('[MP WEBHOOK] Missing external_reference', {
        paymentId: mpPaymentId,
        status,
      });
      return NextResponse.json({ ok: true });
    }

    // Verificar idempotencia: si ya procesamos este pago, no hacer nada
    const existingPayment = await Payment.findOne({ mpPaymentId });
    if (existingPayment) {
      console.log('[MP WEBHOOK] Payment already processed', {
        paymentId: mpPaymentId,
        status: existingPayment.status,
        businessId: externalReference,
      });
      return NextResponse.json({ ok: true });
    }

    const business = await Business.findById(externalReference);
    if (!business) {
      console.warn('[MP WEBHOOK] Business not found', {
        businessId: externalReference,
        paymentId: mpPaymentId,
      });
      return NextResponse.json({ ok: true });
    }

    const amount = p.transaction_amount ?? 0;
    const currency = p.currency_id ?? 'ARS';

    // Calcular período de suscripción (30 días desde ahora)
    const periodFrom = new Date();
    const periodTo = new Date(
      periodFrom.getTime() + 30 * 24 * 60 * 60 * 1000
    );

    console.log('[MP WEBHOOK] Processing payment', {
      paymentId: mpPaymentId,
      status,
      businessId: externalReference,
      amount,
      currency,
    });

    // Crear registro de pago para todos los estados
    const paymentRecord = await Payment.create({
      businessId: business._id,
      amount,
      currency,
      method: 'mp',
      mpPaymentId,
      status: status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'pending',
      periodFrom,
      periodTo,
      rawPayload: p,
    });

    console.log('[MP WEBHOOK] Payment record created', {
      paymentRecordId: paymentRecord._id,
      status: paymentRecord.status,
    });

    // Actualizar business según el estado del pago
    if (status === 'approved') {
      // Usar actualización atómica para evitar race conditions
      const updatedBusiness = await Business.findByIdAndUpdate(
        business._id,
        {
          $set: {
            paidUntil: periodTo,
            status: 'active',
          },
        },
        { new: true }
      );

      if (!updatedBusiness) {
        console.error('[MP WEBHOOK] Failed to update business', {
          businessId: externalReference,
        });
      } else {
        console.log('[MP WEBHOOK] Business updated successfully', {
          businessId: externalReference,
          paidUntil: periodTo,
          status: 'active',
        });
      }
    } else if (status === 'pending') {
      // Para pagos pendientes, no actualizamos el estado del negocio
      // pero registramos el pago para seguimiento
      console.log('[MP WEBHOOK] Payment is pending', {
        paymentId: mpPaymentId,
        businessId: externalReference,
        statusDetail: p.status_detail,
      });
    } else if (status === 'rejected') {
      // Para pagos rechazados, no actualizamos el estado del negocio
      console.log('[MP WEBHOOK] Payment was rejected', {
        paymentId: mpPaymentId,
        businessId: externalReference,
        statusDetail: p.status_detail,
      });
    } else {
      // Otros estados (in_process, etc.)
      console.log('[MP WEBHOOK] Payment in other status', {
        paymentId: mpPaymentId,
        status,
        statusDetail: p.status_detail,
        businessId: externalReference,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[MP WEBHOOK] error', err);
    return NextResponse.json(
      { error: 'WEBHOOK_ERROR' },
      { status: 500 }
    );
  }
}
