/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/billing/mp/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import dbConnect from '@/lib/db';
import { getCurrentBusiness } from '@/lib/currentBusiness';

export const runtime = 'nodejs';

const PRICE_BASIC = 100; // ARS

export async function POST(_req: NextRequest) {
  try {
    await dbConnect();
    const business: any = await getCurrentBusiness();

    if (!business) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }


    const accessToken = process.env.MP_ACCESS_TOKEN_TEST;


    if (!accessToken) {
      return NextResponse.json(
        { error: 'Falta access token de Mercado Pago' },
        { status: 500 }
      );
    }

    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.APP_URL ||
      'http://localhost:3000'; // fallback en dev

    const backUrls = {
      success: `google.com`, //`${appUrl}/billing?status=success`,
      failure: `google.com`, //`${appUrl}/billing?status=failure`,
      pending: `google.com`, //`${appUrl}/billing?status=pending`,
    };

    // y cuando armás el body de la preferencia:
    const pref = await preference.create({
      body: {
        items: [
          {
            id: 'basic-monthly',
            title: 'Suscripción mensual turnos',
            description: 'Plan básico - 1 mes',
            unit_price: PRICE_BASIC,
            currency_id: 'ARS',
            quantity: 1,
          },
        ],
        external_reference: business._id.toString(),
        back_urls: backUrls,
        auto_return: 'approved',
        notification_url: `${appUrl}/api/billing/mp/webhook`,
      },
    });


    const initPoint =
      (pref as any).init_point ??
      null;

    if (!initPoint) {
      return NextResponse.json(
        { error: 'No se obtuvo init_point de Mercado Pago' },
        { status: 500 }
      );
    }

    return NextResponse.json({ initPoint }, { status: 200 });
  } catch (err) {
    console.error('[MP CHECKOUT] error', err);
    return NextResponse.json(
      { error: 'ERROR_CREATING_PREFERENCE' },
      { status: 500 }
    );
  }
}
