import dbConnect from '@/lib/db';
import { getCurrentBusiness } from '@/lib/currentBusiness';
import BillingClient from './BillingClient';
import { redirect } from 'next/navigation';
import { getEffectiveBillingStatus } from '@/lib/billingEntitlements';
import { getBasicPriceARS } from '@/lib/billingConfig';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Facturación',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

type Props = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function BillingPage(props: Props) {
  await dbConnect();
  const searchParams = await props.searchParams;
  let business;
  try {
    business = await getCurrentBusiness();
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') redirect('/login');
    throw err;
  }

  const statusCode = getEffectiveBillingStatus(business);
  const basicPriceARS = getBasicPriceARS();
  const statusLabel = statusCode === 'active' ? 'Activo' : statusCode === 'trial' ? 'En prueba' : statusCode === 'past_due' || statusCode === 'expired' ? 'Vencido' : statusCode === 'cancelled' ? 'Cancelado' : statusCode || 'Desconocido';
  return (
    <main className="min-h-screen bg-[#f7f5f0] px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-6xl">
        <header className="border-b border-slate-200 pb-7"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-700">Cuenta y acceso</p><h1 className="mt-3 font-serif text-4xl tracking-[-0.04em] text-slate-950 sm:text-5xl">Facturación</h1><p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">Entendé qué plan tenés, hasta cuándo está cubierto y cómo recuperar el acceso sin perder el control de tus pagos.</p></header>
        <div className="mt-8"><BillingClient billingInfo={{ planName: 'Básico', status: statusLabel, statusCode, paidUntil: business.paidUntil ? new Date(business.paidUntil).toISOString() : null, priceARS: basicPriceARS }} returnInfo={{ status: typeof searchParams?.status === 'string' ? searchParams.status : undefined, payment_id: typeof searchParams?.payment_id === 'string' ? searchParams.payment_id : undefined, external_reference: typeof searchParams?.external_reference === 'string' ? searchParams.external_reference : undefined, preference_id: typeof searchParams?.preference_id === 'string' ? searchParams.preference_id : undefined }} /></div>
        <footer className="mt-10 border-t border-slate-200 pt-5 text-center text-xs text-slate-500">Los pagos se procesan con Mercado Pago. FezTime no guarda datos de tarjeta.</footer>
      </div>
    </main>
  );
}
