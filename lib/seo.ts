import { getPublicAppUrl } from '@/lib/billingConfig';

export function getSeoBaseUrl() {
  return getPublicAppUrl();
}

export function toSafeAbsoluteUrl(value: unknown, baseUrl: string) {
  if (typeof value !== 'string' || !value.trim()) return null;

  try {
    const url = new URL(value.trim(), baseUrl);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

export function escapeJsonLd(value: unknown) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
