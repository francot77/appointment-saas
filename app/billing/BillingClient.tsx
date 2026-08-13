/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useMemo, useState } from 'react';

type BillingInfo = {
  planName: string;
  status: string;
  statusCode: string;
  paidUntil: string | null; // ISO string desde el server
  billingMode?: 'manual' | 'auto' | null; // opcional, si lo querés usar
};

type Payment = {
  id: string;
  status: 'approved' | 'pending' | 'rejected';
  createdAt: string;
  amount: number;
  currency: string;
  providerReference: string;
  paidThrough: string;
};

export default function BillingClient({ billingInfo }: { billingInfo: BillingInfo }) {
  const [manualLoading, setManualLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [reconciling, setReconciling] = useState<string | null>(null);

  async function loadHistory() {
    setHistoryLoading(true);
    try {
      const res = await fetch('/api/billing/history?limit=20');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo cargar el historial');
      setPayments(data.payments || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el historial');
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => { void loadHistory(); }, []);

  async function reconcile(paymentId: string) {
    setReconciling(paymentId);
    setError(null);
    try {
      const res = await fetch('/api/billing/reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo actualizar el pago');
      await loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el pago');
    } finally {
      setReconciling(null);
    }
  }

  const paidUntilLabel = useMemo(() => {
    if (!billingInfo.paidUntil) return 'Sin pagos registrados';
    const d = new Date(billingInfo.paidUntil);
    return d.toLocaleDateString('es-AR');
  }, [billingInfo.paidUntil]);

  const isActive =
    billingInfo.statusCode === 'active' || billingInfo.statusCode === 'trial';

  async function handleManualPay() {
    setManualLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/billing/mp/checkout', {
        method: 'POST',
      });

      if (!res.ok) {
        throw new Error('No se pudo crear el pago único');
      }

      const data = await res.json();

      if (!data.initPoint) {
        throw new Error('No se recibió el link de pago');
      }

      window.location.href = data.initPoint;
    } catch (err: any) {
      setError(err.message || 'Error iniciando el pago único');
      setManualLoading(false);
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5">
      {/* Encabezado general */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 shadow-lg shadow-black/40">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs text-slate-400">Plan actual</p>
            <div className="inline-flex items-center gap-2">
              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] bg-slate-900 border border-slate-700 text-slate-100">
                {billingInfo.planName}
              </span>
              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] bg-slate-900/80 border border-slate-700 text-slate-300">
                Turnos ilimitados · 1 local
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Pagado hasta:{' '}
              <span className="text-slate-100 font-medium">
                {paidUntilLabel}
              </span>
            </p>
          </div>

          <div className="text-right space-y-1">
            <p className="text-[11px] text-slate-400">Estado de la cuenta</p>
            <span
              className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] border ${
                isActive
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200'
                  : 'bg-amber-500/10 border-amber-500/40 text-amber-200'
              }`}
            >
              {billingInfo.status}
            </span>
            <p className="text-[10px] text-slate-500 max-w-[180px] ml-auto">
              {isActive ? 'Tu acceso está activo.' : 'El panel está pausado, pero podés consultar facturación y recuperar el acceso.'}
            </p>
          </div>
        </div>
      </div>

      {/* Error global */}
      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {/* Pago manual */}
        <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-950/80 p-4 shadow-md shadow-black/40">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h3 className="text-sm font-semibold text-slate-100">
              Pago manual cada mes
            </h3>
            <span className="text-[10px] px-2 py-0.5 text-center rounded-full bg-slate-900 border border-slate-700 text-slate-300">
              Vos decidís cuándo pagar
            </span>
          </div>

          <p className="text-[11px] text-slate-400 mb-3">
            Hacés el pago cuando quieras renovar. No se cobra nada solo, vos
            iniciás cada pago desde acá.
          </p>

          <div className="flex items-end justify-between gap-2 mb-3">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold text-slate-100">
                  $10.000
                </span>
                <span className="text-xs text-slate-400">/ mes</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Aproximadamente el valor de un solo turno.
              </p>
            </div>
            <div className="text-[10px] text-slate-500 text-right">
              <p>Facturación en ARS.</p>
              <p>Pagos procesados por Mercado Pago.</p>
            </div>
          </div>

          <button
            onClick={handleManualPay}
            disabled={manualLoading}
            className="w-full mt-auto inline-flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-medium shadow-md shadow-black/40 disabled:opacity-60 disabled:cursor-not-allowed bg-gradient-to-r from-slate-100 to-slate-300 text-slate-900 hover:from-white hover:to-slate-200 transition-colors"
          >
            {manualLoading && (
              <span className="inline-block h-3 w-3 rounded-full border border-slate-900 border-t-transparent animate-spin" />
            )}
            {manualLoading
              ? 'Cargando...'
              : 'Pagar este mes '}
          </button>

          <p className="text-[10px] text-slate-500 text-center mt-2">
            Ideal si preferís revisar cada mes cuándo pagar. No se crea ningún débito automático.
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 shadow-md shadow-black/40">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Historial de pagos</h2>
            <p className="text-[11px] text-slate-400">Referencias seguras para soporte, sin datos de tarjeta.</p>
          </div>
          <button onClick={() => void loadHistory()} className="text-[11px] text-slate-300 underline underline-offset-2">Actualizar</button>
        </div>
        {historyLoading ? <p className="text-xs text-slate-400">Cargando pagos...</p> : payments.length === 0 ? <p className="text-xs text-slate-400">Todavía no hay pagos registrados.</p> : (
          <div className="space-y-2">
            {payments.map((payment) => {
              const label = payment.status === 'approved' ? 'Aprobado' : payment.status === 'pending' ? 'Pendiente' : 'Rechazado/cancelado';
              const color = payment.status === 'approved' ? 'text-emerald-200 border-emerald-500/40' : payment.status === 'pending' ? 'text-amber-200 border-amber-500/40' : 'text-red-200 border-red-500/40';
              return <div key={payment.id} className="rounded-xl border border-slate-800 p-3 text-xs text-slate-300 sm:flex sm:items-center sm:justify-between sm:gap-3">
                <div className="space-y-1"><p className="font-medium text-slate-100">{label} · {payment.amount.toLocaleString('es-AR')} {payment.currency}</p><p className="text-[11px] text-slate-400">{new Date(payment.createdAt).toLocaleDateString('es-AR')} · Ref. {payment.providerReference}</p></div>
                <div className="mt-2 flex items-center gap-3 sm:mt-0"><span className={`rounded-full border px-2 py-0.5 text-[10px] ${color}`}>Pagado hasta {new Date(payment.paidThrough).toLocaleDateString('es-AR')}</span>{payment.status !== 'approved' && <button onClick={() => void reconcile(payment.providerReference)} disabled={reconciling === payment.providerReference} className="text-[11px] text-slate-100 underline underline-offset-2 disabled:opacity-50">{reconciling === payment.providerReference ? 'Verificando...' : 'Verificar pago'}</button>}</div>
              </div>;
            })}
          </div>
        )}
      </section>

      {/* Footer chiquito */}
      <p className="text-[10px] text-slate-500 text-center">
        Toda la facturación se maneja con Mercado Pago. No guardamos datos de tarjeta.
      </p>
    </div>
  );
}
