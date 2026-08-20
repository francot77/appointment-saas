// lib/apiError.ts
import { NextResponse } from 'next/server';

export type ApiErrorCode =
  | 'VALIDATION'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'AUTOMATIC_MESSAGING_NOT_ENTITLED'
  | 'AUTOMATIC_MESSAGING_QUOTA_EXCEEDED'
  | 'AUTOMATIC_MESSAGING_DELIVERY_UNKNOWN'
  | 'INTERNAL';

export function apiError(
  message: string,
  status = 400,
  code?: ApiErrorCode,
  headers?: HeadersInit
) {
  const body = code
    ? { error: message, code }
    : { error: message };
  return NextResponse.json(body, { status, headers });
}
