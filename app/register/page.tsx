'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          businessName,
          phone,
          address,
          email,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al registrarse');
        setLoading(false);
        return;
      }

      router.push('/login?registered=1');
    } catch (err) {
      console.error(err);
      setError('Error inesperado');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#101622] text-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-[1.1fr,1fr] gap-6 md:gap-10 rounded-3xl border border-slate-800 bg-slate-950/80 shadow-2xl shadow-black/60 p-5 md:p-8">
        {/* Columna izquierda: copy / contexto */}
        <div className="flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/40 bg-blue-500/10 px-3 py-1 text-[11px] text-blue-200">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Configura tu agenda en menos de 5 minutos</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-[-0.04em]">
              Crear tu cuenta de TurnosSaaS
            </h1>
            <p className="text-sm sm:text-[15px] text-slate-400 leading-relaxed max-w-md">
              Vamos a crear tu negocio y tu usuario para que puedas empezar a
              cargar turnos, compartir tu link en redes y dejar el cuaderno
              atrás.
            </p>

            <div className="mt-2 space-y-2 text-[12px] text-slate-400">
             
            </div>
          </div>

          <p className="hidden md:block text-[11px] text-slate-500">
            Pensado para barberías, peluquerías, manicuristas y centros de
            estética que quieren dejar de sufrir con los turnos.
          </p>
        </div>

        {/* Columna derecha: form */}
        <div className="rounded-2xl bg-slate-950/80 border border-slate-800 p-5 md:p-6 flex flex-col justify-center">
          <form className="space-y-3" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Tu nombre<span className="text-red-400 ml-0.5">*</span>
                </label>
                
                <input
                  className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-500/60"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ej: Ana"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Nombre del negocio
                  <span className="text-red-400 ml-0.5">*</span>
                </label>
                <input
                  className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-500/60"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  placeholder="Ej: Barbería Centro"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Teléfono de contacto
                  <span className="text-red-400 ml-0.5">*</span>
                </label>
                <input
                  className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-500/60"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="Ej: 11 2345 6789"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Dirección (opcional)
                </label>
                <input
                  className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-500/60"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Ej: Av. Siempre Viva 123"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Email
                <span className="text-red-400 ml-0.5">*</span>
              </label>
              <input
                type="email"
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-500/60"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Ej: tuemail@negocio.com"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Contraseña
                <span className="text-red-400 ml-0.5">*</span>
              </label>
              <input
                type="password"
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-500/60"
                value={password}
                onChange={e => setPassword(e.target.value)}
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                required
              />
              <p className="text-[11px] text-slate-500">
                Guardá este email y contraseña: los vas a usar para entrar al
                panel.
              </p>
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-full px-3 py-2.5 text-sm font-semibold text-slate-50 bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30 hover:from-blue-400 hover:to-blue-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading && (
                <span className="inline-block h-3 w-3 rounded-full border border-slate-950 border-t-transparent animate-spin" />
              )}
              {loading ? 'Creando cuenta...' : 'Crear cuenta gratis'}
            </button>


            <p className="text-[11px] text-slate-500 text-center mt-1">
              No te vamos a pedir tarjeta ahora. Podés probar y, si no te sirve, lo dejás.
            </p>
          </form>

          <p className="text-xs text-slate-400 mt-4 text-center">
            ¿Ya tenés cuenta?{' '}
            <Link
              href="/login"
              className="text-blue-500 hover:text-[#f29bc4] hover:underline"
            >
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}


