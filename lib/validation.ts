import mongoose from 'mongoose';
import { validateSlug } from '@/lib/slug';

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

const invalid = (error: string): ValidationResult<never> => ({ ok: false, error });

export function nonEmptyString(value: unknown, field: string, maxLength: number): ValidationResult<string> {
  if (typeof value !== 'string' || value.trim().length === 0) return invalid(`${field} es requerido`);
  const normalized = value.trim();
  if (normalized.length > maxLength) return invalid(`${field} supera el máximo de ${maxLength} caracteres`);
  return { ok: true, value: normalized };
}

export function optionalString(value: unknown, field: string, maxLength: number): ValidationResult<string | undefined> {
  if (value === undefined || value === null || value === '') return { ok: true, value: undefined };
  return nonEmptyString(value, field, maxLength);
}

export function email(value: unknown, field = 'email'): ValidationResult<string> {
  const result = nonEmptyString(value, field, 254);
  if (!result.ok) return result;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.value)) return invalid(`${field} no tiene un formato válido`);
  return { ok: true, value: result.value.toLowerCase() };
}

export function date(value: unknown, field = 'date'): ValidationResult<string> {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return invalid(`${field} debe tener formato YYYY-MM-DD`);
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) return invalid(`${field} no es válida`);
  return { ok: true, value };
}

export function time(value: unknown, field = 'startTime'): ValidationResult<string> {
  if (typeof value !== 'string' || !/^\d{2}:\d{2}$/.test(value)) return invalid(`${field} debe tener formato HH:mm`);
  const [hours, minutes] = value.split(':').map(Number);
  if (hours > 23 || minutes > 59) return invalid(`${field} no es válida`);
  return { ok: true, value };
}

export function positiveInteger(value: unknown, field: string, max = 1440): ValidationResult<number> {
  const number = typeof value === 'number'
    ? value
    : typeof value === 'string' && value.trim() !== ''
      ? Number(value)
      : NaN;
  if (!Number.isInteger(number) || number <= 0 || number > max) return invalid(`${field} debe ser un entero positivo de hasta ${max}`);
  return { ok: true, value: number };
}

export function nonnegativePrice(value: unknown, field = 'price'): ValidationResult<number> {
  const number = typeof value === 'number'
    ? value
    : typeof value === 'string' && value.trim() !== ''
      ? Number(value)
      : NaN;
  if (!Number.isFinite(number) || number < 0 || number > 1_000_000_000) return invalid(`${field} debe ser un número finito no negativo`);
  return { ok: true, value: number };
}

export function hexColor(value: unknown, field = 'color'): ValidationResult<string | undefined> {
  if (value === undefined || value === null || value === '') return { ok: true, value: undefined };
  if (typeof value !== 'string' || !/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value)) {
    return invalid(`${field} debe ser un color hexadecimal válido (#RGB o #RRGGBB)`);
  }
  return { ok: true, value };
}

export function mongoId(value: unknown, field = 'id'): ValidationResult<string> {
  if (typeof value !== 'string' || !mongoose.isValidObjectId(value)) return invalid(`${field} no es válido`);
  return { ok: true, value };
}

export function slug(value: unknown): ValidationResult<string> {
  const result = validateSlug(value);
  return result.ok ? { ok: true, value: result.slug } : invalid(result.error);
}
