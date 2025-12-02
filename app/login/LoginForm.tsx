'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { BRAND_PRIMARY } from '../dashboard/types';

export default function LoginForm({ from }: { from: string }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
      callbackUrl: from || '/dashboard',
    });

    setLoading(false);

    if (res?.error) {
      setError('Credenciales inválidas');
      return;
    }

    router.push(from || '/dashboard');
  }


  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs mb-1 text-slate-200">
          Usuario
        </label>
        <input
          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="username"
        />
      </div>

      <div>
        <label className="block text-xs mb-1 text-slate-200">
          Contraseña
        </label>
        <input
          type="password"
          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
      </div>

      {error && (
        <p className="text-xs text-red-400 mt-1">{error}</p>
      )}

      <button
        disabled={loading}
        className="w-full mt-2 rounded-full py-2 text-sm font-medium shadow-md shadow-black/40 disabled:opacity-60"
        style={{ backgroundColor: BRAND_PRIMARY, color: '#020617' }}
      >
        {loading ? 'Ingresando...' : 'Entrar al panel'}
      </button>
    </form>
  );
}
