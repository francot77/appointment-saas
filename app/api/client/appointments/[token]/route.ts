// app/api/client/appointments/[token]/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Appointment } from '@/lib/models/Appointment';
import { Service } from '@/lib/models/Service';
import { Business } from '@/lib/models/Business';
import { apiError } from '@/lib/apiError';

type Params = { params: Promise<{ token: string }> };

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

// GET /api/client/appointments/[token]
// Devuelve datos del turno si el token es válido
export async function GET(_req: NextRequest, props: Params) {
  const { token } = await props.params;

  try {
    await dbConnect();

    const appt = await Appointment.findOne({
      clientToken: token,
    }).lean();

    if (!appt) {
      return apiError('Link inválido o turno no encontrado', 404);
    }

    if (appt.clientTokenExpiresAt && appt.clientTokenExpiresAt < new Date()) {
      return apiError('Este link expiró', 410);
    }

    if (['cancelled', 'rejected'].includes(appt.status)) {
      return apiError('Este turno ya no está activo', 410);
    }

    const [service, business] = await Promise.all([
      Service.findOne({ _id: appt.serviceId }).lean(),
      Business.findOne({ _id: appt.businessId }).lean(),
    ]);

    return NextResponse.json(
      {
        id: String(appt._id),
        date: appt.date,
        startTime: appt.startTime,
        endTime: appt.endTime,
        status: appt.status,
        clientName: appt.clientName,
        clientPhone: appt.clientPhone,
        notes: appt.notes || '',
        service: service
          ? {
              id: String(service._id),
              name: service.name,
              durationMinutes: service.durationMinutes || 60,
            }
          : null,
        business: business
          ? {
              id: String(business._id),
              name: business.name,
              slug: business.slug,
              primaryColor: business.primaryColor || '#6366F1',
            }
          : null,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('GET /api/client/appointments/[token] error', err);
    return apiError('Internal error', 500);
  }
}

// PATCH /api/client/appointments/[token]
// action = "cancel" | "reschedule"
export async function PATCH(req: NextRequest, props: Params) {
  const { token } = await props.params;

  try {
    await dbConnect();

    const body = await req.json();
    const { action } = body || {};

    if (!action) {
      return apiError('action es requerido', 400);
    }

    const appt = await Appointment.findOne({
      clientToken: token,
    }).lean();

    if (!appt) {
      return apiError('Link inválido o turno no encontrado', 404);
    }

    if (appt.clientTokenExpiresAt && appt.clientTokenExpiresAt < new Date()) {
      return apiError('Este link expiró', 410);
    }

    if (['cancelled', 'rejected'].includes(appt.status)) {
      return apiError('Este turno ya no está activo', 410);
    }

    const service = await Service.findOne({
      _id: appt.serviceId,
    }).lean();

    const update: any = {};

    if (action === 'cancel') {
      update.status = 'cancelled';
    } else if (action === 'reschedule') {
      const { newDate, newStartTime } = body as {
        newDate?: string;
        newStartTime?: string;
      };

      if (!newDate || !newStartTime) {
        return apiError(
          'newDate y newStartTime son requeridos para reprogramar',
          400
        );
      }

      if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
        return apiError('Formato de fecha inválido (YYYY-MM-DD)', 400);
      }
      if (!/^\d{2}:\d{2}$/.test(newStartTime)) {
        return apiError('Formato de hora inválido (HH:MM)', 400);
      }

      const duration =
        (service && service.durationMinutes) ? service.durationMinutes : 60;

      const startMins = parseTimeToMinutes(newStartTime);
      if (Number.isNaN(startMins)) {
        return apiError('Hora inválida', 400);
      }
      const endMins = startMins + duration;
      const newEndTime = minutesToTime(endMins);

      // Buscar otros turnos de ese día en el mismo negocio que se solapen
      const sameDay = await Appointment.find({
        businessId: appt.businessId,
        date: newDate,
        status: { $in: ['request', 'confirmed'] },
      }).lean();

      const overlaps = sameDay.some((other: any) => {
        if (String(other._id) === String(appt._id)) return false;

        const oStart = parseTimeToMinutes(other.startTime);
        const oEnd = parseTimeToMinutes(other.endTime);
        if (Number.isNaN(oStart) || Number.isNaN(oEnd)) return false;

        return startMins < oEnd && endMins > oStart;
      });

      if (overlaps) {
        return apiError('Ese horario ya está ocupado', 409);
      }

      update.date = newDate;
      update.startTime = newStartTime;
      update.endTime = newEndTime;

      // el status lo dejamos igual (si estaba confirmado, sigue confirmado)
    } else {
      return apiError('Acción inválida', 400);
    }

    const updated = await Appointment.findOneAndUpdate(
      { _id: appt._id },
      update,
      { new: true }
    ).lean();

    return NextResponse.json(
      {
        id: String(updated?._id),
        date: updated?.date,
        startTime: updated?.startTime,
        endTime: updated?.endTime,
        status: updated?.status,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('PATCH /api/client/appointments/[token] error', err);
    return apiError('Internal error', 500);
  }
}
