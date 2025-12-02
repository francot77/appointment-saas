/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { Service } from '@/lib/models/Service';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  await dbConnect();
  const id = params.id;

  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json(
      { error: 'ID inválido' },
      { status: 400 }
    );
  }

  const body = await req.json();
  const update: any = {};

  if (body.name !== undefined) update.name = body.name;
  if (body.durationMinutes !== undefined)
    update.durationMinutes = Number(body.durationMinutes);
  if (body.price !== undefined) update.price = Number(body.price);
  if (body.color !== undefined) update.color = body.color;
  if (body.active !== undefined) update.active = !!body.active;

  const service = await Service.findByIdAndUpdate(id, update, {
    new: true,
  }).lean();

  if (!service) {
    return NextResponse.json(
      { error: 'Servicio no encontrado' },
      { status: 404 }
    );
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
}
