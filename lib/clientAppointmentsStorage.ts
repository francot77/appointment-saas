export type SavedAppointment = {
  id: string;
  reference: string;
  businessSlug: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  serviceName: string;
  managementToken: string;
  managementUrl: string;
  tokenExpiresAt: string;
};

const STORAGE_KEY = 'feztime.saved-appointments.v1';
const MAX_ENTRIES = 5;

function isSavedAppointment(value: unknown): value is SavedAppointment {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Partial<SavedAppointment>;
  return Boolean(entry.id && entry.businessSlug && entry.managementToken && entry.managementUrl && entry.tokenExpiresAt);
}

function readEntries() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(isSavedAppointment) : [];
  } catch {
    return [];
  }
}

function writeEntries(entries: SavedAppointment[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
    return true;
  } catch {
    return false;
  }
}

export function getSavedAppointments(businessSlug?: string, now = new Date()) {
  const valid = readEntries().filter((entry) => new Date(entry.tokenExpiresAt).getTime() > now.getTime());
  const filtered = businessSlug ? valid.filter((entry) => entry.businessSlug === businessSlug) : valid;
  if (valid.length !== readEntries().length) writeEntries(valid);
  return filtered;
}

export function saveAppointment(entry: SavedAppointment) {
  const entries = readEntries().filter((current) => current.id !== entry.id && current.managementToken !== entry.managementToken);
  return writeEntries([entry, ...entries]);
}

export function removeSavedAppointment(id: string) {
  return writeEntries(readEntries().filter((entry) => entry.id !== id));
}

export function removeSavedAppointmentByToken(token: string) {
  return writeEntries(readEntries().filter((entry) => entry.managementToken !== token));
}
