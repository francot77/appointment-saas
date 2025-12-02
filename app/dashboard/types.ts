
export const BRAND_NAME = 'TurnoFlow'; // o el nombre que quieras
export const BRAND_PRIMARY = '#6366F1'; // indigo
export const BRAND_SECONDARY = '#22C55E'; // verde de acento
export const PINK = '#e87dad';

export type AdminAppointment = {
  id: string;
  clientName: string;
  clientPhone: string;
  serviceId: string;
  serviceName: string;
  serviceColor: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'request' | 'confirmed' | 'cancelled' | 'rejected';
  notes: string;
  reminderSent?: boolean;
  lastReminderAt?: string | null;
};

export type AdminService = {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
  color: string;
  active: boolean;
};

export type ScheduleBlock = {
  start: string;
  end: string;
};

export type ScheduleDayType = {
  weekday: number;
  blocks: ScheduleBlock[];
};
