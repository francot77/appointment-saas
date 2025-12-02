// app/[slug]/turno-actualizado/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import dbConnect from '@/lib/db';
import { Business } from '@/lib/models/Business';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{
    oldDate?: string;
    oldTime?: string;
    newDate?: string;
    newTime?: string;
    service?: string;
  }>;
};

export const metadata: Metadata = {
  title: 'Turno reprogramado',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function TurnoActualizadoPage(props: Props) {
  const [params, search] = await Promise.all([
    props.params,
    props.searchParams ?? Promise.resolve({}),
  ]);

  const { slug } = params;
  const { oldDate, oldTime, newDate, newTime, service } = (search || {}) as any;

  await dbConnect();
  const business = await Business.findOne({ slug }).lean();

  if (!business) notFound();

  const businessName: string = business.name || 'Tu turno';
  const primaryColor: string = business.primaryColor || '#6366F1';
  const accentColor: string = business.accentColor || '#22C55E';

  const initial =
    businessName.trim().charAt(0).toUpperCase() || 'T';

  return (
    <main className="min-h-screen relative bg-slate-950 text-slate-100 flex items-center justify-center px-4">
      {/* Glow de fondo */}
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
                Turno reprogramado
              </p>
            </div>
          </header>

          {/* Mensaje principal */}
          <div className="space-y-2 mt-2">
            <h2 className="text-lg font-semibold">
              ¡Tu turno fue reprogramado! 🔁
            </h2>
            <p className="text-xs text-slate-300">
              Actualizamos tu turno con el nuevo horario que elegiste. 
              Te va a llegar la confirmación final por WhatsApp si el negocio lo usa para avisos.
            </p>
          </div>

          {/* Resumen antes / después */}
          {(newDate || newTime || service) && (
            <div className="mt-2 border border-slate-800 rounded-lg p-3 bg-slate-950/80 text-xs space-y-2">
              <p className="text-[11px] text-slate-400">
                Resumen de tu turno:
              </p>

              {service && (
                <p>
                  <span className="text-slate-400">Servicio: </span>
                  <span className="text-slate-100 font-medium">
                    {service}
                  </span>
                </p>
              )}

              {(oldDate || oldTime) && (
                <div className="text-[11px] text-slate-400">
                  <p className="mb-1">Horario anterior:</p>
                  <p className="text-slate-200">
                    {oldDate && <span>{oldDate}</span>}
                    {oldDate && oldTime && ' · '}
                    {oldTime && <span>{oldTime} hs</span>}
                  </p>
                </div>
              )}

              {(newDate || newTime) && (
                <div className="text-[11px] text-slate-400">
                  <p className="mb-1">Nuevo horario:</p>
                  <p className="text-slate-200 font-medium">
                    {newDate && <span>{newDate}</span>}
                    {newDate && newTime && ' · '}
                    {newTime && <span>{newTime} hs</span>}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="text-[11px] text-slate-400 space-y-1">
            <p>
              Si más adelante necesitás cambiarlo de nuevo o cancelar,
              podés volver a usar el link que recibiste por WhatsApp.
            </p>
          </div>

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
