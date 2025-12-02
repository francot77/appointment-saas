/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/billing/mp/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import dbConnect from '@/lib/db';
import { getCurrentBusiness } from '@/lib/currentBusiness'; // o lo que uses vos

export const runtime = 'nodejs'; // importante para usar el SDK

const PRICE_BASIC = 10000; // ARS

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const business: any = await getCurrentBusiness();

    if (!business) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const accessToken = process.env.MP_ACCESS_TOKEN_TEST;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!accessToken || !appUrl) {
      return NextResponse.json(
        { error: 'Faltan MP_ACCESS_TOKEN_TEST o NEXT_PUBLIC_APP_URL' },
        { status: 500 }
      );
    }

    // SDK nuevo: Config + Preference
    const client = new MercadoPagoConfig({
      accessToken,
    });

    const preference = new Preference(client);

    const externalReference = business._id.toString();

    const pref = await preference.create({
      body: {
        items: [
          { id: 'plan_basic_001',
            title: 'Suscripción mensual turnos',
            quantity: 1,
            unit_price: PRICE_BASIC,
            currency_id: 'ARS',
          },
        ],
        external_reference: externalReference,
        back_urls: {
          success: `${appUrl}/billing`,
          failure: `${appUrl}/billing`,
          pending: `${appUrl}/billing`,
        },
        auto_return: 'approved',
        notification_url: `${appUrl}/api/billing/mp/webhook`,
      },
    });

    // La respuesta de /checkout/preferences trae init_point y sandbox_init_point :contentReference[oaicite:1]{index=1}
    const initPoint =
      (pref.sandbox_init_point as string | undefined) ??
      (pref.init_point as string | undefined);

    if (!initPoint) {
      return NextResponse.json(
        { error: 'No se obtuvo init_point de MP' },
        { status: 500 }
      );
    }

    return NextResponse.json({ initPoint }, { status: 200 });
  } catch (err) {
    console.error('MP checkout error:', err);
    return NextResponse.json(
      { error: 'ERROR_CREATING_PREFERENCE' },
      { status: 500 }
    );
  }
}
