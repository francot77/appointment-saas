// app/api/billing/mp/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment as MPPayment } from 'mercadopago';
import dbConnect from '@/lib/db';
import { Business } from '@/lib/models/Business';
import { Payment } from '@/lib/models/Payments'; // tu modelo de pagos

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const accessToken = process.env.MP_ACCESS_TOKEN_TEST;
    if (!accessToken) {
      return NextResponse.json(
        { error: 'MP_ACCESS_TOKEN_TEST requerido' },
        { status: 500 }
      );
    }

    const client = new MercadoPagoConfig({ accessToken });

    const searchParams = req.nextUrl.searchParams;
    const topic = searchParams.get('topic') || searchParams.get('type');
    const paymentId =
      searchParams.get('id') || searchParams.get('data.id');

    // MP manda varias cosas, pero para el caso de pago aprobado
    // nos interesa cuando topic/type === 'payment'
    if (topic !== 'payment' || !paymentId) {
      return NextResponse.json({ ok: true });
    }

    const mpPayment = new MPPayment(client);
    const p = await mpPayment.get({ id: paymentId });

    const status = p.status; // 'approved', 'pending', 'rejected', etc.
    const externalReference = p.external_reference; // el business._id que pusimos

    if (!externalReference) {
      return NextResponse.json({ ok: true });
    }

    const business = await Business.findById(externalReference);
    if (!business) {
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
    console.error('MP webhook error:', err);
    return NextResponse.json(
      { error: 'WEBHOOK_ERROR' },
      { status: 500 }
    );
  }
}
