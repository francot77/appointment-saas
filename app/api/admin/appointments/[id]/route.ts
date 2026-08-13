// app/api/admin/appointments/[id]/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import crypto from 'crypto';
import { Appointment } from '@/lib/models/Appointment';
import { Service } from '@/lib/models/Service';
import { getCurrentBusiness } from '@/lib/currentBusiness';
import { apiError } from '@/lib/apiError';

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

    // ---------- CONFIRM / REJECT / REMIND ----------
        if (action === 'confirm') {
      newStatus = 'confirmed';
      update.status = newStatus;

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
    }
 else if (action === 'reject') {
      newStatus = 'rejected';
      update.status = newStatus;

      waMessage =
        `Hola ${clientName}, lamentablemente no podemos tomar tu turno para ${serviceName} ` +
        `el ${date} a las ${time}. Si querés, podés pedir otro horario desde el link de turnos.`;
    } else if (action === 'remind') {
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

      // Buscar OTROS turnos del mismo día que se solapen, excluyendo este turno
      const sameDay = await Appointment.find({
        businessId: business._id,
        date: newDate,
        status: { $in: ['request', 'confirmed'] },
      }).lean();

      const overlaps = sameDay.some((other: any) => {
        // excluir el propio turno
        if (String(other._id) === String(appt._id)) return false;

        const oStart = parseTimeToMinutes(other.startTime);
        const oEnd = parseTimeToMinutes(other.endTime);
        if (Number.isNaN(oStart) || Number.isNaN(oEnd)) return false;

        // solape clásico: start < otherEnd && end > otherStart
        return startMins < oEnd && endMins > oStart;
      });

      if (overlaps) {
        return apiError('Ese horario ya está ocupado', 409);
      }

      // OK, actualizamos fecha y horarios
      update.date = newDate;
      update.startTime = newStartTime;
      update.endTime = newEndTime;

      // Podés cambiar el mensaje si querés
      waMessage =
        `Hola ${clientName}! ` +
        `Reprogramamos tu turno para ${serviceName} al día ${newDate} a las ${newStartTime}. ` +
        `Si no podés venir, avisá así liberamos el horario.`;
    } else {
      return apiError('Acción inválida', 400);
    }

    // aplicamos update
    const updated = await Appointment.findOneAndUpdate(
      { _id: id, businessId: business._id },
      update,
      { new: true }
    ).lean();

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
