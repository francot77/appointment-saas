/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Service } from '@/lib/models/Service';
import { getCurrentBusiness } from '@/lib/currentBusiness';
import { apiError } from '@/lib/apiError';

export async function GET(req: NextRequest) {
  try {
    const business = await getCurrentBusiness();
    await dbConnect();

    const services = await Service.find({ businessId: business._id, active: true })
      .sort({ name: 1 })
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
    const business = await getCurrentBusiness();
    await dbConnect();

    const { name, durationMinutes, price, color } = await req.json();

    if (!name || !durationMinutes) {
      return apiError('Nombre y duración son obligatorios', 400);
    }

    const service = await Service.create({
      businessId: business._id,
      name,
      durationMinutes,
      price: price ?? 0,
      color: color || '#f472b6',
    });

    return NextResponse.json({ service }, { status: 201 });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    if (err.message === 'NO_BUSINESS') return apiError('No business found', 403);
    console.error('POST /admin/services error', err);
    return apiError('Internal error', 500);
  }
}
