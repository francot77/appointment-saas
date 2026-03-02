import type { Metadata } from 'next';
import Link from 'next/link';
import { BRAND_NAME } from '../dashboard/types';

export const metadata: Metadata = {
  title: 'Términos',
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#101622] text-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <header className="space-y-2">
          <p className="text-[11px] text-slate-400">
            <Link href="/" className="hover:text-indigo-300 transition-colors">
              Volver al inicio
            </Link>
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-[-0.04em]">
            Términos de {BRAND_NAME}
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Este texto es un placeholder para que el enlace no termine en una
            página inexistente. Reemplazalo por tus términos legales.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 space-y-3 text-sm leading-relaxed text-slate-200">
          <h2 className="text-base font-semibold">1. Uso del servicio</h2>
          <p>
            {BRAND_NAME} permite gestionar y solicitar turnos online. El uso del
            servicio está sujeto al cumplimiento de las leyes aplicables y a las
            políticas del negocio que ofrece los turnos.
          </p>

          <h2 className="text-base font-semibold">2. Disponibilidad</h2>
          <p>
            La disponibilidad de horarios depende de la configuración de cada
            negocio. Los turnos solicitados pueden requerir confirmación.
          </p>

          <h2 className="text-base font-semibold">3. Contacto</h2>
          <p>
            Para consultas legales o soporte, definí un canal de contacto y
            publicalo acá.
          </p>
        </section>
      </div>
    </main>
  );
}
