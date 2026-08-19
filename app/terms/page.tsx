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
          <p className="text-sm text-slate-400 leading-relaxed">Contenido legal pendiente de completar antes del lanzamiento.</p>
        </header>

        <section className="rounded-2xl border border-amber-400/30 bg-amber-400/5 p-5 text-sm leading-relaxed text-slate-200">
          <p>Estos términos estarán disponibles antes del lanzamiento. Hasta entonces, no consideres esta página como un texto legal final.</p>
        </section>
      </div>
    </main>
  );
}
