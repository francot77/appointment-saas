// app/api/client/appointments/[token]/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Appointment } from '@/lib/models/Appointment';
import { Service } from '@/lib/models/Service';
import { Business } from '@/lib/models/Business';
import { ScheduleDay } from '@/lib/models/ScheduleDay';
import { AppointmentBookingLock } from '@/lib/models/AppointmentBookingLock';
import { apiError } from '@/lib/apiError';
import { MessageJob } from '@/lib/models/MessageJob';
import { integrateAppointmentMessaging } from '@/lib/messaging/appointmentLifecycle';
import { loadMessagingSettings } from '@/lib/messaging/connection';
import { date as validateDate, time as validateTime } from '@/lib/validation';
import { rangesOverlap, timeToMinutes } from '@/lib/time';

type Params = { params: Promise<{ token: string }> };

function parseTimeToMinutes(t: unknown): number {
  if (typeof t !== 'string' || !/^\d{2}:\d{2}$/.test(t)) return NaN;
  const [h, m] = t.split(':').map(Number);
  return h <= 23 && m <= 59 ? h * 60 + m : NaN;
}

function isTransactionUnavailable(err: any) {
  return err?.code === 20
    || err?.code === 24
    || err?.code === 50
    || err?.code === 112
    || err?.code === 251
    || err?.message?.includes('Transaction numbers are only allowed');
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
        managementToken: token,
        managementUrl: `/r/${token}`,
        tokenExpiresAt: appt.clientTokenExpiresAt?.toISOString(),
         },
      { status: 200 }
    );
  } catch (err) {
    console.error('GET /api/client/appointments/[token] failed', {
      error: err instanceof Error ? err.name : 'unknown',
    });
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
      businessId: appt.businessId,
    }).lean();

    const update: any = {};

    if (action === 'cancel') {
      update.status = 'cancelled';
      update.$inc = { messagingVersion: 1 };
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

      const dateResult = validateDate(newDate, 'newDate');
      if (!dateResult.ok) return apiError(dateResult.error, 400, 'VALIDATION');
      const timeResult = validateTime(newStartTime, 'newStartTime');
      if (!timeResult.ok) return apiError(timeResult.error, 400, 'VALIDATION');

      const today = new Date().toISOString().slice(0, 10);
      if (dateResult.value < today) {
        return apiError('newDate debe ser hoy o una fecha futura', 400, 'VALIDATION');
      }

      const duration =
        (service && service.durationMinutes) ? service.durationMinutes : 60;

      const startMins = timeToMinutes(timeResult.value);
      const endMins = startMins + duration;
      if (endMins > 24 * 60) {
        return apiError('El turno excede el límite del día', 400, 'VALIDATION');
      }
      const newEndTime = minutesToTime(endMins);

      const lockKey = `${String(appt.businessId)}:${dateResult.value}`;
      const currentLockKey = `${String(appt.businessId)}:${appt.date}`;
      const lockKeys = [...new Set([lockKey, currentLockKey])].sort();
      const lockToken = randomUUID();
      const connection = await dbConnect();
      const session = await connection.startSession();
      let earlyResponse: NextResponse | null = null;

      try {
        const updated = await session.withTransaction(async () => {
          for (const key of lockKeys) {
            await AppointmentBookingLock.updateOne(
              { key },
              { $set: { token: lockToken, expiresAt: null }, $setOnInsert: { key } },
              { upsert: true, session },
            );
          }

          const current = await Appointment.findOne({
            _id: appt._id,
            businessId: appt.businessId,
            clientToken: token,
          }).session(session).lean();

          const releaseLocks = () => Promise.all(lockKeys.map((key) =>
            AppointmentBookingLock.deleteOne({ key, token: lockToken }, { session }),
          ));

          if (!current) {
            await releaseLocks();
            earlyResponse = apiError('Link inválido o turno no encontrado', 404);
            return null;
          }
          if (current.clientTokenExpiresAt && current.clientTokenExpiresAt < new Date()) {
            await releaseLocks();
            earlyResponse = apiError('Este link expiró', 410);
            return null;
          }
          if (!['request', 'confirmed'].includes(current.status)) {
            await releaseLocks();
            earlyResponse = apiError('Este turno ya no está activo', 410);
            return null;
          }

          const weekday = new Date(`${dateResult.value}T00:00:00Z`).getUTCDay();
          const schedule = await ScheduleDay.findOne({
            businessId: current.businessId,
            weekday,
          }).session(session).lean();
          const inSchedule = (schedule?.blocks || []).some((block: any) => {
            if (block.enabled === false) return false;
            const blockStart = parseTimeToMinutes(block.start);
            const blockEnd = parseTimeToMinutes(block.end);
            return Number.isFinite(blockStart) && Number.isFinite(blockEnd)
              && blockStart < blockEnd && startMins >= blockStart && endMins <= blockEnd;
          });
          if (!inSchedule) {
            await releaseLocks();
            earlyResponse = apiError('El horario elegido está fuera de los bloques habilitados', 409, 'VALIDATION');
            return null;
          }

          const sameDay = await Appointment.find({
            businessId: current.businessId,
            date: dateResult.value,
            status: { $in: ['request', 'confirmed'] },
          }).session(session).lean();
          const overlaps = sameDay.some((other: any) => {
            if (String(other._id) === String(current._id)) return false;
            return rangesOverlap(
              startMins,
              endMins,
              parseTimeToMinutes(other.startTime),
              parseTimeToMinutes(other.endTime),
            );
          });
          if (overlaps) {
            await releaseLocks();
            earlyResponse = apiError('Ese horario ya está ocupado', 409);
            return null;
          }

          const result = await Appointment.findOneAndUpdate(
            {
              _id: current._id,
              businessId: current.businessId,
              clientToken: token,
              status: { $in: ['request', 'confirmed'] },
            },
            { $set: { date: dateResult.value, startTime: timeResult.value, endTime: newEndTime }, $inc: { messagingVersion: 1 } },
            { new: true, session },
          ).lean();

          if (!result) {
            await releaseLocks();
            earlyResponse = apiError('Este turno ya no está disponible para reprogramar', 409);
            return null;
          }

          await integrateAppointmentMessaging({
            ...await loadMessagingSettings(String(result.businessId)),
            messageJobModel: MessageJob,
            session,
            businessId: String(result.businessId),
            appointmentId: String(result._id),
            messagingVersion: typeof result.messagingVersion === 'number' ? result.messagingVersion : 1,
            recipient: result.clientPhone,
            startAt: new Date(`${result.date}T${result.startTime}:00`),
            event: 'rescheduled',
          });
          await releaseLocks();
          return result;
        });

        if (earlyResponse) return earlyResponse;
        if (!updated) return apiError('Este turno ya no está disponible para reprogramar', 409);

        return NextResponse.json({
          id: String(updated._id),
          date: updated.date,
          startTime: updated.startTime,
          endTime: updated.endTime,
          status: updated.status,
        }, { status: 200 });
      } catch (error: any) {
        if (error?.code === 11000) return apiError('Hay otra reprogramación en curso para ese día. Intentá nuevamente.', 409, 'CONFLICT');
        if (isTransactionUnavailable(error)) return apiError('La reprogramación no está disponible temporalmente', 503, 'INTERNAL');
        throw error;
      } finally {
        await session.endSession();
      }
    } else {
      return apiError('Acción inválida', 400);
    }

    const updated = await Appointment.findOneAndUpdate(
      { _id: appt._id, businessId: appt.businessId, clientToken: token },
      update,
      { new: true }
    ).lean();

    if (updated) {
      await integrateAppointmentMessaging({
        ...await loadMessagingSettings(String(updated.businessId)),
        messageJobModel: MessageJob,
        businessId: String(updated.businessId),
        appointmentId: String(updated._id),
        messagingVersion: typeof updated.messagingVersion === 'number' ? updated.messagingVersion : 1,
        recipient: updated.clientPhone,
        startAt: new Date(`${updated.date}T${updated.startTime}:00`),
        event: action === 'cancel' ? 'cancelled' : 'rescheduled',
      });
    }

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
    console.error('PATCH /api/client/appointments/[token] failed', {
      error: err instanceof Error ? err.name : 'unknown',
    });
    return apiError('Internal error', 500);
  }
}
