/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { ScheduleDay } from '@/lib/models/ScheduleDay';

export async function PUT(req: NextRequest, props: { params: Promise<{ weekday: string }> }) {
  const params = await props.params;
  await dbConnect();

  const weekday = parseInt(params.weekday, 10);
  if (Number.isNaN(weekday) || weekday < 0 || weekday > 6) {
    return NextResponse.json(
      { error: 'weekday inválido (0 = domingo ... 6 = sábado)' },
      { status: 400 }
    );
  }

  const body = await req.json();
  const blocks = Array.isArray(body.blocks) ? body.blocks : [];

  const normalizedBlocks = blocks
    .filter((b: any) => b.start && b.end)
    .map((b: any) => ({
      start: b.start,
      end: b.end,
      enabled: true,
    }));

  const doc: any = await ScheduleDay.findOneAndUpdate(
    { weekday },
    { weekday, blocks: normalizedBlocks },
    { upsert: true, new: true }
  ).lean();

  return NextResponse.json(
    {
      weekday: doc.weekday,
      blocks: (doc.blocks || []).map((b: any) => ({
        start: b.start,
        end: b.end,
      })),
    },
    { status: 200 }
  );
}
