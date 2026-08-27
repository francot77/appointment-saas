'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBillingReturnReference, returnReconciliationMessage } from '@/lib/billingReturnRecovery';

type BillingInfo = { planName: string; status: string; statusCode: string; paidUntil: string | null; priceARS: number };
type Payment = { id: string; status: 'approved' | 'pending' | 'rejected'; createdAt: string; amount: number; currency: string; providerReference: string; paidThrough: string; attemptReference?: string; preferenceId?: string; paymentId?: string };
type ReturnInfo = { status?: string; payment_id?: string; external_reference?: string; preference_id?: string };

function billingError(action: 'history' | 'reconcile' | 'checkout') {
  return action === 'history' ? 'No pudimos cargar el historial de pagos. Intentá nuevamente.' : action === 'reconcile' ? 'No pudimos verificar este pago. Intentá nuevamente o contactá soporte con la referencia.' : 'No pudimos iniciar el pago. Intentá nuevamente.';
}

export default function BillingClient({ billingInfo, returnInfo }: { billingInfo: BillingInfo; returnInfo?: ReturnInfo }) {
  const router = useRouter();
  const returnHandled = useRef(false);
  const [manualLoading, setManualLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [reconciling, setReconciling] = useState<string | null>(null);
  const [returnMessage, setReturnMessage] = useState<{ tone: 'success' | 'warning' | 'error'; title: string; text: string } | null>(null);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try { const res = await fetch('/api/billing/history?limit=20'); const data = await res.json(); if (!res.ok) throw new Error(data.error || 'history'); setPayments(data.payments || []); }
    catch (err) { console.error(err); setError(billingError('history')); }
    finally { setHistoryLoading(false); }
  }, []);
  useEffect(() => { void loadHistory(); }, [loadHistory]);

  const reconcile = useCallback(async (reference: { paymentId?: string; attemptReference?: string; preferenceId?: string }, displayReference: string) => {
    setReconciling(displayReference); setError(null);
    try {
      const res = await fetch('/api/billing/reconcile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(reference) });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 404) setReturnMessage(returnReconciliationMessage(undefined, 'pending'));
        else setError(billingError('reconcile'));
        return;
      }
      setReturnMessage(returnReconciliationMessage(undefined, data.payment?.status));
      await loadHistory();
      router.refresh();
    } catch (err) { console.error(err); setError(billingError('reconcile')); }
    finally { setReconciling(null); }
  }, [loadHistory, router]);

  useEffect(() => {
    const found = returnInfo && getBillingReturnReference(returnInfo);
    if (returnHandled.current || !returnInfo?.status && !found) return;
    returnHandled.current = true;
    window.history.replaceState({}, '', '/billing');
    if (!found) {
      setReturnMessage(returnReconciliationMessage(returnInfo?.status));
      return;
    }
    void reconcile(found.kind === 'paymentId' ? { paymentId: found.value } : found.kind === 'attemptReference' ? { attemptReference: found.value } : { preferenceId: found.value }, found.value);
  }, [reconcile, returnInfo]);

  const paidUntilLabel = useMemo(() => billingInfo.paidUntil ? new Date(billingInfo.paidUntil).toLocaleDateString('es-AR') : 'Sin pagos registrados', [billingInfo.paidUntil]);
  const isActive = billingInfo.statusCode === 'active' || billingInfo.statusCode === 'trial';
  const statusDescription = isActive ? 'El panel está disponible.' : billingInfo.statusCode === 'past_due' ? 'El acceso operativo está pausado. Podés recuperar el plan desde acá.' : billingInfo.statusCode === 'expired' ? 'Acceso vencido. Renovalo desde acá para recuperar el panel.' : 'La facturación sigue disponible para revisar o recuperar el acceso.';
  async function handleManualPay() { setManualLoading(true); setError(null); try { const res = await fetch('/api/billing/mp/checkout', { method: 'POST' }); if (!res.ok) throw new Error('checkout'); const data = await res.json(); if (!data.initPoint) throw new Error('missing payment link'); window.location.href = data.initPoint; } catch (err) { console.error(err); setError(billingError('checkout')); setManualLoading(false); } }

  return <div className="space-y-6">
    <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_16px_50px_rgba(15,23,42,0.07)] sm:grid-cols-[1fr_auto] sm:p-8"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Plan actual</p><div className="mt-3 flex flex-wrap items-center gap-3"><h2 className="font-serif text-3xl tracking-[-0.03em]">{billingInfo.planName}</h2><span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-800">Turnos ilimitados · 1 local</span></div><p className="mt-5 text-sm text-slate-600">Pagado hasta <strong className="text-slate-950">{paidUntilLabel}</strong></p></div><div className="rounded-2xl border border-slate-200 bg-[#f7f5f0] p-4 sm:min-w-44 sm:text-right"><p className="text-xs text-slate-500">Estado de la cuenta</p><p className="mt-2 flex items-center gap-2 font-semibold sm:justify-end"><span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${isActive ? 'bg-emerald-600' : 'bg-amber-600'}`} />{billingInfo.status}</p><p className="mt-2 max-w-48 text-xs leading-5 text-slate-600 sm:ml-auto">{statusDescription}</p></div></section>
    {returnMessage && <div role="status" className={`rounded-2xl border px-5 py-4 ${returnMessage.tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : returnMessage.tone === 'warning' ? 'border-amber-200 bg-amber-50 text-amber-950' : 'border-red-200 bg-red-50 text-red-900'}`}><p className="font-semibold">{returnMessage.title}</p><p className="mt-1 text-sm leading-6">{returnMessage.text}</p></div>}
    {error && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm leading-6 text-red-900">{error}<p className="mt-1 text-xs text-red-800/80">No compartas contraseñas, tokens ni datos de tarjeta con soporte.</p></div>}
    <section className="grid gap-6 lg:grid-cols-[1fr_1.2fr]"><div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700">Renovación mensual manual</p><h2 className="mt-3 font-serif text-2xl tracking-[-0.03em]">${billingInfo.priceARS.toLocaleString('es-AR')} <span className="font-sans text-sm font-normal tracking-normal text-slate-500">ARS / mes</span></h2><p className="mt-3 text-sm leading-6 text-slate-600">Pagás un mes por vez cuando necesitás renovar. No es una suscripción recurrente y no hay upgrades automáticos.</p><button onClick={handleManualPay} disabled={manualLoading} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-700 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{manualLoading ? 'Preparando pago...' : 'Pagar un mes'}</button><p className="mt-3 text-center text-xs text-slate-500">Al continuar, te llevamos al sitio seguro de Mercado Pago.</p></div>
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7"><div className="flex items-start justify-between gap-4"><div><h2 className="font-serif text-2xl tracking-[-0.03em]">Historial de pagos</h2><p className="mt-2 text-sm leading-6 text-slate-600">Las referencias ayudan a entender el estado y pedir ayuda, sin datos de tarjeta.</p></div><button onClick={() => void loadHistory()} className="shrink-0 rounded-lg px-2 py-1 text-sm font-medium text-indigo-700 underline-offset-4 hover:underline">Actualizar</button></div>{historyLoading ? <p className="mt-6 text-sm text-slate-500" role="status">Cargando pagos...</p> : payments.length === 0 ? <p className="mt-6 text-sm leading-6 text-slate-600">Todavía no hay pagos registrados.</p> : <div className="mt-6 space-y-3">{payments.map((payment) => { const label = payment.status === 'approved' ? 'Aprobado' : payment.status === 'pending' ? 'Pendiente de Mercado Pago' : 'Rechazado o cancelado'; const tone = payment.status === 'approved' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : payment.status === 'pending' ? 'border-amber-200 bg-amber-50 text-amber-950' : 'border-red-200 bg-red-50 text-red-900'; const reference = payment.attemptReference || payment.paymentId || payment.preferenceId || payment.providerReference; return <div key={payment.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-slate-900">{label} · {payment.amount.toLocaleString('es-AR')} {payment.currency}</p><p className="mt-1 text-xs text-slate-500">{new Date(payment.createdAt).toLocaleDateString('es-AR')} · Referencia {reference}</p></div><span className={`self-start rounded-full border px-3 py-1 text-xs font-medium ${tone}`}>{payment.status === 'approved' ? `Cubre hasta ${new Date(payment.paidThrough).toLocaleDateString('es-AR')}` : 'Procesamiento o confirmación pendiente'}</span></div>{payment.status !== 'approved' && <div className="mt-3 border-t border-slate-100 pt-3"><p className="text-xs leading-5 text-slate-600">Si ya pagaste, verificá este intento una vez. La verificación consulta a Mercado Pago; no habilita acceso por sí sola.</p><button onClick={() => void reconcile(payment.paymentId ? { paymentId: payment.paymentId } : payment.preferenceId ? { preferenceId: payment.preferenceId } : { attemptReference: payment.attemptReference || payment.providerReference }, reference)} disabled={reconciling === reference} className="mt-2 rounded-lg text-sm font-semibold text-indigo-700 disabled:opacity-50">{reconciling === reference ? 'Verificando...' : 'Verificar pago'}</button></div>}</div>; })}</div>}</section></section>
  </div>;
}
