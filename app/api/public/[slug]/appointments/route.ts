/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getBusinessBySlug } from '@/lib/getBusinessBySlug';
import { Service } from '@/lib/models/Service';
import { ScheduleDay } from '@/lib/models/ScheduleDay';
import { Appointment } from '@/lib/models/Appointment';
import { apiError } from '@/lib/apiError';
import {
  date as validateDate,
  mongoId,
  nonEmptyString,
  optionalString,
  slug as validateSlug,
  time as validateTime,
} from '@/lib/validation';
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
    const validSlug = validateSlug(slug);
    if (!validSlug.ok) return apiError(validSlug.error, 400);
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') return apiError('Cuerpo inválido', 400);
    const data = body as Record<string, unknown>;
    const clientName = nonEmptyString(data.clientName, 'clientName', 120);
    const clientPhone = nonEmptyString(data.clientPhone, 'clientPhone', 40);
    const serviceId = mongoId(data.serviceId, 'serviceId');
    const date = validateDate(data.date);
    const startTime = validateTime(data.startTime);
    const notes = optionalString(data.notes, 'notes', 1000);
    if (!clientName.ok) return apiError(clientName.error, 400);
    if (!clientPhone.ok) return apiError(clientPhone.error, 400);
    if (!serviceId.ok) return apiError(serviceId.error, 400);
    if (!date.ok) return apiError(date.error, 400);
    if (!startTime.ok) return apiError(startTime.error, 400);
    if (!notes.ok) return apiError(notes.error, 400);

    const business = await getBusinessBySlug(validSlug.value);
    if (!business) return apiError('Negocio no encontrado', 404);

    await dbConnect();

    const service = await Service.findOne({
      _id: serviceId.value,
      businessId: business._id,
      active: true,
    }).lean();

    if (!service) return apiError('Servicio no válido', 400);

    const duration = service.durationMinutes as number;
    const startMinutes = timeToMinutes(startTime.value);
    const endMinutes = startMinutes + duration;
    const endTime = minutesToTime(endMinutes);

    // validamos que entra en algún bloque
    const weekday = new Date(`${date.value}T00:00:00`).getDay();
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
      date: date.value,
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
      clientName: clientName.value,
      clientPhone: clientPhone.value,
      serviceId: service._id,
      date: date.value,
      startTime: startTime.value,
      endTime,
      status: 'request',
      notes: notes.value || '',
    });

    return NextResponse.json({ appointment: appt }, { status: 201 });
  } catch (err) {
    console.error('POST /api/public/[slug]/appointments error', err);
    return apiError('Internal error', 500);
  }
}
