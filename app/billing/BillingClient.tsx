/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useMemo, useState } from 'react';

type BillingInfo = {
  planName: string;
  status: string;
  paidUntil: string | null; // ISO string desde el server
  billingMode?: 'manual' | 'auto' | null; // opcional, si lo querés usar
};

export default function BillingClient({ billingInfo }: { billingInfo: BillingInfo }) {
  const [manualLoading, setManualLoading] = useState(false);
  const [autoLoading, setAutoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const paidUntilLabel = useMemo(() => {
    if (!billingInfo.paidUntil) return 'Sin pagos registrados';
    const d = new Date(billingInfo.paidUntil);
    return d.toLocaleDateString('es-AR');
  }, [billingInfo.paidUntil]);

  const isActive = billingInfo.status?.toLowerCase().includes('activo');

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

  async function handleAutoSubscribe() {
    setAutoLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/billing/mp/subscription', {
        method: 'POST',
      });

      if (!res.ok) {
        throw new Error('No se pudo iniciar la suscripción automática');
      }

      const data = await res.json();

      if (!data.initPoint) {
        throw new Error('No se recibió el link de suscripción');
      }

      window.location.href = data.initPoint;
    } catch (err: any) {
      setError(err.message || 'Error iniciando la suscripción automática');
      setAutoLoading(false);
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
              Si se vence, el acceso al panel se pausa hasta que vuelva a estar al día.
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

      {/* Dos opciones: pago manual vs suscripción automática */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        {/* Suscripción automática */}
        <div className="flex flex-col rounded-2xl border border-indigo-500/40 bg-indigo-950/40 p-4 shadow-md shadow-black/40 relative overflow-hidden">
          <div className="absolute inset-x-0 -top-10 h-20 bg-gradient-to-b from-indigo-500/20 to-transparent pointer-events-none" />

          <div className="flex items-center justify-between gap-2 mb-2 relative">
            <h3 className="text-sm font-semibold text-slate-50">
              Suscripción automática
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-emerald-100">
              Recomendado
            </span>
          </div>

          <p className="text-[11px] text-slate-200 mb-3 relative">
            Se cobra automáticamente todos los meses con Mercado Pago. Si el
            pago falla o cancelás la suscripción, el acceso se pausa.
          </p>

          <ul className="text-[11px] text-slate-100 space-y-1.5 mb-3 relative">
            <li className="flex items-start gap-2">
              <span className="mt-[3px] text-emerald-300 text-xs">●</span>
              <span>Sin preocuparte por la fecha de vencimiento.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-[3px] text-emerald-300 text-xs">●</span>
              <span>Podés cancelar cuando quieras desde tu cuenta de Mercado Pago.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-[3px] text-emerald-300 text-xs">●</span>
              <span>Todo se registra igual en tu panel de pagos.</span>
            </li>
          </ul>

          <button
            onClick={handleAutoSubscribe}
            disabled={autoLoading}
            className="w-full mt-auto inline-flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-medium shadow-md shadow-black/40 disabled:opacity-60 disabled:cursor-not-allowed bg-gradient-to-r from-indigo-500 to-blue-500 text-slate-950 hover:from-indigo-400 hover:to-blue-400 transition-colors"
          >
            {autoLoading && (
              <span className="inline-block h-3 w-3 rounded-full border border-slate-950 border-t-transparent animate-spin" />
            )}
            {autoLoading
              ? 'Abriendo suscripción...'
              : 'Activar cobro automático mensual'}
          </button>

          <p className="text-[10px] text-slate-400 text-center mt-2 relative">
            Vamos a redirigirte a Mercado Pago para autorizar el débito mensual.
          </p>
        </div>
      </div>

      {/* Footer chiquito */}
      <p className="text-[10px] text-slate-500 text-center">
        Toda la facturación se maneja con Mercado Pago. No guardamos datos de tarjeta.
      </p>
    </div>
  );
}
