/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/billing/mp/checkout/route.ts
import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import dbConnect from '@/lib/db';
import { getCurrentBusiness } from '@/lib/currentBusiness';

export const runtime = 'nodejs';

// Precio del plan básico mensual en ARS (centavos)
const PRICE_BASIC = 100; // $10.000 ARS

export async function POST() {
  try {
    await dbConnect();
    const business: any = await getCurrentBusiness();

    if (!business) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    // Determinar si estamos en producción o test
    const isProduction = process.env.NODE_ENV === 'production';
    const accessToken = isProduction
      ? process.env.MP_ACCESS_TOKEN_PROD
      : process.env.MP_ACCESS_TOKEN_TEST;

    if (!accessToken) {
      console.error(
        '[MP CHECKOUT] Missing access token',
        isProduction ? 'PROD' : 'TEST'
      );
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
      'http://localhost:3000';

    // URLs de retorno correctas
    const backUrls = {
      success: `${appUrl}/billing?status=success`,
      failure: `${appUrl}/billing?status=failure`,
      pending: `${appUrl}/billing?status=pending`,
    };

    console.log('[MP CHECKOUT] Creating preference', {
      businessId: business._id.toString(),
      price: PRICE_BASIC,
      appUrl,
      environment: isProduction ? 'production' : 'test',
    });

    // Crear la preferencia con todos los datos necesarios
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
        payer: {
          name: business.name || 'Cliente',
          email: business.ownerUserId?.email || undefined,
        },
      },
    });

    const initPoint = (pref as any).init_point ?? null;

    if (!initPoint) {
      console.error('[MP CHECKOUT] No init_point received', pref);
      return NextResponse.json(
        { error: 'No se obtuvo init_point de Mercado Pago' },
        { status: 500 }
      );
    }

    console.log('[MP CHECKOUT] Preference created successfully', {
      preferenceId: (pref as any).id,
      initPoint: initPoint.substring(0, 50) + '...',
    });

    return NextResponse.json({ initPoint }, { status: 200 });
  } catch (err) {
    console.error('[MP CHECKOUT] error', err);
    return NextResponse.json(
      { error: 'ERROR_CREATING_PREFERENCE' },
      { status: 500 }
    );
  }
}
