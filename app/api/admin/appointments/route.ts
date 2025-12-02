// app/api/admin/appointments/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Appointment } from '@/lib/models/Appointment';
import { Service } from '@/lib/models/Service';
import { getCurrentBusiness } from '@/lib/currentBusiness';
import { apiError } from '@/lib/apiError';

export async function GET(req: NextRequest) {
  try {
    const business = await getCurrentBusiness();
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');      // opcional
    const status = searchParams.get('status');  // 'request' | 'confirmed' | 'all'

    const query: any = {
      businessId: business._id,
    };

    // si viene date, filtramos por día; si no, devolvemos todos los del negocio
    if (date) {
      query.date = date;
    }

    // si status != 'all', filtramos
    if (status && status !== 'all') {
      query.status = status;
    }

    const appointments = await Appointment.find(query)
      .sort({ date: 1, startTime: 1 })
      .lean();

    const serviceIds = [
      ...new Set(appointments.map(a => String(a.serviceId))),
    ];

    const services = await Service.find({
      _id: { $in: serviceIds },
      businessId: business._id,
    }).lean();

    const serviceMap = new Map<string, any>();
    services.forEach(s => serviceMap.set(String(s._id), s));

    const withServiceInfo = appointments.map(a => {
      const s = serviceMap.get(String(a.serviceId));
      return {
        id: String(a._id),
        clientName: a.clientName,
        clientPhone: a.clientPhone,
        date: a.date,
        startTime: a.startTime,
        endTime: a.endTime,
        status: a.status,
        notes: a.notes || '',
        serviceId: String(a.serviceId),
        serviceName: s?.name || 'Servicio',
        serviceColor: s?.color || '#64748b',
        reminderSent: a.reminderSent ?? false,
        createdAt: a.createdAt,
      };
    });

    return NextResponse.json({ appointments: withServiceInfo }, { status: 200 });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    if (err.message === 'NO_BUSINESS') return apiError('No business', 403);
    console.error('GET /admin/appointments error', err);
    return apiError('Internal error', 500);
  }
}
