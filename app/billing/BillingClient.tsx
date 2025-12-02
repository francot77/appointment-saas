/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';

export default function BillingClient() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      // data.initPoint: URL de MP en sandbox
      window.location.href = data.initPoint;
    } catch (err: any) {
      setError(err.message || 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">
        Costo del plan básico: <span className="font-semibold">$10.000 / mes</span>
      </p>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      <button
        onClick={handlePay}
        disabled={loading}
        className="w-full py-2 rounded-lg bg-slate-900 text-white text-sm font-medium disabled:opacity-60"
      >
        {loading ? 'Redirigiendo a Mercado Pago...' : 'Pagar con Mercado Pago (sandbox)'}
      </button>
    </div>
  );
}
