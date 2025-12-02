// lib/appointments.ts
import { Appointment } from '@/lib/models/Appointment';
import { Service } from '@/lib/models/Service';
import { Settings } from '@/lib/models/Settings';

type CreateAppointmentInput = {
  clientName: string;
  clientPhone: string;
  serviceId: string;
  date: string;        // "YYYY-MM-DD"
  startTime: string;   // "HH:mm"
  notes?: string;
};

// helper para sumar minutos a una hora tipo "HH:mm"
function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(h, m, 0, 0);
  date.setMinutes(date.getMinutes() + minutes);
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Crear solicitud de turno
export async function createAppointmentRequest(input: CreateAppointmentInput) {
  const { clientName, clientPhone, serviceId, date, startTime, notes } = input;

  if (!clientName || !clientPhone || !serviceId || !date || !startTime) {
    throw new Error('MISSING_FIELDS');
  }

  // validación bloques de 30 min
  const [h, m] = startTime.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) {
    throw new Error('INVALID_TIME');
  }
  if (m % 30 !== 0) {
    throw new Error('INVALID_SLOT');
  }

  const service = await Service.findById(serviceId);
  if (!service) {
    throw new Error('SERVICE_NOT_FOUND');
  }

  const endTime = addMinutes(startTime, service.durationMinutes);

  // Ver si se pisa con otro turno
  const overlapping = await Appointment.findOne({
    date,
    status: { $nin: ['cancelled', 'rejected'] },
    $or: [
      {
        startTime: { $lt: endTime },
        endTime: { $gt: startTime },
      },
    ],
  });

  if (overlapping) {
    throw new Error('TIME_UNAVAILABLE');
  }

  const appointment = await Appointment.create({
    clientName,
    clientPhone,
    serviceId,
    date,
    startTime,
    endTime,
    status: 'request',
    notes,
  });

  return { appointment, service };
}

// Calcular horarios disponibles por día/servicio
export async function getAvailability(date: string, serviceId: string) {
  if (!date || !serviceId) {
    throw new Error('MISSING_FIELDS');
  }

  const service = await Service.findById(serviceId);
  if (!service) {
    throw new Error('SERVICE_NOT_FOUND');
  }

  let settings = await Settings.findOne({ owner: 'hermana' });

  // si no hay settings, crear con defaults
  if (!settings) {
    settings = await Settings.create({
      owner: 'hermana',
      workDays: [1, 2, 3, 4, 5, 6], // lun-sáb
      workHours: { start: '09:00', end: '19:00' },
      slotSizeMinutes: 30,
    });
  }

  const workStart = timeToMinutes(settings.workHours.start); // ej 9:00
  const workEnd = timeToMinutes(settings.workHours.end);     // ej 19:00
  const slotSize = settings.slotSizeMinutes || 30;
  const duration = service.durationMinutes;

  const appointments = await Appointment.find({
    date,
    status: { $nin: ['cancelled', 'rejected'] },
  });

  const busy = appointments.map((a) => ({
    start: timeToMinutes(a.startTime),
    end: timeToMinutes(a.endTime),
  }));

  function overlaps(start: number, end: number) {
    return busy.some((b) => b.start < end && b.end > start);
  }

  const slots: { startTime: string; endTime: string }[] = [];

  for (let start = workStart; start + duration <= workEnd; start += slotSize) {
    const end = start + duration;
    if (!overlaps(start, end)) {
      slots.push({
        startTime: minutesToTime(start),
        endTime: minutesToTime(end),
      });
    }
  }

  return slots;
}
