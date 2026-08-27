import { beforeEach, describe, expect, it, vi } from 'vitest';

const { dbConnect, appointmentFindOne, appointmentFind, appointmentUpdate, serviceFindOne, scheduleFindOne, lockUpdate, lockDelete, integrate } = vi.hoisted(() => ({
  dbConnect: vi.fn(),
  appointmentFindOne: vi.fn(),
  appointmentFind: vi.fn(),
  appointmentUpdate: vi.fn(),
  serviceFindOne: vi.fn(),
  scheduleFindOne: vi.fn(),
  lockUpdate: vi.fn(),
  lockDelete: vi.fn(),
  integrate: vi.fn(),
}));

vi.mock('@/lib/db', () => ({ default: dbConnect }));
vi.mock('@/lib/models/Appointment', () => ({ Appointment: {
  findOne: appointmentFindOne,
  find: appointmentFind,
  findOneAndUpdate: appointmentUpdate,
} }));
vi.mock('@/lib/models/Service', () => ({ Service: { findOne: serviceFindOne } }));
vi.mock('@/lib/models/Business', () => ({ Business: {} }));
vi.mock('@/lib/models/ScheduleDay', () => ({ ScheduleDay: { findOne: scheduleFindOne } }));
vi.mock('@/lib/models/AppointmentBookingLock', () => ({ AppointmentBookingLock: {
  updateOne: lockUpdate,
  deleteOne: lockDelete,
} }));
vi.mock('@/lib/models/MessageJob', () => ({ MessageJob: {} }));
vi.mock('@/lib/messaging/appointmentLifecycle', () => ({ integrateAppointmentMessaging: integrate }));
vi.mock('@/lib/messaging/connection', () => ({ loadMessagingSettings: vi.fn(async () => ({ enabled: false })) }));

import { PATCH } from '@/app/api/client/appointments/[token]/route';

const businessId = 'business-a';
const appointment = {
  _id: 'appointment-a',
  businessId,
  serviceId: 'service-a',
  clientToken: 'token-a',
  clientTokenExpiresAt: new Date('2099-01-01'),
  date: '2099-01-05',
  startTime: '09:00',
  endTime: '10:00',
  status: 'confirmed',
  clientPhone: '+1',
  messagingVersion: 1,
};

function query<T>(value: T) {
  return { session: vi.fn().mockReturnThis(), lean: vi.fn(async () => value) };
}

function request(body: Record<string, unknown>) {
  return new Request('http://localhost/api/client/appointments/token-a', {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  }) as never;
}

function setup({ appointments = [] as unknown[], blocks = [{ start: '09:00', end: '17:00' }] } = {}) {
  const session = { withTransaction: vi.fn(async (callback: (session: unknown) => unknown) => callback(session)), endSession: vi.fn() };
  dbConnect.mockResolvedValue({ startSession: vi.fn(async () => session) });
  appointmentFindOne.mockReturnValueOnce(query(appointment)).mockReturnValue(query(appointment));
  appointmentFind.mockReturnValue(query(appointments));
  appointmentUpdate.mockReturnValue(query({ ...appointment, date: '2099-01-06', startTime: '09:00', endTime: '10:00' }));
  serviceFindOne.mockReturnValue(query({ _id: 'service-a', durationMinutes: 60 }));
  scheduleFindOne.mockReturnValue(query({ blocks }));
  lockUpdate.mockResolvedValue({});
  lockDelete.mockResolvedValue({});
  integrate.mockResolvedValue({});
}

describe('client magic-link appointment rescheduling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ['2099-02-30', '09:00'],
    ['2099-01-06', '99:99'],
    ['2000-01-01', '09:00'],
  ])('rejects invalid or past date/time %s %s', async (newDate, newStartTime) => {
    setup();
    const response = await PATCH(request({ action: 'reschedule', newDate, newStartTime }), { params: Promise.resolve({ token: 'token-a' }) });
    expect(response.status).toBe(400);
    expect(lockUpdate).not.toHaveBeenCalled();
  });

  it('rejects a valid slot outside enabled schedule blocks', async () => {
    setup({ blocks: [{ start: '10:00', end: '12:00' }] });
    const response = await PATCH(request({ action: 'reschedule', newDate: '2099-01-06', newStartTime: '09:00' }), { params: Promise.resolve({ token: 'token-a' }) });
    expect(response.status).toBe(409);
    expect(appointmentUpdate).not.toHaveBeenCalled();
  });

  it('rejects an overlapping target slot inside the transaction', async () => {
    setup({ appointments: [{ _id: 'other', startTime: '09:30', endTime: '10:30', status: 'confirmed' }] });
    const response = await PATCH(request({ action: 'reschedule', newDate: '2099-01-06', newStartTime: '09:00' }), { params: Promise.resolve({ token: 'token-a' }) });
    expect(response.status).toBe(409);
    expect(appointmentUpdate).not.toHaveBeenCalled();
  });

  it('returns conflict when the booking lock reports a concurrent reschedule', async () => {
    setup();
    lockUpdate.mockRejectedValueOnce({ code: 11000 });
    const response = await PATCH(request({ action: 'reschedule', newDate: '2099-01-06', newStartTime: '09:00' }), { params: Promise.resolve({ token: 'token-a' }) });
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ code: 'CONFLICT' });
  });

  it('keeps the token and tenant in the atomic update predicate', async () => {
    setup();
    await PATCH(request({ action: 'reschedule', newDate: '2099-01-06', newStartTime: '09:00' }), { params: Promise.resolve({ token: 'token-a' }) });
    expect(appointmentUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ _id: 'appointment-a', businessId, clientToken: 'token-a' }),
      expect.anything(),
      expect.objectContaining({ session: expect.anything() }),
    );
  });
});
