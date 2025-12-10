/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/billing/mp/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment as MPPayment } from 'mercadopago';
import dbConnect from '@/lib/db';
import { Business } from '@/lib/models/Business';
import { Payment } from '@/lib/models/Payments'; // asegúrate que el archivo se llama así

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

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
    const queryParams = Object.fromEntries(searchParams.entries());

    // 1) Intentamos sacar topic e id de la query
    let topic =
      searchParams.get('topic') ||
      searchParams.get('type') ||
      null;

    let paymentId =
      searchParams.get('id') ||
      searchParams.get('data.id') ||
      null;

    // 2) También leemos el body (formato que muestra tu captura)
    let body: any = null;
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        body = await req.json();
      } catch {
        body = null;
      }
    }

    // Si no teníamos topic/id en la query, los sacamos del body
    if (!topic && body?.type) {
      topic = body.type; // 'payment'
    }

    if (!paymentId && body?.data?.id) {
      paymentId = String(body.data.id); 
    }

    console.log('[MP WEBHOOK] Received notification', {
      method: req.method,
      topic,
      paymentId,
      queryParams,
      body,
      environment: isProduction ? 'production' : 'test',
    });

    // Si sigue sin haber topic o id, no podemos hacer nada útil
    if (topic !== 'payment' || !paymentId) {
      console.log('[MP WEBHOOK] Ignoring notification', { topic, paymentId });
      return NextResponse.json({ ok: true });
    }

    // Ahora sí: consultamos el pago a MP
    const p: any = await mpPayment.get({ id: paymentId });

    const status = p.status; // 'approved', 'pending', 'rejected', etc.
    const externalReference = p.external_reference;
    const mpPaymentId = String(p.id);

    if (!externalReference) {
      console.warn('[MP WEBHOOK] Missing external_reference', {
        paymentId: mpPaymentId,
        status,
      });
      return NextResponse.json({ ok: true });
    }

    // Idempotencia
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

    const paymentRecord = await Payment.create({
      businessId: business._id,
      amount,
      currency,
      method: 'mp',
      mpPaymentId,
      status:
        status === 'approved'
          ? 'approved'
          : status === 'rejected'
          ? 'rejected'
          : 'pending',
      periodFrom,
      periodTo,
      rawPayload: p,
    });

    console.log('[MP WEBHOOK] Payment record created', {
      paymentRecordId: paymentRecord._id,
      status: paymentRecord.status,
    });

    if (status === 'approved') {
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
          paidUntil: updatedBusiness.paidUntil,
          status: updatedBusiness.status,
        });
      }
    } else {
      console.log('[MP WEBHOOK] Payment not approved', {
        paymentId: mpPaymentId,
        status,
        statusDetail: p.status_detail,
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