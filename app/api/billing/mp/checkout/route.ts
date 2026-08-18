/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/billing/mp/checkout/route.ts
import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import dbConnect from '@/lib/db';
import { getCurrentBusiness } from '@/lib/currentBusiness';
import { BASIC_PRODUCT_ID } from '@/lib/billingEntitlements';
import { getBasicPriceARS, getPublicAppUrl } from '@/lib/billingConfig';

export const runtime = 'nodejs';

export async function POST() {
  try {
    const basicPriceARS = getBasicPriceARS();
    const appUrl = getPublicAppUrl();
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

    // URLs de retorno correctas
    const backUrls = {
      success: `${appUrl}/billing?status=success`,
      failure: `${appUrl}/billing?status=failure`,
      pending: `${appUrl}/billing?status=pending`,
    };

    console.log('[MP CHECKOUT] Creating preference', {
      businessId: business._id.toString(),
        price: basicPriceARS,
      appUrl,
      environment: isProduction ? 'production' : 'test',
    });

    // Crear la preferencia con todos los datos necesarios
    const pref = await preference.create({
      body: {
        items: [
          {
            id: BASIC_PRODUCT_ID,
            title: 'Suscripción mensual turnos',
            description: 'Plan básico - 1 mes',
            unit_price: basicPriceARS,
            currency_id: 'ARS',
            quantity: 1,
          },
        ],
        external_reference: business._id.toString(),
        metadata: { product_id: BASIC_PRODUCT_ID, plan: 'basic' },
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
      console.error('[MP CHECKOUT] No init_point received', {
        businessId: business._id.toString(),
      });
      return NextResponse.json(
        { error: 'No se obtuvo init_point de Mercado Pago' },
        { status: 500 }
      );
    }

    console.log('[MP CHECKOUT] Preference created successfully', {
      preferenceId: (pref as any).id,
      hasInitPoint: true,
    });

    return NextResponse.json({ initPoint }, { status: 200 });
  } catch (err) {
    if (err instanceof Error && ['BILLING_PRICE_NOT_CONFIGURED', 'PUBLIC_APP_URL_NOT_CONFIGURED', 'PUBLIC_APP_URL_INVALID'].includes(err.message)) {
      return NextResponse.json({ error: 'BILLING_CONFIGURATION_ERROR' }, { status: 500 });
    }
    console.error('[MP CHECKOUT] failed', {
      error: err instanceof Error ? err.name : 'unknown',
    });
    return NextResponse.json(
      { error: 'ERROR_CREATING_PREFERENCE' },
      { status: 500 }
    );
  }
}
