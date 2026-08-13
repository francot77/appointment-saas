/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getBusinessBySlug } from '@/lib/getBusinessBySlug';
import { Service } from '@/lib/models/Service';
import { ScheduleDay } from '@/lib/models/ScheduleDay';
import { Appointment } from '@/lib/models/Appointment';
import { apiError } from '@/lib/apiError';
import { timeToMinutes, minutesToTime } from '@/lib/time';

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
    })
      .select({ startTime: 1, endTime: 1 })
      .lean();

    const busyRangesRaw = appointments
      .map((a: any) => ({
        start: timeToMinutes(a.startTime),
        end: timeToMinutes(a.endTime),
      }))
      .filter((r) => Number.isFinite(r.start) && Number.isFinite(r.end) && r.start < r.end)
      .sort((a, b) => a.start - b.start);

    const busyRanges: { start: number; end: number }[] = [];
    for (const r of busyRangesRaw) {
      const prev = busyRanges[busyRanges.length - 1];
      if (!prev || r.start > prev.end) {
        busyRanges.push({ start: r.start, end: r.end });
      } else if (r.end > prev.end) {
        prev.end = r.end;
      }
    }

    const slots: { startTime: string; endTime: string }[] = [];

    const blocks = (day.blocks as any[])
      .filter((b) => b && b.enabled !== false)
      .map((b) => ({
        start: timeToMinutes(b.start),
        end: timeToMinutes(b.end),
      }))
      .filter((b) => Number.isFinite(b.start) && Number.isFinite(b.end) && b.start < b.end)
      .sort((a, b) => a.start - b.start);

    let busyIdx = 0;

    for (const block of blocks) {
      const blockStart = block.start;
      const blockEnd = block.end;

      for (let start = blockStart; start + duration <= blockEnd; start += duration) {
        const end = start + duration;

        while (busyIdx < busyRanges.length && busyRanges[busyIdx].end <= start) {
          busyIdx++;
        }

        const overlaps =
          busyIdx < busyRanges.length && busyRanges[busyIdx].start < end;

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
    console.error('GET /api/public/[slug]/availability failed', {
      error: err instanceof Error ? err.name : 'unknown',
    });
    return apiError('Internal error', 500);
  }
}
