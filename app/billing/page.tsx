import dbConnect from '@/lib/db';
import { getCurrentBusiness } from '@/lib/currentBusiness';
import BillingClient from './BillingClient';
import { redirect } from 'next/navigation';
import { getEffectiveBillingStatus } from '@/lib/billingEntitlements';
import { getBasicPriceARS } from '@/lib/billingConfig';

export const dynamic = 'force-dynamic';

type Props = { searchParams?: Promise<{ status?: string }> };

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
  const statusBanner = searchParams?.status === 'success'
    ? { title: 'Pago recibido', text: 'El pago fue procesado. Si el estado todavía no cambió, actualizá el historial en unos segundos.', tone: 'success' }
    : searchParams?.status === 'failure'
      ? { title: 'El pago no se completó', text: 'Podés volver a intentarlo desde esta página. Si el problema continúa, guardá la referencia del intento y contactá soporte.', tone: 'error' }
      : searchParams?.status === 'pending'
        ? { title: 'Pago pendiente de confirmación', text: 'Mercado Pago todavía no confirmó el resultado. No repitas el pago de inmediato: revisá el historial y verificá la referencia si aparece.', tone: 'warning' }
        : null;

  return (
    <main className="min-h-screen bg-[#f7f5f0] px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-6xl">
        <header className="border-b border-slate-200 pb-7"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-700">Cuenta y acceso</p><h1 className="mt-3 font-serif text-4xl tracking-[-0.04em] text-slate-950 sm:text-5xl">Facturación</h1><p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">Entendé qué plan tenés, hasta cuándo está cubierto y cómo recuperar el acceso sin perder el control de tus pagos.</p></header>
        {statusBanner && <div role="status" className={`mt-6 rounded-2xl border px-5 py-4 ${statusBanner.tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : statusBanner.tone === 'error' ? 'border-red-200 bg-red-50 text-red-900' : 'border-amber-200 bg-amber-50 text-amber-950'}`}><p className="font-semibold">{statusBanner.title}</p><p className="mt-1 text-sm leading-6 opacity-90">{statusBanner.text}</p></div>}
        <div className="mt-8"><BillingClient billingInfo={{ planName: 'Básico', status: statusLabel, statusCode, paidUntil: business.paidUntil ? new Date(business.paidUntil).toISOString() : null, priceARS: basicPriceARS }} /></div>
        <footer className="mt-10 border-t border-slate-200 pt-5 text-center text-xs text-slate-500">Los pagos se procesan con Mercado Pago. FezTime no guarda datos de tarjeta.</footer>
      </div>
    </main>
  );
}
