import type { Metadata } from 'next';
import Link from 'next/link';
import LoginForm from './LoginForm';
import { BRAND_NAME, BRAND_PRIMARY } from '../dashboard/types';

export const metadata: Metadata = {
  title: 'Iniciar sesión',
  robots: { index: false, follow: false },
};

export default async function LoginPage(props: { searchParams?: Promise<{ from?: string; registered?: string }> }) {
  const searchParams = await props.searchParams;
  const from = searchParams?.from || '/dashboard';
  const registered = searchParams?.registered === '1';

  return (
    <main className="min-h-screen bg-[#f7f5f0] px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 pb-5">
          <Link href="/" className="inline-flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold text-white" style={{ backgroundColor: BRAND_PRIMARY }}>{BRAND_NAME.charAt(0).toUpperCase()}</span>
            <span className="font-semibold tracking-tight">{BRAND_NAME}</span>
          </Link>
          <Link href="/register" className="text-sm font-medium text-indigo-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-4">Crear cuenta</Link>
        </header>

        <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1fr_420px] lg:gap-20">
          <section className="hidden max-w-xl lg:block">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-700">Tu agenda, en orden</p>
            <h1 className="font-serif text-5xl leading-[1.05] tracking-[-0.04em] text-slate-950">Volvé a tu negocio con claridad.</h1>
            <p className="mt-6 max-w-md text-lg leading-8 text-slate-600">Entrá al panel para revisar tus turnos, actualizar tu página pública y mantener tu agenda disponible para tus clientes.</p>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700">Panel de administración</p>
            <h2 className="mt-3 font-serif text-3xl tracking-[-0.03em]">Iniciar sesión</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Usá el email y la contraseña de tu cuenta para continuar.</p>

            {registered && <p role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Cuenta creada. Ingresá para configurar tu primera página de turnos.</p>}
            <div className="mt-6"><LoginForm from={from} /></div>
            <p className="mt-6 border-t border-slate-100 pt-5 text-center text-sm text-slate-600">¿Todavía no tenés cuenta? <Link href="/register" className="font-semibold text-indigo-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">Registrate</Link></p>
          </section>
        </div>

        <footer className="border-t border-slate-200 pt-5 text-center text-xs text-slate-500">FezTime · Agenda simple para negocios que trabajan con turnos</footer>
      </div>
    </main>
  );
}
