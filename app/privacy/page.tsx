import type { Metadata } from 'next';
import Link from 'next/link';
import { BRAND_NAME } from '../dashboard/types';

export const metadata: Metadata = {
  title: 'Privacidad',
};

export default function PrivacyPage() {
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
            Política de privacidad de {BRAND_NAME}
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Este texto es un placeholder para que el enlace no termine en una
            página inexistente. Reemplazalo por tu política real.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 space-y-3 text-sm leading-relaxed text-slate-200">
          <h2 className="text-base font-semibold">1. Datos que se recolectan</h2>
          <p>
            Al solicitar un turno, el cliente puede ingresar datos como nombre,
            teléfono y notas. Cada negocio es responsable de definir el uso de
            esos datos.
          </p>

          <h2 className="text-base font-semibold">2. Finalidad</h2>
          <p>
            Los datos se usan para gestionar turnos, enviar confirmaciones y
            recordatorios, y mejorar la experiencia del servicio.
          </p>

          <h2 className="text-base font-semibold">3. Eliminación</h2>
          <p>
            Definí un procedimiento para que clientes puedan solicitar la
            eliminación o actualización de su información.
          </p>
        </section>
      </div>
    </main>
  );
}
