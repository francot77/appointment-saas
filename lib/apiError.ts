// lib/apiError.ts
import { NextResponse } from 'next/server';

export type ApiErrorCode =
  | 'VALIDATION'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
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
