/* eslint-disable @typescript-eslint/no-explicit-any */
import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getBusinessBySlug } from '@/lib/getBusinessBySlug';
import { Service } from '@/lib/models/Service';
import { ScheduleDay } from '@/lib/models/ScheduleDay';
import { Appointment } from '@/lib/models/Appointment';
import { AppointmentBookingLock } from '@/lib/models/AppointmentBookingLock';
import { apiError } from '@/lib/apiError';
import { publicBookingRateLimit } from '@/lib/publicRateLimit';
import {
  date as validateDate,
  mongoId,
  nonEmptyString,
  optionalString,
  slug as validateSlug,
  time as validateTime,
} from '@/lib/validation';
import {
  timeToMinutes,
  minutesToTime,
  rangesOverlap,
} from '@/lib/time';

type Params = { params: Promise<{ slug: string }> };

export async function POST(req: NextRequest, props: Params) {
  const params = await props.params;
  const rateLimitResponse = publicBookingRateLimit(req, 'public-booking');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { slug } = params;
    const validSlug = validateSlug(slug);
    if (!validSlug.ok) return apiError(validSlug.error, 400);
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') return apiError('Cuerpo inválido', 400);
    const data = body as Record<string, unknown>;
    const clientName = nonEmptyString(data.clientName, 'clientName', 120);
    const clientPhone = nonEmptyString(data.clientPhone, 'clientPhone', 40);
    const serviceId = mongoId(data.serviceId, 'serviceId');
    const date = validateDate(data.date);
    const startTime = validateTime(data.startTime);
    const notes = optionalString(data.notes, 'notes', 1000);
    if (!clientName.ok) return apiError(clientName.error, 400);
    if (!clientPhone.ok) return apiError(clientPhone.error, 400);
    if (!serviceId.ok) return apiError(serviceId.error, 400);
    if (!date.ok) return apiError(date.error, 400);
    if (!startTime.ok) return apiError(startTime.error, 400);
    if (!notes.ok) return apiError(notes.error, 400);

    const business = await getBusinessBySlug(validSlug.value);
    if (!business) return apiError('Negocio no encontrado', 404);

    await dbConnect();

    const service = await Service.findOne({
      _id: serviceId.value,
      businessId: business._id,
      active: true,
    }).lean();

    if (!service) return apiError('Servicio no válido', 400);

    const duration = service.durationMinutes as number;
    const startMinutes = timeToMinutes(startTime.value);
    const endMinutes = startMinutes + duration;
    const endTime = minutesToTime(endMinutes);

    const lockKey = `${String(business._id)}:${date.value}`;
    const lockToken = randomUUID();
    const connection = await dbConnect();
    const session = await connection.startSession();
    try {
      return await session.withTransaction(async () => {
        await AppointmentBookingLock.updateOne(
          { key: lockKey },
          {
            $set: { token: lockToken, expiresAt: null },
            $setOnInsert: { key: lockKey },
          },
          { upsert: true, session }
        );

        // The lock, overlap read, insert, and lock release share one transaction.
        // A competing transaction must wait for this unique-key write to commit.
        const weekday = new Date(`${date.value}T00:00:00`).getDay();
        const day = await ScheduleDay.findOne({
          businessId: business._id,
          weekday,
        }).session(session).lean();

        if (!day || !day.blocks || day.blocks.length === 0) {
          await AppointmentBookingLock.deleteOne({
            key: lockKey,
            token: lockToken,
          }, { session });
          return apiError('Ese día está cerrado', 400);
        }

        const blockOk = (day.blocks as any[]).some(b => {
          if (b.enabled === false) return false;
          const bStart = timeToMinutes(b.start);
          const bEnd = timeToMinutes(b.end);
          return startMinutes >= bStart && endMinutes <= bEnd;
        });

        if (!blockOk) {
          await AppointmentBookingLock.deleteOne({
            key: lockKey,
            token: lockToken,
          }, { session });
          return apiError('Horario fuera del rango de atención', 400);
        }

        const appointments = await Appointment.find({
          businessId: business._id,
          date: date.value,
          status: { $nin: ['cancelled', 'rejected'] },
        }).session(session).lean();

        const overlaps = appointments.some((a: any) =>
          rangesOverlap(
            startMinutes,
            endMinutes,
            timeToMinutes(a.startTime),
            timeToMinutes(a.endTime)
          )
        );

        if (overlaps) {
          await AppointmentBookingLock.deleteOne({
            key: lockKey,
            token: lockToken,
          }, { session });
          return apiError('Ese horario ya no está disponible', 400);
        }

        const [appt] = await Appointment.create([{
          businessId: business._id,
          clientName: clientName.value,
          clientPhone: clientPhone.value,
          serviceId: service._id,
          date: date.value,
          startTime: startTime.value,
          endTime,
          status: 'request',
          notes: notes.value || '',
        }], { session });

        await AppointmentBookingLock.deleteOne({
          key: lockKey,
          token: lockToken,
        }, { session });

        return NextResponse.json({ appointment: appt }, { status: 201 });
      });
    } catch (error: unknown) {
      if ((error as { code?: number }).code === 11000) {
        return apiError('Hay otra reserva en curso para ese día. Intentá nuevamente.', 409);
      }
      const mongoError = error as { code?: number; message?: string };
      if (
        mongoError.code === 20 ||
        mongoError.code === 24 ||
        mongoError.code === 50 ||
        mongoError.code === 112 ||
        mongoError.code === 251 ||
        mongoError.message?.includes('Transaction numbers are only allowed')
      ) {
        return apiError('La reserva no está disponible temporalmente', 503);
      }
      throw error;
    } finally {
      await session.endSession();
    }
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      return apiError('Ese horario ya no está disponible', 409);
    }
    console.error('POST /api/public/[slug]/appointments error', err);
    return apiError('Internal error', 500);
  }
}
