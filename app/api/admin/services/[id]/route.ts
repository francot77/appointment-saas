/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { Service } from '@/lib/models/Service';
import dbConnect from '@/lib/db';
import { getCurrentBusiness } from '@/lib/currentBusiness';
import { apiError } from '@/lib/apiError';
import { hexColor, mongoId, nonEmptyString, nonnegativePrice, positiveInteger } from '@/lib/validation';

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;

  const validId = mongoId(id);
  if (!validId.ok) return apiError(validId.error, 400);

  try {
    const business = await getCurrentBusiness({ requireEntitlement: true });
    await dbConnect();

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') return apiError('Cuerpo inválido', 400);
    const data = body as Record<string, unknown>;
    const update: any = {};

    if (data.name !== undefined) {
      const result = nonEmptyString(data.name, 'name', 120);
      if (!result.ok) return apiError(result.error, 400);
      update.name = result.value;
    }
    if (data.durationMinutes !== undefined) {
      const result = positiveInteger(data.durationMinutes, 'durationMinutes');
      if (!result.ok) return apiError(result.error, 400);
      update.durationMinutes = result.value;
    }
    if (data.price !== undefined) {
      const result = nonnegativePrice(data.price);
      if (!result.ok) return apiError(result.error, 400);
      update.price = result.value;
    }
    if (data.color !== undefined) {
      const result = hexColor(data.color);
      if (!result.ok) return apiError(result.error, 400);
      update.color = result.value;
    }
    if (data.active !== undefined) {
      if (typeof data.active !== 'boolean') return apiError('active debe ser booleano', 400);
      update.active = data.active;
    }
    if (Object.keys(update).length === 0) return apiError('No hay campos para actualizar', 400);

    const service = await Service.findOneAndUpdate(
      { _id: validId.value, businessId: business._id },
      update,
      { new: true }
    ).lean();

    if (!service) {
      return apiError('Servicio no encontrado', 404);
    }

    return NextResponse.json(
      {
        id: String(service._id),
        name: service.name,
        durationMinutes: service.durationMinutes,
        price: service.price,
        color: service.color,
        active: service.active,
      },
      { status: 200 }
    );
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    if (err.message === 'NO_BUSINESS') return apiError('No business found', 403);
    console.error('PATCH /admin/services/[id] error', err);
    return apiError('Internal error', 500);
  }
}

export async function DELETE(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;

  const validId = mongoId(id);
  if (!validId.ok) return apiError(validId.error, 400);

  try {
    const business = await getCurrentBusiness({ requireEntitlement: true });
    await dbConnect();

    const service = await Service.findOneAndUpdate(
      { _id: validId.value, businessId: business._id },
      { $set: { active: false } },
      { new: true }
    ).lean();

    if (!service) {
      return apiError('Servicio no encontrado', 404);
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    if (err.message === 'NO_BUSINESS') return apiError('No business found', 403);
    if (err.message === 'BILLING_REQUIRED') return apiError('Billing required', 402, 'FORBIDDEN');
    console.error('DELETE /admin/services/[id] error', err);
    return apiError('Internal error', 500);
  }
}
