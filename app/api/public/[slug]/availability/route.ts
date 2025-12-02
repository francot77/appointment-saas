/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getBusinessBySlug } from '@/lib/getBusinessBySlug';
import { Service } from '@/lib/models/Service';
import { ScheduleDay } from '@/lib/models/ScheduleDay';
import { Appointment } from '@/lib/models/Appointment';
import { apiError } from '@/lib/apiError';
import { timeToMinutes, minutesToTime, rangesOverlap } from '@/lib/time';

type Params = { params: Promise<{ slug: string }> };

export async function GET(req: NextRequest, props: Params) {
  const params = await props.params;
  try {
    const { slug } = params;
    const { searchParams } = new URL(req.url);

    const date = searchParams.get('date');
    const serviceId = searchParams.get('serviceId');

    if (!date || !serviceId) {
      return apiError('date y serviceId son obligatorios', 400);
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

    const weekday = new Date(`${date}T00:00:00`).getDay();

    const day = await ScheduleDay.findOne({
      businessId: business._id,
      weekday,
    }).lean();

    if (!day || !day.blocks || day.blocks.length === 0) {
      return NextResponse.json({ slots: [] }, { status: 200 });
    }

    // turnos ocupados (no cancelados)
    const appointments = await Appointment.find({
      businessId: business._id,
      date,
      status: { $nin: ['cancelled', 'rejected'] },
    }).lean();

    const busyRanges = appointments.map((a: any) => ({
      start: timeToMinutes(a.startTime),
      end: timeToMinutes(a.endTime),
    }));

    const slots: { startTime: string; endTime: string }[] = [];

    for (const block of day.blocks as any[]) {
      if (block.enabled === false) continue;

      const blockStart = timeToMinutes(block.start);
      const blockEnd = timeToMinutes(block.end);

      for (
        let start = blockStart;
        start + duration <= blockEnd;
        start += duration
      ) {
        const end = start + duration;

        const overlaps = busyRanges.some(r =>
          rangesOverlap(start, end, r.start, r.end)
        );

        if (!overlaps) {
          slots.push({
            startTime: minutesToTime(start),
            endTime: minutesToTime(end),
          });
        }
      }
    }

    return NextResponse.json(
      {
        date,
        serviceId,
        slots,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('GET /api/public/[slug]/availability error', err);
    return apiError('Internal error', 500);
  }
}
