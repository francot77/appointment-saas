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

    const accessToken = process.env.MP_ACCESS_TOKEN_TEST;

    if (!accessToken) {
      console.error('[MP WEBHOOK] sin access token');
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

    if (topic !== 'payment' || !paymentId) {
      // MP a veces pega otras cosas, las ignoramos
      return NextResponse.json({ ok: true });
    }

    const p: any = await mpPayment.get({ id: paymentId });

    const status = p.status; // 'approved', 'pending', 'rejected'
    const externalReference = p.external_reference;

    if (!externalReference) {
      console.warn('[MP WEBHOOK] sin external_reference');
      return NextResponse.json({ ok: true });
    }

    const business = await Business.findById(externalReference);
    if (!business) {
      console.warn('[MP WEBHOOK] business no encontrado', externalReference);
      return NextResponse.json({ ok: true });
    }

    if (status === 'approved') {
      const amount = p.transaction_amount ?? 0;

      const periodFrom = new Date();
      const periodTo = new Date(
        periodFrom.getTime() + 30 * 24 * 60 * 60 * 1000
      );

      await Payment.create({
        businessId: business._id,
        amount,
        currency: p.currency_id ?? 'ARS',
        method: 'mp',
        mpPaymentId: String(p.id),
        status: 'approved',
        periodFrom,
        periodTo,
        rawPayload: p,
      });

      business.paidUntil = periodTo;
      business.status = 'active';
      await business.save();
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
