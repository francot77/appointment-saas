// app/billing/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import dbConnect from '@/lib/db';
import { getCurrentBusiness } from '@/lib/currentBusiness';
import BillingClient from './BillingClient';

export default async function BillingPage() {
  await dbConnect();

  const business: any = await getCurrentBusiness();

  const paidUntil = business.paidUntil ? new Date(business.paidUntil) : null;

  const billingInfo = {
    planName: 'Básico', // si después tenés tiers, esto viene de la DB
    status: business.status as string,
    paidUntil: paidUntil ? paidUntil.toISOString() : null,
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex justify-center px-4 py-6">
      <div className="w-full max-w-5xl space-y-4">
        {/* Header de sección */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">
              Facturación y plan
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Revisá tu plan actual y gestioná el pago mensual desde acá.
            </p>
          </div>
        </header>

        {/* Card principal de billing */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <BillingClient billingInfo={billingInfo} />
        </section>
      </div>
    </main>
  );
}
