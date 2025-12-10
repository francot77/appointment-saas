
export const BRAND_NAME = 'TurnoFlow'; // o el nombre que quieras
export const BRAND_PRIMARY = '#282bf7ff'; 
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
// app/dashboard/types.ts

export type BrandConfig = {
  primary: string;        // botón / nav activo
  secondary: string;      // segundo color para gradientes
  textOnPrimary: string;  // texto sobre botones
  background?: string;    // opcional, color de fondo
};

export const DEFAULT_BRAND: BrandConfig = {
  primary: '#3b82f6',      // fallback si no hay settings
  secondary: '#ec4899',
  textOnPrimary: '#020617',
  background: '#050816',
};
