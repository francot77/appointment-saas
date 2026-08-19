// app/api/admin/appointments/[id]/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import crypto from 'crypto';
import { randomUUID } from 'node:crypto';
import { Appointment } from '@/lib/models/Appointment';
import { AppointmentBookingLock } from '@/lib/models/AppointmentBookingLock';
import { Service } from '@/lib/models/Service';
import { ScheduleDay } from '@/lib/models/ScheduleDay';
import { getCurrentBusiness } from '@/lib/currentBusiness';
import { apiError } from '@/lib/apiError';
import { date as validateDate, time as validateTime } from '@/lib/validation';
import { MessageJob } from '@/lib/models/MessageJob';
import { integrateAppointmentMessaging } from '@/lib/messaging/appointmentLifecycle';
import { loadMessagingSettings } from '@/lib/messaging/connection';

type Params = { params: Promise<{ id: string }> };

function buildWhatsAppUrl(phoneRaw: string, text: string) {
  // sacamos todo lo que no sean dígitos
  const phone = phoneRaw.replace(/\D/g, '');
  if (!phone) return null;

  const encodedText = encodeURIComponent(text);
  return `https://wa.me/${phone}?text=${encodedText}`;
}

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

function isTransactionUnavailable(err: any) {
  return err?.code === 20
    || err?.code === 24
    || err?.code === 50
    || err?.code === 112
    || err?.code === 251
    || err?.message?.includes('Transaction numbers are only allowed');
}

export async function GET(_req: NextRequest, props: Params) {
  const params = await props.params;

  try {
    const business = await getCurrentBusiness({ requireEntitlement: true });
    await dbConnect();

    const appt = await Appointment.findOne({
      _id: params.id,
      businessId: business._id,
    }).lean();

    if (!appt) {
      return apiError('Turno no encontrado', 404);
    }

    const service = await Service.findOne({
      _id: appt.serviceId,
      businessId: business._id,
    }).lean();

    const appointment = {
      id: String(appt._id),
      clientName: appt.clientName,
      clientPhone: appt.clientPhone,
      serviceId: String(appt.serviceId),
      serviceName: service?.name || 'Servicio',
      serviceColor: service?.color || '#64748b',
      date: appt.date,
      startTime: appt.startTime,
      endTime: appt.endTime,
      status: appt.status,
      notes: appt.notes || '',
      reminderSent: appt.reminderSent ?? false,
      lastReminderAt: appt.lastReminderAt?.toISOString() ?? null,
    };

    return NextResponse.json({ appointment }, { status: 200 });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    if (err.message === 'NO_BUSINESS') return apiError('No business', 403);
    if (err.message === 'BILLING_REQUIRED') return apiError('Billing required', 402, 'FORBIDDEN');
    console.error('GET /admin/appointments/[id] error', err);
    return apiError('Internal error', 500);
  }
}

