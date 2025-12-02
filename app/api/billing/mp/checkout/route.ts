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

    const isProd = process.env.NODE_ENV === 'production';

    const accessToken = isProd
      ? process.env.MP_ACCESS_TOKEN
      : process.env.MP_ACCESS_TOKEN_TEST;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Falta access token de Mercado Pago' },
        { status: 500 }
      );
    }

    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);

    const externalReference = business._id.toString();

    // back_urls según entorno
    let backUrls: {
      success: string;
      failure: string;
      pending: string;
    };

    let notificationUrl: string | undefined;

    if (isProd) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL;
      if (!appUrl) {
        return NextResponse.json(
          { error: 'Falta NEXT_PUBLIC_APP_URL en producción' },
          { status: 500 }
        );
      }

      backUrls = {
        success: `${appUrl}/billing`,
        failure: `${appUrl}/billing`,
        pending: `${appUrl}/billing`,
      };

      notificationUrl = `${appUrl}/api/billing/mp/webhook`;
    } else {
      // Dev / sandbox: usamos una URL https dummy porque localhost da problemas
      backUrls = {
        success: 'https://www.google.com',
        failure: 'https://www.google.com',
        pending: 'https://www.google.com',
      };
      notificationUrl = undefined;
    }

    const pref = await preference.create({
      body: {
        items: [
          {
            id: 'basic-monthly',
            title: 'Suscripción mensual turnos',
            description: 'Plan básico - 1 mes',
            quantity: 1,
            unit_price: PRICE_BASIC,
            currency_id: 'ARS',
          },
        ],
        external_reference: externalReference,
        back_urls: backUrls,
        auto_return: 'approved',
        ...(notificationUrl
          ? { notification_url: notificationUrl }
          : {}),
      },
    });

    const initPoint =
      (pref as any).sandbox_init_point ??
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
