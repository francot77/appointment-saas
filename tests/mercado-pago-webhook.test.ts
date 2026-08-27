import crypto from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { verifySignature } from '@/app/api/billing/mp/webhook/route';

describe('Mercado Pago webhook boundary', () => {
  it('accepts the exact signed manifest and rejects altered or stale signatures', () => {
    const secret = 'webhook-secret';
    const dataId = 'payment-123';
    const requestId = 'request-123';
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const manifest = `id:${dataId};request-id:${requestId};ts:${timestamp};`;
    const signature = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
    const request = new NextRequest(`http://localhost/api/billing/mp/webhook?data.id=${dataId}`, {
      headers: { 'x-signature': `ts=${timestamp},v1=${signature}`, 'x-request-id': requestId },
    });

    expect(verifySignature(request, dataId, secret)).toBe(true);
    expect(verifySignature(request, 'payment-999', secret)).toBe(false);
    expect(verifySignature(request, dataId, 'wrong-secret')).toBe(false);
  });
});
