// app/api/admin/schedule/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { ScheduleDay } from '@/lib/models/ScheduleDay';
import { getCurrentBusiness } from '@/lib/currentBusiness';
import { apiError } from '@/lib/apiError';

function isValidTime(t: string) {
  return /^\d{2}:\d{2}$/.test(t);
}

export async function GET() {
  try {
    const business = await getCurrentBusiness();
    await dbConnect();

    const docs = await ScheduleDay.find({
      businessId: business._id,
    }).lean();

    const byWeekday = new Map<number, any>();
    docs.forEach((d: any) => byWeekday.set(d.weekday, d));

    const days = Array.from({ length: 7 }, (_, weekday) => {
      const doc = byWeekday.get(weekday);
      return {
        weekday,
        blocks: (doc?.blocks || []).map((b: any) => ({
          start: b.start,
          end: b.end,
          enabled: b.enabled ?? true,
        })),
      };
    });

    return NextResponse.json({ days }, { status: 200 });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    if (err.message === 'NO_BUSINESS') return apiError('No business found', 403);
    console.error('GET /admin/schedule error', err);
    return apiError('Internal error', 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const business = await getCurrentBusiness();
    await dbConnect();

    const { weekday, blocks } = await req.json();

    const w = Number(weekday);
    if (!Number.isInteger(w) || w < 0 || w > 6) {
      return apiError('weekday inválido (0..6)', 400);
    }

    if (!Array.isArray(blocks)) {
      return apiError('blocks debe ser un array', 400);
    }

    const normalized = blocks
      .map((b: any) => ({
        start: String(b.start || '').trim(),
        end: String(b.end || '').trim(),
        enabled: b.enabled !== false,
      }))
      .filter(b => b.start && b.end);

    for (const b of normalized) {
      if (!isValidTime(b.start) || !isValidTime(b.end)) {
        return apiError('Formato de hora inválido (HH:MM)', 400);
      }
      if (b.start >= b.end) {
        return apiError('La hora de inicio debe ser menor a la de fin', 400);
      }
    }

    const sorted = [...normalized].sort((a, b) =>
      a.start.localeCompare(b.start)
    );

    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      if (curr.start < prev.end) {
        return apiError('Los bloques no pueden solaparse', 400);
      }
    }

    const doc = await ScheduleDay.findOneAndUpdate(
      { businessId: business._id, weekday: w },
      { weekday: w, businessId: business._id, blocks: sorted },
      { upsert: true, new: true }
    ).lean();

    return NextResponse.json(
      {
        weekday: doc.weekday,
        blocks: (doc.blocks || []).map((b: any) => ({
          start: b.start,
          end: b.end,
          enabled: b.enabled ?? true,
        })),
      },
      { status: 200 }
    );
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    if (err.message === 'NO_BUSINESS') return apiError('No business found', 403);
    console.error('PUT /admin/schedule error', err);
    return apiError('Internal error', 500);
  }
}
