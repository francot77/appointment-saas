// app/dashboard/DashboardClient.tsx
'use client';

import { useState } from 'react';

import { PINK as BRAND_PRIMARY } from './types';
import AppointmentsTab from './AppointmentsTab';
import ServicesTab from './ServicesTab';
import ScheduleTab from './ScheduleTab';
import CalendarTab from './CalendarTab';
import { signOut } from 'next-auth/react';
import SettingsTab from './SettingsTab';

async function logout() {
  await signOut({ callbackUrl: '/login' });
}

type Props = {
  businessName: string;
};

export default function DashboardClient({ businessName }: Props) {
  const [tab, setTab] = useState<
    'appointments' | 'services' | 'schedule' | 'calendar'|'settings'
  >('appointments'); // ya lo cambiaste a lo que quieras

  const initial =
    businessName.trim().charAt(0).toUpperCase() || 'B';

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex justify-center p-4">
      <div className="w-full max-w-5xl space-y-4">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shadow-lg shadow-black/40"
              style={{ backgroundColor: BRAND_PRIMARY, color: '#020617' }}
            >
              {initial}
            </div>
            <div>
              <h1 className="text-lg font-semibold">
                {businessName}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Panel para administrar turnos, servicios y horarios.
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="text-xs border border-slate-600 px-3 py-1 rounded-md hover:bg-slate-800"
          >
            Cerrar sesión
          </button>
        </header>

        {/* Tabs */}
        <div className="inline-flex rounded-full border border-slate-800 bg-slate-900/60 p-1 text-xs">
          <button
            onClick={() => setTab('appointments')}
            className={`px-4 py-1.5 rounded-full ${
              tab === 'appointments'
                ? 'bg-slate-100 text-slate-900'
                : 'text-slate-300'
            }`}
          >
            Turnos
          </button>
          <button
            onClick={() => setTab('services')}
            className={`px-4 py-1.5 rounded-full ${
              tab === 'services'
                ? 'bg-slate-100 text-slate-900'
                : 'text-slate-300'
            }`}
          >
            Servicios
          </button>
          <button
            onClick={() => setTab('schedule')}
            className={`px-4 py-1.5 rounded-full ${
              tab === 'schedule'
                ? 'bg-slate-100 text-slate-900'
                : 'text-slate-300'
            }`}
          >
            Horarios
          </button>
          <button
            onClick={() => setTab('calendar')}
            className={`px-4 py-1.5 rounded-full ${
              tab === 'calendar'
                ? 'bg-slate-100 text-slate-900'
                : 'text-slate-300'
            }`}
          >
            Calendario
          </button>
           <button
            onClick={() => setTab('settings')}
            className={`px-4 py-1.5 rounded-full ${
              tab === 'settings'
                ? 'bg-slate-100 text-slate-900'
                : 'text-slate-300'
            }`}
          >
            Configuracion
          </button>
        </div>

        {tab === 'appointments' && <AppointmentsTab />}
        {tab === 'services' && <ServicesTab />}
        {tab === 'schedule' && <ScheduleTab />}
        {tab === 'calendar' && <CalendarTab />}
        {tab === 'settings' && <SettingsTab />}
      </div>
    </main>
  );
}
