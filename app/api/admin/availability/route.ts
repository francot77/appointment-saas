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
    const business = await getCurrentBusiness({ requireEntitlement: true });
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
    })
      .select({ startTime: 1, endTime: 1 })
      .lean();

    const bookedRaw = appointments
      .map((a: any) => ({
        start: parseTimeToMinutes(a.startTime),
        end: parseTimeToMinutes(a.endTime),
      }))
      .filter((r) => Number.isFinite(r.start) && Number.isFinite(r.end) && r.start < r.end)
      .sort((a, b) => a.start - b.start);

    const booked: { start: number; end: number }[] = [];
    for (const r of bookedRaw) {
      const prev = booked[booked.length - 1];
      if (!prev || r.start > prev.end) {
        booked.push({ start: r.start, end: r.end });
      } else if (r.end > prev.end) {
        prev.end = r.end;
      }
    }

    const slots: { startTime: string; endTime: string }[] = [];

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const blocks = ((schedule as any).blocks as any[])
      .filter((b) => b && b.enabled !== false)
      .map((b) => ({
        start: parseTimeToMinutes(b.start),
        end: parseTimeToMinutes(b.end),
      }))
      .filter((b) => Number.isFinite(b.start) && Number.isFinite(b.end) && b.start < b.end)
      .sort((a, b) => a.start - b.start);

    let bookedIdx = 0;

    for (const block of blocks) {
      let cursor = block.start;
      const blockEnd = block.end;

      while (cursor + duration <= blockEnd) {
        const slotStart = cursor;
        const slotEnd = cursor + duration;

        if (date === todayStr && slotEnd <= nowMinutes) {
          cursor += duration;
          continue;
        }

        while (bookedIdx < booked.length && booked[bookedIdx].end <= slotStart) {
          bookedIdx++;
        }

        const overlaps =
          bookedIdx < booked.length && booked[bookedIdx].start < slotEnd;

        if (!overlaps) {
          slots.push({
            startTime: minutesToTime(slotStart),
            endTime: minutesToTime(slotEnd),
          });
        }

        cursor += duration;
      }
    }

    return NextResponse.json({ slots }, { status: 200 });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    if (err.message === 'NO_BUSINESS') return apiError('No business', 403);
    if (err.message === 'BILLING_REQUIRED') return apiError('Billing required', 402, 'FORBIDDEN');
    console.error('GET /admin/availability error', err);
    return apiError('Internal error', 500);
  }
}
