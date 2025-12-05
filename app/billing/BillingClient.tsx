/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useMemo, useState } from 'react';


type BillingInfo = {
  planName: string;
  status: string;
  paidUntil: string | null; // ISO string desde el server
};

export default function BillingClient({ billingInfo }: { billingInfo: BillingInfo }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const paidUntilLabel = useMemo(() => {
    if (!billingInfo.paidUntil) return 'Sin pagos registrados';
    const d = new Date(billingInfo.paidUntil);
    return d.toLocaleDateString('es-AR');
  }, [billingInfo.paidUntil]);

  async function handlePay() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/billing/mp/checkout', {
        method: 'POST',
      });

      if (!res.ok) {
        throw new Error('No se pudo crear el pago');
      }

      const data = await res.json();

      window.location.href = data.initPoint;
    } catch (err: any) {
      setError(err.message || 'Error inesperado al iniciar el pago');
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Encabezado plan + estado */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-100">
                Plan actual
              </h2>
              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] bg-slate-900 border border-slate-700 text-slate-200">
                {billingInfo.planName}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Gestioná turnos, recordatorios y reprogramaciones desde un solo panel.
            </p>
          </div>

          <div className="text-right text-[10px]">
            <p className="text-slate-400">Estado</p>
            <p className="text-xs font-medium text-emerald-300">
              {billingInfo.status}
            </p>
          </div>
        </div>

        <p className="text-[11px] text-slate-400">
          Pagado hasta:{' '}
          <span className="text-slate-100 font-medium">
            {paidUntilLabel}
          </span>
        </p>
      </div>

      {/* Card del plan */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg shadow-black/60 space-y-4">
        {/* Precio + resumen */}
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-slate-100">
                $10.000
              </span>
              <span className="text-xs text-slate-400">/ mes</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Aproximadamente el valor de un solo turno al mes.
            </p>
          </div>
          <div className="text-right text-[10px] text-slate-500">
            <p>Facturación en ARS.</p>
            <p>Pagos procesados por Mercado Pago.</p>
          </div>
        </div>

        {/* Beneficios */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
          <FeatureItem
            title="Turnos ilimitados"
            desc="Agenda para todo tu negocio, sin límites."
          />
          <FeatureItem
            title="Recordatorios por WhatsApp"
            desc="Mensajes listos para enviar a tus clientes."
          />
          <FeatureItem
            title="Reprogramación con link"
            desc="Cada turno tiene su enlace único."
          />
          <FeatureItem
            title="Panel web incluido"
            desc="Funciona en celular, tablet o PC."
          />
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {error}
          </div>
        )}

        {/* Info MP */}
        <div className="flex items-center justify-between gap-2 text-[10px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center justify-center rounded-full bg-slate-900 px-2 py-0.5 border border-slate-700">
              <span className="text-[9px] font-medium text-slate-100">
                Mercado Pago
              </span>
            </span>
            <span>Te vamos a redirigir a una pasarela segura.</span>
          </div>
          <span className="text-[9px] text-slate-500 text-right">
            Modo prueba (sandbox)
          </span>
        </div>

        {/* Botón */}
        <button
          onClick={handlePay}
          disabled={loading}
          className="w-full mt-1 inline-flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-medium shadow-md shadow-black/40 disabled:opacity-60 disabled:cursor-not-allowed bg-gradient-to-r from-indigo-500 to-blue-500 text-slate-950 hover:from-indigo-400 hover:to-blue-400 transition-colors"
        >
          {loading && (
            <span className="inline-block h-3 w-3 rounded-full border border-slate-950 border-t-transparent animate-spin" />
          )}
          {loading
            ? 'Redirigiendo a Mercado Pago...'
            : 'Pagar el plan con Mercado Pago'}
        </button>

        <p className="text-[10px] text-slate-500 text-center mt-1">
          Al continuar, aceptás los términos del servicio y las condiciones de Mercado Pago.
        </p>
      </div>
    </div>
  );
}

function FeatureItem({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-[3px] text-emerald-400 text-xs">●</span>
      <div>
        <p className="font-medium text-slate-100">{title}</p>
        <p className="text-slate-400 text-[11px]">{desc}</p>
      </div>
    </div>
  );
}
