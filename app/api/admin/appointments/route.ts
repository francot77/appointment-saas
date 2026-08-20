// app/api/admin/appointments/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { Appointment } from '@/lib/models/Appointment';
import { Service } from '@/lib/models/Service';
import { getCurrentBusiness } from '@/lib/currentBusiness';
import { apiError } from '@/lib/apiError';

function isValidDateStr(date: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

function toDateStr(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export async function GET(req: NextRequest) {
  try {
    const business = await getCurrentBusiness({ requireEntitlement: true });

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');      // opcional
    const from = searchParams.get('from');      // opcional
    const to = searchParams.get('to');          // opcional
    const status = searchParams.get('status');  // 'request' | 'confirmed' | 'all'

    const query: any = {
      businessId: business._id,
    };

    if (date) {
      if (!isValidDateStr(date)) {
        return apiError('Formato de fecha inválido (YYYY-MM-DD)', 400);
      }
      query.date = date;
    } else if (from || to) {
      if (!from || !to) {
        return apiError('from y to son requeridos', 400);
      }
      if (!isValidDateStr(from) || !isValidDateStr(to)) {
        return apiError('Formato de fecha inválido (YYYY-MM-DD)', 400);
      }
      if (from > to) {
        return apiError('from no puede ser mayor que to', 400);
      }
      query.date = { $gte: from, $lte: to };
    } else {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const fromDefault = toDateStr(now);
      const toDt = new Date(now);
      toDt.setDate(toDt.getDate() + 30);
      const toDefault = toDateStr(toDt);
      query.date = { $gte: fromDefault, $lte: toDefault };
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
    if (err.message === 'BILLING_REQUIRED') return apiError('Billing required', 402, 'FORBIDDEN');
    console.error('GET /admin/appointments error', err);
    return apiError('Internal error', 500);
  }
}
