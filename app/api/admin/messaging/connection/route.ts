/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getCurrentBusiness } from '@/lib/currentBusiness';
import { apiError } from '@/lib/apiError';
import { getMessagingKeyring, encryptSecret } from '@/lib/messaging/crypto';
import { redactMessagingConnection } from '@/lib/messaging/connection';
import { MessagingConnection } from '@/lib/models/MessagingConnection';

function response(connection: any) {
  return NextResponse.json({ connection: redactMessagingConnection(connection) });
}

export async function GET() {
  try {
    const business = await getCurrentBusiness({ requireEntitlement: true });
    await dbConnect();
    const connection = await MessagingConnection.findOne({ businessId: business._id }).lean();
    return response(connection ? { ...connection, _id: String(connection._id), businessId: String(connection.businessId) } : {
      _id: '', businessId: String(business._id), provider: 'meta_whatsapp_cloud', phoneNumberId: '', wabaId: '', enabled: false,
      accessTokenEnvelope: null, appSecretEnvelope: null, templates: [], leadTimeMinutes: 60,
    });
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    if (error?.message === 'NO_BUSINESS') return apiError('No business', 403);
    if (error?.message === 'BILLING_REQUIRED') return apiError('Billing required', 402, 'FORBIDDEN');
    return apiError('Internal error', 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const business = await getCurrentBusiness({ requireEntitlement: true });
    const body = await request.json();
    if (!body.phoneNumberId || !body.wabaId || (body.accessToken !== undefined && typeof body.accessToken !== 'string')) {
      return apiError('Invalid messaging connection', 400, 'VALIDATION');
    }
    await dbConnect();
    const update: any = {
      provider: 'meta_whatsapp_cloud', phoneNumberId: String(body.phoneNumberId), wabaId: String(body.wabaId),
      enabled: Boolean(body.enabled), templates: Array.isArray(body.templates) ? body.templates : [],
      leadTimeMinutes: Number.isFinite(body.leadTimeMinutes) ? body.leadTimeMinutes : 60,
    };
    if (body.accessToken) update.accessTokenEnvelope = encryptSecret(body.accessToken, getMessagingKeyring());
    const existing = await MessagingConnection.findOne({ businessId: business._id }).lean();
    if (!existing && !update.accessTokenEnvelope) return apiError('Access token is required', 400, 'VALIDATION');
    const connection = await MessagingConnection.findOneAndUpdate(
      { businessId: business._id }, { $set: update }, { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();
    return response({ ...connection, _id: String(connection._id), businessId: String(connection.businessId) });
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    if (error?.message === 'NO_BUSINESS') return apiError('No business', 403);
    if (error?.message === 'BILLING_REQUIRED') return apiError('Billing required', 402, 'FORBIDDEN');
    return apiError('Internal error', 500);
  }
}
