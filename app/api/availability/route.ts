/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { Appointment } from '@/lib/models/Appointment';
import { Service } from '@/lib/models/Service';
import { ScheduleDay } from '@/lib/models/ScheduleDay';
import dbConnect from '@/lib/db';

// horarios default: lo que leí de tu mensaje
// 0 = domingo, 1 = lunes, ... 6 = sábado
const DEFAULT_SCHEDULE = [
  {
    weekday: 1, // lunes
    blocks: [
      { start: '09:00', end: '11:00', enabled: true }, // 9 y 10 si dura 60
      { start: '14:00', end: '19:00', enabled: true },
    ],
  },
  {
    weekday: 2, // martes
    blocks: [
      { start: '09:15', end: '10:15', enabled: true }, // sólo 9:15
      { start: '15:00', end: '19:00', enabled: true },
    ],
  },
  {
    weekday: 3, // miércoles
    blocks: [
      { start: '09:00', end: '11:00', enabled: true },
      { start: '14:00', end: '19:00', enabled: true },
    ],
  },
  {
    weekday: 4, // jueves
    blocks: [
      { start: '09:15', end: '10:15', enabled: true },
      { start: '15:00', end: '19:00', enabled: true },
    ],
  },
  {
    weekday: 5, // viernes
    blocks: [
      { start: '08:00', end: '10:00', enabled: true }, // 8 y 9
      { start: '14:00', end: '19:00', enabled: true },
    ],
  },
  // 0 (domingo) y 6 (sábado) quedan sin bloques = cerrado
];

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export async function GET(req: NextRequest) {
  await dbConnect();

  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');
  const serviceId = searchParams.get('serviceId');
  const BOOKING_OPEN_FROM = '2026-01-01'; // hardcode, sin env
  if (date && date < BOOKING_OPEN_FROM) {
    return NextResponse.json(
      { error: `Los turnos se toman a partir del ${BOOKING_OPEN_FROM}.` },
      { status: 400 }
    );
  }
  if (!date || !serviceId) {
    return NextResponse.json(
      { error: 'Faltan parámetros date o serviceId' },
      { status: 400 }
    );
  }

  const service: any = await Service.findById(serviceId).lean();
  if (!service) {
    return NextResponse.json(
      { error: 'Servicio no encontrado' },
      { status: 404 }
    );
  }

  const duration = Number(service.durationMinutes) || 60;

  const d = new Date(date + 'T00:00:00');
  if (isNaN(d.getTime())) {
    return NextResponse.json(
      { error: 'Fecha inválida' },
      { status: 400 }
    );
  }

  const dow = d.getDay(); // 0-6

  // --- leer horario del día desde la DB, con seed automático ---

  // si la colección está vacía, seedear horarios por defecto
  const existingCount = await ScheduleDay.countDocuments();
  if (existingCount === 0) {
    await ScheduleDay.insertMany(DEFAULT_SCHEDULE);
  }

  const scheduleDoc: any = await ScheduleDay.findOne({
    weekday: dow,
  }).lean();

  if (!scheduleDoc || !scheduleDoc.blocks || scheduleDoc.blocks.length === 0) {
    // sin bloques = cerrado
    return NextResponse.json({ slots: [] }, { status: 200 });
  }

  const activeBlocks = (scheduleDoc.blocks as any[]).filter(
    (b) => b.enabled !== false
  );

  if (activeBlocks.length === 0) {
    return NextResponse.json({ slots: [] }, { status: 200 });
  }

  // --- buscar turnos ya existentes para bloquear ---
  const existing = await Appointment.find({
    date,
    status: { $in: ['request', 'confirmed'] },
  }).lean();

  const busy = existing.map((a: any) => ({
    start: timeToMinutes(a.startTime),
    end: timeToMinutes(a.endTime),
  }));

  const slots: { startTime: string; endTime: string }[] = [];

  for (const block of activeBlocks) {
    const blockStart = timeToMinutes(block.start);
    const blockEnd = timeToMinutes(block.end);

    // generamos slots consecutivos usando la duración del servicio
    for (
      let start = blockStart;
      start + duration <= blockEnd;
      start += duration
    ) {
      const end = start + duration;

      const overlaps = busy.some(
        (b) => !(end <= b.start || start >= b.end)
      );

      if (!overlaps) {
        slots.push({
          startTime: minutesToTime(start),
          endTime: minutesToTime(end),
        });
      }
    }
  }

  return NextResponse.json({ slots }, { status: 200 });
}
