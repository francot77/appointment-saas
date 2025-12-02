'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const PINK = '#e87dad';

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

      // Después del registro, lo mandamos a login
      router.push('/login?registered=1');
    } catch (err) {
      console.error(err);
      setError('Error inesperado');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="w-full max-w-md bg-slate-900 rounded-xl p-6 shadow-xl border border-slate-800">
        <h1 className="text-2xl font-semibold mb-4 text-white">
          Crear cuenta
        </h1>
        <p className="text-sm text-slate-400 mb-4">
          En menos de 5 minutos tenés tu sistema de turnos andando.
        </p>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm text-slate-300 mb-1">
              Tu nombre
            </label>
            <input
              className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-pink-400"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Ana"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">
              Nombre del negocio
            </label>
            <input
              className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-pink-400"
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
              placeholder="Ej: Estética Ana"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm text-slate-300 mb-1">
                Teléfono
              </label>
              <input
                className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-pink-400"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="Ej: 11 2345 6789"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">
                Dirección
              </label>
              <input
                className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-pink-400"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Opcional"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">
              Email
            </label>
            <input
              type="email"
              className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-pink-400"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-pink-400"
              value={password}
              onChange={e => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 mt-1">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 rounded-md px-3 py-2 text-sm font-medium text-slate-950"
            style={{ backgroundColor: PINK, opacity: loading ? 0.6 : 1 }}
          >
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-xs text-slate-400 mt-4 text-center">
          ¿Ya tenés cuenta?{' '}
          <a href="/login" className="text-pink-400 hover:underline">
            Iniciar sesión
          </a>
        </p>
      </div>
    </div>
  );
}