export async function PATCH(req: NextRequest, props: Params) {
  const params = await props.params;

  try {
    const business = await getCurrentBusiness({ requireEntitlement: true });
    await dbConnect();

    const { id } = params;
    const body = await req.json();
    const { action } = body || {};

    if (!action) {
      return apiError('action es requerido', 400);
    }

    const appt = await Appointment.findOne({
      _id: id,
      businessId: business._id,
    }).lean();

    if (!appt) {
      return apiError('Turno no encontrado', 404);
    }

    const service = await Service.findOne({
      _id: appt.serviceId,
      businessId: business._id,
    }).lean();

    const clientName = appt.clientName;
    const date = appt.date;
    const time = appt.startTime;
    const serviceName = service?.name || 'tu turno';

    let newStatus = appt.status;
    let waMessage: string | null = null;
    let reminderSent = appt.reminderSent ?? false;
    const update: any = {};
    let updatedAppointment: any = null;
    let expectedStatus: string | null = null;

    // ---------- CONFIRM / REJECT / REMIND ----------
    if (action === 'confirm') {
      if (appt.status !== 'request') {
        return apiError('Solo se pueden confirmar solicitudes pendientes', 409);
      }
      expectedStatus = 'request';
      newStatus = 'confirmed';
      update.status = newStatus;
      update.$inc = { messagingVersion: 1 };

      // 🔑 Generar o reutilizar token del cliente
      let clientToken = appt.clientToken as string | undefined;

      // si no tenía token, lo creamos
      if (!clientToken) {
        clientToken = crypto.randomBytes(24).toString('base64url');
        update.clientToken = clientToken;

        // opcional: vencimiento del link, por ejemplo +30 días
        const expires = new Date();
        expires.setDate(expires.getDate() + 30);
        update.clientTokenExpiresAt = expires;
      }

      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

      const magicLink = `${appUrl}/r/${clientToken}`;

      // 📲 Mensaje de confirmación con bloque destacado para el link
      waMessage =
        `Hola ${clientName}! ` +
        `Te confirmamos tu turno para ${serviceName} el día ${date} a las ${time}.` +
        `\n\n*🔁 Reprogramar o cancelar tu turno*\n` +
        `${magicLink}\n\n` +
        `Guardá este link, es único para este turno.`;
    } else if (action === 'reject') {
      if (appt.status !== 'request') {
        return apiError('Solo se pueden rechazar solicitudes pendientes', 409);
      }
      expectedStatus = 'request';
      newStatus = 'rejected';
      update.status = newStatus;

      waMessage =
        `Hola ${clientName}, lamentablemente no podemos tomar tu turno para ${serviceName} ` +
        `el ${date} a las ${time}. Si querés, podés pedir otro horario desde el link de turnos.`;
    } else if (action === 'cancel') {
      if (appt.status !== 'confirmed') {
        return apiError('Solo se pueden cancelar turnos confirmados', 409);
      }

      expectedStatus = 'confirmed';
      newStatus = 'cancelled';
      update.status = newStatus;
      update.$inc = { messagingVersion: 1 };
      waMessage =
        `Hola ${clientName}, cancelamos tu turno para ${serviceName} ` +
        `el ${date} a las ${time}. Si querés, podés pedir otro horario desde el link de turnos.`;
    } else if (action === 'remind') {
      if (!['request', 'confirmed'].includes(appt.status)) {
        return apiError('Solo se pueden recordar turnos pendientes o confirmados', 409);
      }
      expectedStatus = appt.status;
      reminderSent = true;
      update.reminderSent = true;
      update.lastReminderAt = new Date();

      waMessage =
        `Hola ${clientName}! ` +
        `Te recordamos tu turno para ${serviceName} el ${date} a las ${time}. ` +
        `Si no podés venir, avisá así liberamos el horario.`;
    }

    // ---------- RESCHEDULE ----------
    else if (action === 'reschedule') {
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
      if (!dateResult.ok) return apiError(dateResult.error, 400);
      const timeResult = validateTime(newStartTime, 'newStartTime');
      if (!timeResult.ok) return apiError(timeResult.error, 400);

      const duration =
        (service && service.durationMinutes) ? service.durationMinutes : 60;

      const startMins = parseTimeToMinutes(newStartTime);
      if (Number.isNaN(startMins)) {
        return apiError('Hora inválida', 400);
      }
      const endMins = startMins + duration;
      if (endMins > 24 * 60) {
        return apiError('El turno excede el límite del día', 400);
      }
      const newEndTime = minutesToTime(endMins);

      const lockKey = `${String(business._id)}:${newDate}`;
      const lockToken = randomUUID();
      const connection = await dbConnect();
      const session = await connection.startSession();
      let earlyResponse: NextResponse | null = null;

      try {
        updatedAppointment = await session.withTransaction(async () => {
          await AppointmentBookingLock.updateOne(
            { key: lockKey },
            { $set: { token: lockToken, expiresAt: null }, $setOnInsert: { key: lockKey } },
            { upsert: true, session }
          );

          const current = await Appointment.findOne({
            _id: id,
            businessId: business._id,
          }).session(session).lean();

          const releaseLock = () => AppointmentBookingLock.deleteOne(
            { key: lockKey, token: lockToken },
            { session }
          );

          if (!current) {
            await releaseLock();
            earlyResponse = apiError('Turno no encontrado', 404);
            return null;
          }

          if (!['request', 'confirmed'].includes(current.status)) {
            await releaseLock();
            earlyResponse = apiError('Solo se pueden reprogramar turnos pendientes o confirmados', 409);
            return null;
          }

          const weekday = new Date(`${newDate}T00:00:00Z`).getUTCDay();
          const schedule = await ScheduleDay.findOne({
            businessId: business._id,
            weekday,
          }).session(session).lean();
          const enabledBlock = (schedule?.blocks || []).some((block: any) => {
            if (block.enabled === false) return false;
            const blockStart = parseTimeToMinutes(block.start);
            const blockEnd = parseTimeToMinutes(block.end);
            return Number.isFinite(blockStart) && Number.isFinite(blockEnd)
              && blockStart < blockEnd
              && startMins >= blockStart
              && endMins <= blockEnd;
          });

          if (!enabledBlock) {
            await releaseLock();
            earlyResponse = apiError('El horario elegido está fuera de los bloques habilitados', 409);
            return null;
          }

          const sameDay = await Appointment.find({
            businessId: business._id,
            date: newDate,
            status: { $in: ['request', 'confirmed'] },
          }).session(session).lean();

          const overlaps = sameDay.some((other: any) => {
            if (String(other._id) === String(current._id)) return false;
            const oStart = parseTimeToMinutes(other.startTime);
            const oEnd = parseTimeToMinutes(other.endTime);
            if (Number.isNaN(oStart) || Number.isNaN(oEnd)) return false;
            return startMins < oEnd && endMins > oStart;
          });

          if (overlaps) {
            await releaseLock();
            earlyResponse = apiError('Ese horario ya está ocupado', 409);
            return null;
          }

          const result = await Appointment.findOneAndUpdate(
            { _id: id, businessId: business._id, status: { $in: ['request', 'confirmed'] } },
            { $set: { date: newDate, startTime: newStartTime, endTime: newEndTime }, $inc: { messagingVersion: 1 } },
            { new: true, session }
          ).lean();

          if (result) {
            await integrateAppointmentMessaging({
              ...await loadMessagingSettings(String(business._id)),
              messageJobModel: MessageJob,
              session,
              businessId: String(business._id),
              appointmentId: String(result._id),
              messagingVersion: typeof result.messagingVersion === 'number' ? result.messagingVersion : 1,
              recipient: result.clientPhone,
              startAt: new Date(`${result.date}T${result.startTime}:00`),
              event: 'rescheduled',
            });
          }

          await releaseLock();
          if (!result) {
            earlyResponse = apiError('Solo se pueden reprogramar turnos pendientes o confirmados', 409);
          }
          return result;
        });

        if (earlyResponse) return earlyResponse;
      } catch (error: any) {
        if (error?.code === 11000) {
          return apiError('Hay otra reprogramación en curso para ese día. Intentá nuevamente.', 409, 'CONFLICT');
        }
        if (isTransactionUnavailable(error)) {
          return apiError('La reprogramación no está disponible temporalmente', 503, 'INTERNAL');
        }
        throw error;
      } finally {
        await session.endSession();
      }

      // Podés cambiar el mensaje si querés
      waMessage =
        `Hola ${clientName}! ` +
        `Reprogramamos tu turno para ${serviceName} al día ${newDate} a las ${newStartTime}. ` +
        `Si no podés venir, avisá así liberamos el horario.`;
    } else {
      return apiError('Acción inválida', 400);
    }

    // aplicamos update
    let updated = updatedAppointment;
    if (!updated) {
      const mutationFilter: any = { _id: id, businessId: business._id };
      if (expectedStatus) mutationFilter.status = expectedStatus;
      updated = await Appointment.findOneAndUpdate(
        mutationFilter,
        update,
        { new: true }
      ).lean();
    }

    if (!updated) {
      return apiError('Este turno ya no está disponible para esa acción', 409, 'CONFLICT');
    }

    if (action === 'confirm' || action === 'cancel') {
      await integrateAppointmentMessaging({
        ...await loadMessagingSettings(String(business._id)),
        messageJobModel: MessageJob,
        businessId: String(business._id),
        appointmentId: String(updated._id),
        messagingVersion: typeof updated.messagingVersion === 'number' ? updated.messagingVersion : 1,
        recipient: updated.clientPhone,
        startAt: new Date(`${updated.date}T${updated.startTime}:00`),
        event: action === 'confirm' ? 'confirmed' : 'cancelled',
      });
    }

    const waUrl = waMessage
      ? buildWhatsAppUrl(appt.clientPhone, waMessage)
      : null;

    return NextResponse.json(
      {
        status: updated?.status ?? newStatus,
        date: updated?.date ?? date,
        startTime: updated?.startTime ?? time,
        endTime: updated?.endTime ?? appt.endTime,
        waUrl,
        reminderSent: updated?.reminderSent ?? reminderSent,
      },
      { status: 200 }
    );
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    if (err.message === 'NO_BUSINESS') return apiError('No business', 403);
    if (err.message === 'BILLING_REQUIRED') return apiError('Billing required', 402, 'FORBIDDEN');
    console.error('PATCH /admin/appointments/[id] error', err);
    return apiError('Internal error', 500);
  }
}
