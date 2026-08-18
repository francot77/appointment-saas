'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BRAND_NAME, BRAND_PRIMARY } from '../dashboard/types';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState(''); const [businessName, setBusinessName] = useState(''); const [phone, setPhone] = useState(''); const [address, setAddress] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); const [loading, setLoading] = useState(false); const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(null); setLoading(true);
    try {
      const res = await fetch('/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, businessName, phone, address, email, password }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'No pudimos crear la cuenta. Revisá los datos e intentá de nuevo.'); return; }
      router.push('/login?registered=1');
    } catch { setError('No pudimos crear la cuenta ahora. Revisá tu conexión e intentá de nuevo.'); } finally { setLoading(false); }
  }

  const field = 'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20';
  return (
    <main className="min-h-screen bg-[#f7f5f0] px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-6xl">
        <header className="flex items-center justify-between border-b border-slate-200 pb-5"><Link href="/" className="inline-flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-4"><span className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold text-white" style={{ backgroundColor: BRAND_PRIMARY }}>{BRAND_NAME.charAt(0).toUpperCase()}</span><span className="font-semibold tracking-tight">{BRAND_NAME}</span></Link><Link href="/login" className="text-sm font-medium text-indigo-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-4">Ya tengo cuenta</Link></header>
        <div className="grid gap-10 py-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <section className="lg:pt-8"><p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-700">Primer paso</p><h1 className="font-serif text-4xl leading-tight tracking-[-0.04em] text-slate-950 sm:text-5xl">Empezá a ordenar tus turnos.</h1><p className="mt-6 text-lg leading-8 text-slate-600">Contanos quién sos y cómo se llama tu negocio. Después vas a poder completar servicios, horarios y la página que compartirás con tus clientes.</p><div className="mt-8 space-y-4 text-sm text-slate-700"><p><strong className="text-slate-950">Ahora:</strong> datos de contacto y acceso.</p><p><strong className="text-slate-950">Después:</strong> configurás tu agenda desde el panel.</p><p><strong className="text-slate-950">Sin tarjeta:</strong> primero creás tu cuenta y revisás el espacio.</p></div></section>
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-8"><div className="mb-7"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700">Crear cuenta</p><h2 className="mt-3 font-serif text-3xl tracking-[-0.03em]">Datos de tu negocio</h2><p className="mt-2 text-sm text-slate-600">Los campos con * son necesarios para empezar.</p></div>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-5 sm:grid-cols-2"><div><label htmlFor="register-name" className="mb-2 block text-sm font-medium">Tu nombre *</label><input id="register-name" className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Ana" required autoComplete="name" /></div><div><label htmlFor="register-business" className="mb-2 block text-sm font-medium">Nombre del negocio *</label><input id="register-business" className={field} value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Ej: Barbería Centro" required /></div></div>
              <div className="grid gap-5 sm:grid-cols-2"><div><label htmlFor="register-phone" className="mb-2 block text-sm font-medium">Teléfono de contacto *</label><input id="register-phone" className={field} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Ej: 11 2345 6789" required autoComplete="tel" /></div><div><label htmlFor="register-address" className="mb-2 block text-sm font-medium">Dirección <span className="font-normal text-slate-500">(opcional)</span></label><input id="register-address" className={field} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Ej: Av. Siempre Viva 123" autoComplete="street-address" /></div></div>
              <div><label htmlFor="register-email" className="mb-2 block text-sm font-medium">Email *</label><input id="register-email" type="email" className={field} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" required autoComplete="email" /></div>
              <div><label htmlFor="register-password" className="mb-2 block text-sm font-medium">Contraseña *</label><div className="relative"><input id="register-password" type={showPassword ? 'text' : 'password'} className={`${field} pr-20`} value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} placeholder="Mínimo 6 caracteres" required autoComplete="new-password" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>{showPassword ? 'Ocultar' : 'Mostrar'}</button></div><p className="mt-2 text-xs text-slate-500">La vas a usar junto con tu email para entrar al panel.</p></div>
              {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-800">{error}</div>}
              <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2">{loading && <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}{loading ? 'Creando cuenta...' : 'Crear cuenta'}</button>
              <p className="text-center text-xs text-slate-500">No te vamos a pedir tarjeta para crear la cuenta.</p>
            </form>
          </section>
        </div>
        <footer className="border-t border-slate-200 pt-5 text-center text-xs text-slate-500">FezTime · Una agenda más clara para tu negocio</footer>
      </div>
    </main>
  );
}
