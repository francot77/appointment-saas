/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { auth } from '@/lib/auth';
import { apiError } from '@/lib/apiError';

export const runtime = 'nodejs';

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return apiError('Not allowed', 403, 'FORBIDDEN');
  }

  try {
    const session = await auth();
    if (!session?.user) {
      return apiError('Unauthorized', 401, 'UNAUTHORIZED');
    }

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

    console.log('[MP TEST] preference created', {
      hasInitPoint: Boolean((pref as any).sandbox_init_point || (pref as any).init_point),
    });

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
    console.error('[MP TEST] failed', {
      error: err instanceof Error ? err.name : 'unknown',
    });

    return NextResponse.json(
      {
        error: 'EXCEPTION',
      },
      { status: 500 }
    );
  }
}
