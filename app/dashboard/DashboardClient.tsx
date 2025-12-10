/* eslint-disable @next/next/no-img-element */
// app/dashboard/DashboardClient.tsx
'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';

import AppointmentsTab from './AppointmentsTab';
import ServicesTab from './ServicesTab';
import ScheduleTab from './ScheduleTab';
import CalendarTab from './CalendarTab';
import SettingsTab from './SettingsTab';
import { BrandConfig, DEFAULT_BRAND } from './types';

type TabKey = 'appointments' | 'services' | 'schedule' | 'calendar' | 'settings';

type Props = {
  businessName: string;
  avatarUrl?: string | null;
  brand?: BrandConfig;
};

async function logout() {
  await signOut({ callbackUrl: '/login' });
}

export default function DashboardClient({ businessName, avatarUrl, brand }: Props) {
  const [tab, setTab] = useState<TabKey>('appointments');

  const theme = brand ?? DEFAULT_BRAND;
  const initial =
    businessName?.trim().charAt(0).toUpperCase() || 'B';

  return (
    <main
      className="min-h-screen text-slate-50 flex flex-col items-center"
      style={{ backgroundColor: theme.background || '#050816' }}
    >
      <div className="w-full max-w-md md:max-w-3xl flex-1 flex flex-col px-3 pt-4 pb-20">
        <div className="relative flex-1 rounded-3xl bg-slate-950/90 border border-slate-800 shadow-[0_25px_80px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden">
          {/* Header */}
          <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={businessName}
                  className="h-9 w-9 rounded-2xl object-cover border shadow-md"
                  style={{
                    borderColor: theme.primary,
                    boxShadow: `0 0 14px ${theme.primary}40`,
                  }}
                />
              ) : (
                <div
                  className="h-9 w-9 rounded-2xl flex items-center justify-center text-sm font-bold shadow-md"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                    boxShadow: `0 0 18px ${theme.primary}40`,
                    color: theme.textOnPrimary,
                  }}
                >
                  {initial}
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-[13px] font-semibold truncate">
                  {businessName}
                </span>
                <span className="text-[11px] text-slate-400">
                  Admin de turnos
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-900/80 px-2.5 py-1.5 text-[11px] text-slate-300 hover:bg-slate-800/80 hover:text-slate-50 transition-colors"
            >
              <span className="mr-1.5 text-xs">⎋</span>
              <span>Salir</span>
            </button>
          </header>

          {/* Contenido scrollable */}
          <div className="flex-1 px-3 pt-3 pb-4 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            {tab === 'appointments' && <AppointmentsTab brand={theme} />}
            {tab === 'services' && <ServicesTab brand={theme}/>}
            {tab === 'schedule' && <ScheduleTab brand={theme}/>}
            {tab === 'calendar' && <CalendarTab brand={theme}/>}
            {tab === 'settings' && <SettingsTab />}
          </div>
        </div>
      </div>

      {/* Bottom nav fijo */}
      <nav className="fixed bottom-0 inset-x-0 z-50 border-t border-slate-800 bg-slate-950/95 backdrop-blur-sm">
        <div className="mx-auto max-w-md md:max-w-3xl flex h-14 items-center justify-around text-[11px] px-3">
          <BottomNavItem
            label="Turnos"
            icon="📅"
            active={tab === 'appointments'}
            onClick={() => setTab('appointments')}
            theme={theme}
          />
          <BottomNavItem
            label="Servicios"
            icon="✂️"
            active={tab === 'services'}
            onClick={() => setTab('services')}
            theme={theme}
          />
          <BottomNavItem
            label="Horarios"
            icon="⏰"
            active={tab === 'schedule'}
            onClick={() => setTab('schedule')}
            theme={theme}
          />
          <BottomNavItem
            label="Calendario"
            icon="🗓️"
            active={tab === 'calendar'}
            onClick={() => setTab('calendar')}
            theme={theme}
          />
          <BottomNavItem
            label="Ajustes"
            icon="⚙️"
            active={tab === 'settings'}
            onClick={() => setTab('settings')}
            theme={theme}
          />
        </div>
      </nav>
    </main>
  );
}

type BottomNavItemProps = {
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
  theme: BrandConfig;
};

function BottomNavItem({ label, icon, active, onClick, theme }: BottomNavItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative inline-flex flex-col items-center justify-center gap-0.5 h-full px-1 text-[11px] focus:outline-none"
    >
      <div
        className="flex h-7 w-7 items-center justify-center rounded-2xl text-base transition-colors"
        style={
          active
            ? {
                backgroundImage: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                color: theme.textOnPrimary,
                boxShadow: `0 0 14px ${theme.primary}40`,
              }
            : { color: '#94a3b8' }
        }
      >
        <span>{icon}</span>
      </div>
      <span
        className={`transition-colors ${
          active ? 'text-slate-50 font-semibold' : 'text-slate-400'
        }`}
      >
        {label}
      </span>
      {active && (
        <span
          className="absolute -top-1 h-1 w-6 rounded-full"
          style={{
            backgroundImage: `linear-gradient(90deg, ${theme.primary}, ${theme.secondary})`,
          }}
        />
      )}
    </button>
  );
}
