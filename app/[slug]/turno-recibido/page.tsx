// app/[slug]/turno-recibido/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import dbConnect from '@/lib/db';
import { getBusinessBySlug } from '@/lib/getBusinessBySlug';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{
    date?: string;
    time?: string;
    service?: string;
  }>;
};

export const metadata: Metadata = {
  title: 'Turno recibido',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function TurnoRecibidoPage(props: Props) {
  const [params, search] = await Promise.all([
    props.params,
    props.searchParams ?? Promise.resolve({}),
  ]);

  const { slug } = params;
  const { date, time, service } = (search || {}) as any;

  await dbConnect();
  const business = await getBusinessBySlug(slug);

  if (!business) notFound();
  if ((business as any).slug && (business as any).slug !== slug) {
    const qp = new URLSearchParams();
    if (date) qp.set('date', String(date));
    if (time) qp.set('time', String(time));
    if (service) qp.set('service', String(service));
    const suffix = qp.toString() ? `?${qp.toString()}` : '';
    redirect(`/${(business as any).slug}/turno-recibido${suffix}`);
  }

  const businessName: string = business.name || 'Tu turno';
  const primaryColor: string = business.primaryColor || '#6366F1';
  const accentColor: string = business.accentColor || '#22C55E';

  const initial =
    businessName.trim().charAt(0).toUpperCase() || 'T';
  const readableDate = date
    ? new Intl.DateTimeFormat('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }).format(new Date(`${date}T12:00:00`))
    : null;

  return (
    <main className="min-h-screen relative bg-slate-950 text-slate-100 flex items-center justify-center px-4">
      {/* Glow de fondo con colores del negocio */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-32 -left-24 w-72 h-72 rounded-full opacity-35 blur-3xl"
          style={{ backgroundColor: primaryColor }}
        />
        <div
          className="absolute bottom-[-40px] right-[-40px] w-80 h-80 rounded-full opacity-25 blur-3xl"
          style={{ backgroundColor: accentColor }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <section className="bg-slate-950/80 border border-slate-800 rounded-2xl px-5 py-6 shadow-2xl shadow-black/60 backdrop-blur space-y-4">
          {/* Header negocio */}
          <header className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shadow-lg shadow-black/40"
              style={{ backgroundColor: primaryColor, color: '#020617' }}
            >
              {initial}
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-wide">
                {businessName}
              </h1>
              <p className="text-[11px] text-slate-400">
                Turno solicitado
              </p>
            </div>
          </header>

          {/* Mensaje principal */}
          <div className="space-y-2 mt-2">
            <h2 className="text-lg font-semibold">
              ¡Tu solicitud de turno fue recibida! ✅
            </h2>
            <p className="text-xs text-slate-300">
              Registramos tu pedido de turno con los datos que cargaste.
              El negocio va a revisar la disponibilidad y te va a enviar la
              confirmación por WhatsApp al número que indicaste.
            </p>
          </div>

          <div role="status" aria-live="polite" className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
            Solicitud recibida. Todavía no es una confirmación: esperá el mensaje del negocio por WhatsApp.
          </div>

          {/* Resumen del turno (si viene en params) */}
          {(date || time || service) && (
            <div className="mt-2 border border-slate-800 rounded-lg p-3 bg-slate-950/80 text-xs space-y-1">
              <p className="text-[11px] text-slate-400">
                Resumen de tu solicitud:
              </p>
              {service && (
                <p>
                  <span className="text-slate-400">Servicio: </span>
                  <span className="text-slate-100 font-medium">
                    {service}
                  </span>
                </p>
              )}
              {date && (
                <p>
                  <span className="text-slate-400">Fecha: </span>
                    <span className="text-slate-100 font-medium">
                      {readableDate || date}
                  </span>
                </p>
              )}
              {time && (
                <p>
                  <span className="text-slate-400">Horario elegido: </span>
                  <span className="text-slate-100 font-medium">
                    {time} hs
                  </span>
                </p>
              )}
            </div>
          )}

          {/* Info sobre confirmación y reprogramación */}
          <div className="text-[11px] text-slate-400 space-y-1">
            <p>
              Cuando el turno sea confirmado, vas a recibir un mensaje de
              WhatsApp. En ese mensaje vas a tener un link especial para
              reprogramar o cancelar tu turno en caso de que lo necesites.
            </p>
            <p className="text-slate-500">
              Si no recibís la confirmación en un rato razonable, podés
              escribir directamente al WhatsApp del negocio.
            </p>
          </div>

          {/* Botón volver a pedir turno */}
          <div className="pt-2">
            <a
              href={`/${slug}`}
              className="w-full inline-flex items-center justify-center rounded-full py-2 text-xs font-medium shadow-md shadow-black/40"
              style={{ backgroundColor: primaryColor, color: '#020617' }}
            >
              Volver a la página de turnos
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
