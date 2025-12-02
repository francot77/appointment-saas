// app/api/admin/availability/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getCurrentBusiness } from '@/lib/currentBusiness';
import { apiError } from '@/lib/apiError';
import { Service } from '@/lib/models/Service';
import { Appointment } from '@/lib/models/Appointment';
import { ScheduleDay } from '@/lib/models/ScheduleDay';

function parseTimeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return NaN;
  return h * 60 + m;
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export async function GET(req: NextRequest) {
  try {
    const business = await getCurrentBusiness();
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || '';
    const serviceId = searchParams.get('serviceId') || '';

    if (!date || !serviceId) {
      return apiError('date y serviceId son requeridos', 400);
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return apiError('Formato de fecha inválido (YYYY-MM-DD)', 400);
    }

    const d = new Date(date + 'T00:00:00');
    if (Number.isNaN(d.getTime())) {
      return apiError('Fecha inválida', 400);
    }
    const weekday = d.getDay(); // 0..6

    const service = await Service.findOne({
      _id: serviceId,
      businessId: business._id,
    }).lean();

    if (!service) {
      return apiError('Servicio no encontrado', 404);
    }

    const duration = service.durationMinutes || 60;

    const schedule = await ScheduleDay.findOne({
      businessId: business._id,
      weekday,
    }).lean();

    if (!schedule || !Array.isArray((schedule as any).blocks)) {
      return NextResponse.json({ slots: [] }, { status: 200 });
    }

    const appointments = await Appointment.find({
      businessId: business._id,
      date,
      status: { $in: ['request', 'confirmed'] },
    }).lean();

    const booked = appointments.map((a: any) => ({
      start: parseTimeToMinutes(a.startTime),
      end: parseTimeToMinutes(a.endTime),
    }));

    const slots: { startTime: string; endTime: string }[] = [];

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    for (const block of (schedule as any).blocks) {
      if (block.enabled === false) continue;
      const blockStart = parseTimeToMinutes(block.start);
      const blockEnd = parseTimeToMinutes(block.end);
      if (Number.isNaN(blockStart) || Number.isNaN(blockEnd)) continue;

      let cursor = blockStart;

      while (cursor + duration <= blockEnd) {
        const slotStart = cursor;
        const slotEnd = cursor + duration;

        // si es hoy, no ofrecer turnos que ya pasaron
        if (date === todayStr && slotEnd <= nowMinutes) {
          cursor += duration;
          continue;
        }

        const overlaps = booked.some(
          (b) => slotStart < b.end && slotEnd > b.start
        );

        if (!overlaps) {
          slots.push({
            startTime: minutesToTime(slotStart),
            endTime: minutesToTime(slotEnd),
          });
        }

        cursor += duration; // paso del tamaño de la duración del servicio
      }
    }

    return NextResponse.json({ slots }, { status: 200 });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    if (err.message === 'NO_BUSINESS') return apiError('No business', 403);
    console.error('GET /admin/availability error', err);
    return apiError('Internal error', 500);
  }
}
