/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getBusinessBySlug } from '@/lib/getBusinessBySlug';
import { Service } from '@/lib/models/Service';
import { ScheduleDay } from '@/lib/models/ScheduleDay';
import { Appointment } from '@/lib/models/Appointment';
import { apiError } from '@/lib/apiError';
import {
  timeToMinutes,
  minutesToTime,
  rangesOverlap,
} from '@/lib/time';

type Params = { params: Promise<{ slug: string }> };

export async function POST(req: NextRequest, props: Params) {
  const params = await props.params;
  try {
    const { slug } = params;
    const {
      clientName,
      clientPhone,
      serviceId,
      date,
      startTime,
      notes,
    } = await req.json();

    if (!clientName || !clientPhone || !serviceId || !date || !startTime) {
      return apiError('Datos incompletos', 400);
    }

    const business = await getBusinessBySlug(slug);
    if (!business) return apiError('Negocio no encontrado', 404);

    await dbConnect();

    const service = await Service.findOne({
      _id: serviceId,
      businessId: business._id,
      active: true,
    }).lean();

    if (!service) return apiError('Servicio no válido', 400);

    const duration = service.durationMinutes as number;
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = startMinutes + duration;
    const endTime = minutesToTime(endMinutes);

    // validamos que entra en algún bloque
    const weekday = new Date(`${date}T00:00:00`).getDay();
    const day = await ScheduleDay.findOne({
      businessId: business._id,
      weekday,
    }).lean();

    if (!day || !day.blocks || day.blocks.length === 0) {
      return apiError('Ese día está cerrado', 400);
    }

    const blockOk = (day.blocks as any[]).some(b => {
      if (b.enabled === false) return false;
      const bStart = timeToMinutes(b.start);
      const bEnd = timeToMinutes(b.end);
      return startMinutes >= bStart && endMinutes <= bEnd;
    });

    if (!blockOk) {
      return apiError('Horario fuera del rango de atención', 400);
    }

    // validamos solapamiento
    const appointments = await Appointment.find({
      businessId: business._id,
      date,
      status: { $nin: ['cancelled', 'rejected'] },
    }).lean();

    const overlaps = appointments.some((a: any) =>
      rangesOverlap(
        startMinutes,
        endMinutes,
        timeToMinutes(a.startTime),
        timeToMinutes(a.endTime)
      )
    );

    if (overlaps) {
      return apiError('Ese horario ya no está disponible', 400);
    }

    const appt = await Appointment.create({
      businessId: business._id,
      clientName,
      clientPhone,
      serviceId: service._id,
      date,
      startTime,
      endTime,
      status: 'request',
      notes: notes || '',
    });

    return NextResponse.json({ appointment: appt }, { status: 201 });
  } catch (err) {
    console.error('POST /api/public/[slug]/appointments error', err);
    return apiError('Internal error', 500);
  }
}
