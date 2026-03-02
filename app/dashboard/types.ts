
export const BRAND_NAME = 'FezTime';
export const BRAND_PRIMARY = '#4F46E5';
export const BRAND_SECONDARY = '#06B6D4';
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
// app/dashboard/types.ts

export type BrandConfig = {
  primary: string;        // botón / nav activo
  secondary: string;      // segundo color para gradientes
  textOnPrimary: string;  // texto sobre botones
  background?: string;    // opcional, color de fondo
};

export const DEFAULT_BRAND: BrandConfig = {
  primary: BRAND_PRIMARY,
  secondary: BRAND_SECONDARY,
  textOnPrimary: '#020617',
  background: '#050816',
};
