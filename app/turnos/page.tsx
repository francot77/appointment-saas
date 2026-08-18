import Link from 'next/link';
import { redirect } from 'next/navigation';

export default function TurnosPage() {
  const slug = (process.env.NEXT_PUBLIC_DEFAULT_SLUG || process.env.DEFAULT_SLUG)?.trim();

  if (slug) redirect(`/${slug}/turnos`);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <section className="mx-auto max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl shadow-black/30">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-300">FezTime</p>
        <h1 className="mt-3 text-2xl font-semibold">Elegí una agenda para reservar</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Este acceso general no tiene un negocio público configurado. Usá el link que te compartió el negocio o volvé al inicio.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/" className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-950">Ir al inicio</Link>
          <Link href="/register" className="rounded-full border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-100">Crear una agenda</Link>
          <Link href="/demo" className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300">Ver demo</Link>
        </div>
      </section>
    </main>
  );
}
