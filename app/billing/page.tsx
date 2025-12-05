// app/billing/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import dbConnect from '@/lib/db';
import { getCurrentBusiness } from '@/lib/currentBusiness';
import BillingClient from './BillingClient';

type Props = {
  searchParams?: Promise<{ status?: string }>;
};

export default async function BillingPage(props: Props) {
  await dbConnect();

  const searchParams = await props.searchParams;
  const statusParam = searchParams?.status || null;

  const business: any = await getCurrentBusiness();

  const paidUntil = business.paidUntil ? new Date(business.paidUntil) : null;

  const billingInfo = {
    planName: 'Básico', // después esto puede venir de la DB
    status: business.status as string,
    paidUntil: paidUntil ? paidUntil.toISOString() : null,
  };

  // Banner según status de back_urls
  let statusBanner:
    | { text: string; description?: string; className: string }
    | null = null;

  if (statusParam === 'success') {
    statusBanner = {
      text: 'Pago recibido',
      description:
        'Tu pago fue procesado correctamente. Si aún no ves el cambio en el estado, puede demorar unos segundos.',
      className:
        'bg-emerald-500/10 border border-emerald-500/40 text-emerald-200',
    };
  } else if (statusParam === 'failure') {
    statusBanner = {
      text: 'Pago rechazado o cancelado',
      description:
        'El intento de pago no se completó. Podés intentar de nuevo cuando quieras.',
      className:
        'bg-red-500/10 border border-red-500/40 text-red-200',
    };
  } else if (statusParam === 'pending') {
    statusBanner = {
      text: 'Pago pendiente',
      description:
        'Tu pago está pendiente de confirmación. Te avisamos cuando se acredite.',
      className:
        'bg-amber-500/10 border border-amber-500/40 text-amber-200',
    };
  }

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

        {/* Banner de resultado de pago */}
        {statusBanner && (
          <div
            className={`rounded-xl px-3 py-2 text-xs ${statusBanner.className}`}
          >
            <p className="font-semibold">{statusBanner.text}</p>
            {statusBanner.description && (
              <p className="mt-0.5 text-[11px]">
                {statusBanner.description}
              </p>
            )}
          </div>
        )}

        {/* Card principal de billing */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <BillingClient billingInfo={billingInfo} />
        </section>
      </div>
    </main>
  );
}
