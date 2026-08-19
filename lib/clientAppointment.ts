import crypto from 'node:crypto';

export const CLIENT_TOKEN_TTL_DAYS = 30;

export function createClientToken() {
  return crypto.randomBytes(32).toString('base64url');
}

export function clientTokenExpiry(now = new Date()) {
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + CLIENT_TOKEN_TTL_DAYS);
  return expiresAt;
}

export function toPublicAppointmentDto({ appointment, businessSlug, service }: {
  appointment: {
    _id: unknown;
    date: string;
    startTime: string;
    endTime: string;
    status: string;
    clientToken?: string | null;
    clientTokenExpiresAt?: Date | null;
  };
  businessSlug: string;
  service?: { name?: string; durationMinutes?: number } | null;
}) {
  const token = appointment.clientToken || undefined;
  return {
    appointment: {
      id: String(appointment._id),
      reference: String(appointment._id),
      businessSlug,
      date: appointment.date,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      status: appointment.status,
      service: service ? {
        name: service.name || '',
        durationMinutes: service.durationMinutes || 0,
      } : null,
      managementToken: token,
      managementUrl: token ? `/r/${token}` : undefined,
      tokenExpiresAt: appointment.clientTokenExpiresAt?.toISOString(),
    },
  };
}
