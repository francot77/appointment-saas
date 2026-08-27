import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getBillingReturnReference, returnReconciliationMessage } from '@/lib/billingReturnRecovery';

const billingClient = readFileSync(resolve(process.cwd(), 'app/billing/BillingClient.tsx'), 'utf8');
const billingPage = readFileSync(resolve(process.cwd(), 'app/billing/page.tsx'), 'utf8');

describe('billing return recovery', () => {
  it('prefers the provider payment id and supports the local fallback references', () => {
    expect(getBillingReturnReference({ payment_id: 'payment-1', external_reference: 'attempt-1', preference_id: 'pref-1' })).toEqual({ kind: 'paymentId', value: 'payment-1' });
    expect(getBillingReturnReference({ external_reference: 'attempt-1' })).toEqual({ kind: 'attemptReference', value: 'attempt-1' });
    expect(getBillingReturnReference({ preference_id: 'pref-1' })).toEqual({ kind: 'preferenceId', value: 'pref-1' });
  });

  it('handles a return once, removes the query, and refreshes authoritative page data', () => {
    expect(billingClient).toContain('const returnHandled = useRef(false);');
    expect(billingClient).toContain('window.history.replaceState({}, \'\', \'/billing\');');
    expect(billingClient).toContain("fetch('/api/billing/reconcile'");
    expect(billingClient).toContain('router.refresh();');
  });

  it('distinguishes approved, provider-pending, and failed returns', () => {
    expect(returnReconciliationMessage(undefined, 'approved').tone).toBe('success');
    expect(returnReconciliationMessage(undefined, 'pending').tone).toBe('warning');
    expect(returnReconciliationMessage('failure').tone).toBe('error');
    expect(billingClient).toContain('Pendiente de Mercado Pago');
    expect(billingClient).toContain('Procesamiento o confirmación pendiente');
    expect(billingClient).toContain("res.status === 404");
    expect(billingClient).toContain("setError(billingError('reconcile'))");
  });

  it('keeps automatic messaging absent from Billing and does not fetch entitlements', () => {
    expect(billingClient).not.toContain('admin/entitlements');
    expect(billingClient).not.toContain('Mensajería automática');
    expect(billingPage).not.toContain('statusBanner');
  });

  it('refreshes paidUntil and account status through the server page after approval', () => {
    expect(billingClient).toContain('await loadHistory();');
    expect(billingClient).toContain('router.refresh();');
    expect(billingPage).toContain('getEffectiveBillingStatus(business)');
    expect(billingPage).toContain('business.paidUntil');
  });
});
