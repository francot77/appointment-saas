/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Service } from '@/lib/models/Service';
import { getCurrentBusiness } from '@/lib/currentBusiness';
import { apiError } from '@/lib/apiError';
import { hexColor, nonEmptyString, nonnegativePrice, positiveInteger } from '@/lib/validation';

export async function GET() {
  try {
    const business = await getCurrentBusiness({ requireEntitlement: true });
    await dbConnect();

    const services = await Service.find({ businessId: business._id })
      .sort({ active: -1, name: 1 })
      .lean();

    return NextResponse.json({ services });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    if (err.message === 'NO_BUSINESS') return apiError('No business found', 403);
    console.error('GET /admin/services error', err);
    return apiError('Internal error', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const business = await getCurrentBusiness({ requireEntitlement: true });
    await dbConnect();

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') return apiError('Cuerpo inválido', 400);
    const data = body as Record<string, unknown>;
    const name = nonEmptyString(data.name, 'name', 120);
    const durationMinutes = positiveInteger(data.durationMinutes, 'durationMinutes');
    const price = nonnegativePrice(data.price ?? 0);
    const color = hexColor(data.color);
    if (!name.ok) return apiError(name.error, 400);
    if (!durationMinutes.ok) return apiError(durationMinutes.error, 400);
    if (!price.ok) return apiError(price.error, 400);
    if (!color.ok) return apiError(color.error, 400);
    if (data.active !== undefined && typeof data.active !== 'boolean') return apiError('active debe ser booleano', 400);

    const service = await Service.create({
      businessId: business._id,
      name: name.value,
      durationMinutes: durationMinutes.value,
      price: price.value,
      color: color.value || '#f472b6',
      active: data.active !== undefined ? data.active : true,
    });

    return NextResponse.json({ service }, { status: 201 });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    if (err.message === 'NO_BUSINESS') return apiError('No business found', 403);
    if (err.message === 'BILLING_REQUIRED') return apiError('Billing required', 402, 'FORBIDDEN');
    console.error('POST /admin/services error', err);
    return apiError('Internal error', 500);
  }
}
