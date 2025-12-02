/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const accessToken = process.env.MP_ACCESS_TOKEN_TEST;

    console.log('[MP TEST] env', {
      hasAccessToken: !!accessToken,
    });

    if (!accessToken) {
      return NextResponse.json(
        {
          error: 'Falta MP_ACCESS_TOKEN_TEST',
          hasAccessToken: !!accessToken,
        },
        { status: 500 }
      );
    }

    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);

    const pref = await preference.create({
      body: {
        items: [
          {
            id: 'basic-monthly',
            title: 'TEST Suscripción mensual turnos',
            description: 'Plan básico - 1 mes',
            quantity: 1,
            unit_price: 10000,
            currency_id: 'ARS',
          },
        ],
        back_urls: {
          success: 'https://www.google.com',          // 👈 https, dominio real
          failure: 'https://www.google.com',
          pending: 'https://www.google.com',
        },
        auto_return: 'approved',
        // 🔴 IMPORTANTE: por ahora SIN notification_url
      },
    });

    console.log('[MP TEST] preference creada', pref);

    const initPoint =
      (pref as any).sandbox_init_point ??
      (pref as any).init_point ??
      null;

    return NextResponse.json(
      {
        ok: true,
        initPoint,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('[MP TEST] error', err);

    return NextResponse.json(
      {
        error: 'EXCEPTION',
        message: err?.message ?? 'unknown',
        name: err?.name ?? null,
      },
      { status: 500 }
    );
  }
}
