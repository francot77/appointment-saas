/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { getCurrentBusiness } from '@/lib/currentBusiness';
import dbConnect from '@/lib/db';
import { MercadoPagoConfig, PreApproval } from 'mercadopago';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  await dbConnect();
  const business = await getCurrentBusiness();
  if (!business) return 401;

  const isProd = process.env.NODE_ENV === 'production';
  const accessToken = isProd
    ? process.env.MP_ACCESS_TOKEN_PROD
    : process.env.MP_ACCESS_TOKEN_TEST;

  if (!accessToken) {
    return new Response('Missing Mercado Pago access token', { status: 500 });
  }

  const client = new MercadoPagoConfig({ accessToken });
  const preapproval = new PreApproval(client);

  const appUrlRaw = process.env.NEXT_PUBLIC_APP_URL!;
  const appUrl = appUrlRaw.replace(/\/+$/, '');

  const body = {
    reason: 'Suscripción mensual turnos - Plan básico',
    external_reference: business._id.toString(),
    auto_recurring: {
      frequency: 1,
      frequency_type: 'months',
      transaction_amount: 100,
      currency_id: 'ARS',
    },
    back_url: `${appUrl}/dashboard`,  // a dónde vuelve después de aceptar
    payer_email: business.ownerEmail, // mail de la cuenta MP que va a pagar
    status: 'pending', // o 'authorized' según docs
  };

  const sub = await preapproval.create({ body });
  const initPoint = (sub as any).init_point
    

  return NextResponse.json({ initPoint });
}
