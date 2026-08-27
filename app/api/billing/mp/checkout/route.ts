// app/api/billing/mp/checkout/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getCurrentBusiness } from '@/lib/currentBusiness';
import { BASIC_PRODUCT_ID } from '@/lib/billingEntitlements';
import { getBasicPriceARS, getPublicAppUrl } from '@/lib/billingConfig';
import { Payment } from '@/lib/models/Payments';
import { buildBasicPreferenceBody, createMercadoPagoClients, getMercadoPagoAccessToken, MERCADO_PAGO_TIMEOUT_MS } from '@/lib/mercadoPago';
import crypto from 'node:crypto';

export const runtime = 'nodejs';

export async function POST() {
  try {
    const basicPriceARS = getBasicPriceARS();
    const appUrl = getPublicAppUrl();
    await dbConnect();
    const business = await getCurrentBusiness();

    if (!business) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const attemptReference = `${business._id.toString()}:${crypto.randomUUID()}`;
    const periodFrom = new Date();
    const periodTo = new Date(periodFrom.getTime() + 30 * 24 * 60 * 60 * 1000);
    const attempt = await Payment.create({ businessId: business._id, amount: basicPriceARS, currency: 'ARS', method: 'mp', attemptReference, productVersion: 'v1', periodMonths: 1, status: 'pending', periodFrom, periodTo, productId: BASIC_PRODUCT_ID, providerStatus: 'created' });

    // Determinar si estamos en producción o test
    const isProduction = process.env.NODE_ENV === 'production';
    const accessToken = getMercadoPagoAccessToken();

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

    const { preference } = createMercadoPagoClients(accessToken);

    console.log('[MP CHECKOUT] Creating preference', {
      businessId: business._id.toString(),
        price: basicPriceARS,
      appUrl,
      environment: isProduction ? 'production' : 'test',
    });

    // Crear la preferencia con todos los datos necesarios
    const pref = await preference.create({
      body: buildBasicPreferenceBody({ appUrl, attemptReference, priceARS: basicPriceARS, name: business.name, email: business.ownerUserId?.email }),
      requestOptions: { timeout: MERCADO_PAGO_TIMEOUT_MS, idempotencyKey: `preference-${attemptReference}` },
    });

    const initPoint = pref.init_point ?? null;

    if (!initPoint) {
      console.error('[MP CHECKOUT] No init_point received', {
        businessId: business._id.toString(),
      });
      return NextResponse.json(
        { error: 'No se obtuvo init_point de Mercado Pago' },
        { status: 500 }
      );
    }

    await Payment.updateOne({ _id: attempt._id, businessId: business._id }, { $set: { preferenceId: String(pref.id) } });

    console.log('[MP CHECKOUT] Preference created successfully', {
      preferenceId: pref.id,
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
