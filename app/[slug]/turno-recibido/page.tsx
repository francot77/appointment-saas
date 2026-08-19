// app/[slug]/turno-recibido/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import dbConnect from '@/lib/db';
import { getBusinessBySlug } from '@/lib/getBusinessBySlug';
import { date as validateDate } from '@/lib/validation';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ date?: string; time?: string; service?: string; reference?: string; token?: string }>;
};

export const metadata: Metadata = { title: 'Solicitud recibida', robots: { index: false, follow: false } };

function validHex(value: string | undefined, fallback: string) {
  return value && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value) ? value : fallback;
}

function readableText(color: string) {
  const hex = color.replace('#', '');
  const normalized = hex.length === 3 ? hex.split('').map((part) => part + part).join('') : hex;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(normalized.slice(i, i + 2), 16));
  return 0.299 * r + 0.587 * g + 0.114 * b > 165 ? '#18212b' : '#ffffff';
}

export default async function TurnoRecibidoPage(props: Props) {
  const [params, search] = await Promise.all([props.params, props.searchParams ?? Promise.resolve({})]);
  const { slug } = params;
  const { date, time, service, reference, token } = (search || {}) as any;
  const parsedDate = validateDate(date);
  const safeDate = parsedDate.ok ? parsedDate.value : undefined;
  await dbConnect();
  const business = await getBusinessBySlug(slug);
  if (!business) notFound();
  if ((business as any).slug && (business as any).slug !== slug) {
    const qp = new URLSearchParams();
    if (date) qp.set('date', String(date));
    if (time) qp.set('time', String(time));
    if (service) qp.set('service', String(service));
    if (reference) qp.set('reference', String(reference));
     if (token) qp.set('token', String(token));
    redirect(`/${(business as any).slug}/turno-recibido${qp.toString() ? `?${qp}` : ''}`);
  }

  const businessName = business.name || 'Tu turno';
  const primaryColor = validHex(business.primaryColor, '#334e68');
  const accentColor = validHex(business.accentColor, '#b94735');
  const readableDate = safeDate ? new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${safeDate}T12:00:00`)) : null;

  return (
    <main className="min-h-screen bg-[#fbf8f1] px-4 py-6 text-[#18212b] sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-xl">
        <header className="mb-6 flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-full text-lg font-semibold" style={{ backgroundColor: primaryColor, color: readableText(primaryColor) }}>{businessName.trim().charAt(0).toUpperCase() || 'T'}</div><div><p className="text-[15px] font-semibold">{businessName}</p><p className="text-[15px] text-[#617083]">Solicitud de turno</p></div></header>
        <section className="rounded-[2rem] border border-[#ded9cf] bg-white p-6 shadow-[0_16px_50px_rgba(24,33,43,0.08)] sm:p-9">
          <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.16em]" style={{ color: accentColor }}>Paso completado</p>
          <h1 className="text-3xl font-semibold leading-tight tracking-[-0.04em]">Recibimos tu solicitud</h1>
          <p className="mt-3 text-[16px] leading-6 text-[#617083]">El negocio recibió tus datos y va a revisar el horario elegido. Esto todavía no es una confirmación.</p>
          <div role="status" aria-live="polite" className="mt-6 rounded-2xl border border-[#d8b66b] bg-[#fff8e7] p-4 text-[15px] leading-6"><strong>Próximo paso:</strong> esperá la confirmación del negocio por WhatsApp o por el canal que use. Si trabajan con confirmación manual, ese mensaje es el que valida tu turno.</div>
          {(date || time || service) && <div className="mt-6 rounded-2xl border border-[#ded9cf] bg-[#faf8f3] p-5"><h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#617083]">Resumen de la solicitud</h2><dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 text-[15px]">{service && <SummaryItem label="Servicio" value={String(service)} />}{date && <SummaryItem label="Fecha" value={readableDate || 'Fecha no disponible'} />}{time && <SummaryItem label="Horario" value={`${time} hs`} />}{reference && <SummaryItem label="Referencia" value={String(reference)} />}</dl></div>}
           <p className="mt-6 text-[15px] leading-6 text-[#617083]">Cuando el negocio confirme, guardá ese mensaje. Si no recibís noticias en un tiempo razonable, contactalo directamente por WhatsApp si tiene ese canal habilitado.</p>
           {token && <a href={`/r/${encodeURIComponent(String(token))}`} className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-full border border-[#18212b] px-5 text-[16px] font-semibold">Gestionar mi turno</a>}
           <a href={`/${slug}/turnos`} className="mt-7 inline-flex min-h-12 w-full items-center justify-center rounded-full px-5 text-[16px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2" style={{ backgroundColor: primaryColor, color: readableText(primaryColor), outlineColor: primaryColor }}>Hacer otra solicitud</a>
        </section>
      </div>
    </main>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-[13px] text-[#617083]">{label}</dt><dd className="mt-0.5 font-semibold">{value}</dd></div>;
}
