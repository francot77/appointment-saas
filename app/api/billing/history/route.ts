import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getCurrentBusiness } from '@/lib/currentBusiness';
import { Payment } from '@/lib/models/Payments';
import { apiError } from '@/lib/apiError';
import { toBillingPaymentDTO } from '@/lib/billingReconciliation';

const MAX_LIMIT = 50;

export async function GET(req: NextRequest) {
  try {
    const business = await getCurrentBusiness();
    await dbConnect();
    const params = req.nextUrl.searchParams;
    const page = Number(params.get('page') || '1');
    const limit = Number(params.get('limit') || '20');
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
      return apiError('Paginación inválida', 400, 'VALIDATION');
    }
    const [payments, total] = await Promise.all([
      Payment.find({ businessId: business._id }).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit)
        .select({ _id: 1, status: 1, createdAt: 1, amount: 1, currency: 1, mpPaymentId: 1, preferenceId: 1, attemptReference: 1, periodTo: 1 }).lean(),
      Payment.countDocuments({ businessId: business._id }),
    ]);
    return NextResponse.json({ payments: payments.map(toBillingPaymentDTO), page, limit, total, hasMore: page * limit < total });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401, 'UNAUTHORIZED');
    if (error instanceof Error && error.message === 'NO_BUSINESS') return apiError('No business', 403, 'FORBIDDEN');
    console.error('GET /api/billing/history failed', { error: error instanceof Error ? error.name : 'unknown' });
    return apiError('Internal error', 500, 'INTERNAL');
  }
}
