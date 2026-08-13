import { NextRequest } from 'next/server';
import { apiError } from '@/lib/apiError';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 5;
const MAX_ENTRIES = 10_000;

type Entry = { count: number; resetAt: number };

const entries = new Map<string, Entry>();

function getClientKey(req: NextRequest, scope: string) {
  // Forwarding headers are client-controlled unless the deployment explicitly
  // guarantees that a trusted proxy overwrites them.
  const trustedProxyHeaders = process.env.TRUSTED_PROXY_HEADERS === 'true';
  const forwardedFor = trustedProxyHeaders
    ? req.headers.get('x-forwarded-for')
    : null;
  const clientIp = forwardedFor?.split(',')[0]?.trim() ||
    (trustedProxyHeaders ? req.headers.get('x-real-ip') : null) ||
    'untrusted-client';
  return `${scope}:${clientIp}`;
}

function prune(now: number) {
  for (const [key, entry] of entries) {
    if (entry.resetAt <= now) entries.delete(key);
  }

  while (entries.size >= MAX_ENTRIES) {
    const oldestKey = entries.keys().next().value;
    if (!oldestKey) break;
    entries.delete(oldestKey);
  }
}

export function publicBookingRateLimit(req: NextRequest, scope: string) {
  const now = Date.now();
  const key = getClientKey(req, scope);
  let entry = entries.get(key);

  if (!entry || entry.resetAt <= now) {
    prune(now);
    entry = { count: 0, resetAt: now + WINDOW_MS };
    entries.set(key, entry);
  }

  entry.count += 1;
  if (entry.count <= MAX_REQUESTS) return null;

  const retryAfter = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
  return apiError(
    'Demasiadas solicitudes. Intentá nuevamente más tarde.',
    429,
    'RATE_LIMITED',
    { 'Retry-After': String(retryAfter) }
  );
}
