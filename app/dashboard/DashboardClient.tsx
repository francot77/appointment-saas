/* eslint-disable @next/next/no-img-element */
// app/dashboard/DashboardClient.tsx
'use client';

import { useEffect, useState } from 'react';
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
  businessSlug: string;
  avatarUrl?: string | null;
  brand?: BrandConfig;
};

type ActivationState = {
  checklist: {
    serviceConfigured: boolean;
    workingHoursConfigured: boolean;
    profileConfigured: boolean;
    publicLinkAvailable: boolean;
  };
  slug: string | null;
};

async function logout() {
  await signOut({ callbackUrl: '/login' });
}

export default function DashboardClient({ businessName, businessSlug, avatarUrl, brand }: Props) {
  const [tab, setTab] = useState<TabKey>('appointments');
  const [activation, setActivation] = useState<ActivationState | null>(null);
  const [activationError, setActivationError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const theme = brand ?? DEFAULT_BRAND;
  const initial =
    businessName?.trim().charAt(0).toUpperCase() || 'B';

  async function loadActivation() {
    try {
      const res = await fetch('/api/admin/activation');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo cargar la activación');
      setActivation(data);
      setActivationError(null);
    } catch {
      setActivationError('No se pudo cargar el checklist de activación.');
    }
  }

  useEffect(() => {
    loadActivation();

    function refreshWhenVisible() {
      if (document.visibilityState === 'visible') {
        loadActivation();
      }
    }

    window.addEventListener('focus', loadActivation);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      window.removeEventListener('focus', loadActivation);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, []);

  const publicUrl = `/${encodeURIComponent(activation?.slug || businessSlug)}`;

  async function copyPublicUrl() {
    const absoluteUrl = `${window.location.origin}${publicUrl}`;
    try {
      let copiedWithClipboard = false;
      if (navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(absoluteUrl);
          copiedWithClipboard = true;
        } catch {
          // Fall through to the legacy copy path when the Clipboard API rejects.
        }
      }
      if (!copiedWithClipboard) {
        const textarea = document.createElement('textarea');
        textarea.value = absoluteUrl;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        const copied = document.execCommand('copy');
        textarea.remove();
        if (!copied) throw new Error('COPY_UNAVAILABLE');
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setActivationError('No se pudo copiar el enlace.');
    }
  }

  async function sharePublicUrl() {
    const absoluteUrl = `${window.location.origin}${publicUrl}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: businessName, url: absoluteUrl });
        return;
      } catch {
        return;
      }
    }
    await copyPublicUrl();
  }

  function goTo(nextTab: TabKey) {
    setTab(nextTab);
    loadActivation();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

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
              className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-900/80 px-2.5 py-1.5 text-[11px] text-slate-300 hover:bg-slate-800/80 hover:text-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              <span className="mr-1.5 text-xs">⎋</span>
              <span>Salir</span>
            </button>
          </header>

          {/* Contenido scrollable */}
          <div className="flex-1 px-3 pt-3 pb-4 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            <ActivationChecklist
              activation={activation}
              error={activationError}
              publicUrl={publicUrl}
              copied={copied}
              onCopy={copyPublicUrl}
              onShare={sharePublicUrl}
              onNavigate={goTo}
            />
            {tab === 'appointments' && <AppointmentsTab brand={theme} />}
            {tab === 'services' && <ServicesTab brand={theme} />}
            {tab === 'schedule' && <ScheduleTab brand={theme} />}
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
            onClick={() => goTo('appointments')}
            theme={theme}
          />
          <BottomNavItem
            label="Servicios"
            icon="✂️"
            active={tab === 'services'}
            onClick={() => goTo('services')}
            theme={theme}
          />
          <BottomNavItem
            label="Horarios"
            icon="⏰"
            active={tab === 'schedule'}
            onClick={() => goTo('schedule')}
            theme={theme}
          />
          <BottomNavItem
            label="Calendario"
            icon="🗓️"
            active={tab === 'calendar'}
            onClick={() => goTo('calendar')}
            theme={theme}
          />
          <BottomNavItem
            label="Ajustes"
            icon="⚙️"
            active={tab === 'settings'}
            onClick={() => goTo('settings')}
            theme={theme}
          />
        </div>
      </nav>
    </main>
  );
}

function ActivationChecklist({
  activation,
  error,
  publicUrl,
  copied,
  onCopy,
  onShare,
  onNavigate,
}: {
  activation: ActivationState | null;
  error: string | null;
  publicUrl: string;
  copied: boolean;
  onCopy: () => void;
  onShare: () => void;
  onNavigate: (tab: TabKey) => void;
}) {
  if (error) {
    return <p className="mb-3 text-[11px] text-amber-300">{error}</p>;
  }
  if (!activation) {
    return <p className="mb-3 text-[11px] text-slate-500">Revisando la configuración inicial...</p>;
  }

  const items = [
    { key: 'serviceConfigured', label: 'Crear tu primer servicio', tab: 'services' as const },
    { key: 'workingHoursConfigured', label: 'Definir tus horarios', tab: 'schedule' as const },
    { key: 'profileConfigured', label: 'Completar el perfil público', tab: 'settings' as const },
  ] as const;
  const completed = items.filter((item) => activation.checklist[item.key]).length;
  const complete = completed === items.length && activation.checklist.publicLinkAvailable;

  return (
    <section className="mb-4 rounded-2xl border border-indigo-400/30 bg-indigo-500/10 p-4 space-y-3">
      <div>
        <p className="text-sm font-semibold">{complete ? 'Tu página está lista para compartir' : 'Activá tu página de turnos'}</p>
        <p className="mt-1 text-[11px] text-slate-300">{completed} de 3 pasos principales completados.</p>
      </div>
      <div className="space-y-2">
        {items.map((item) => {
          const done = activation.checklist[item.key];
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => !done && onNavigate(item.tab)}
              className="flex w-full items-center gap-2 rounded-lg border border-slate-700/70 bg-slate-950/60 px-3 py-2 text-left text-xs hover:bg-slate-900"
            >
              <span className={done ? 'text-emerald-400' : 'text-slate-500'}>{done ? '✓' : '○'}</span>
              <span className={done ? 'text-slate-400 line-through' : 'text-slate-100'}>{item.label}</span>
              {!done && <span className="ml-auto text-[11px] text-indigo-300">Configurar</span>}
            </button>
          );
        })}
      </div>
      {activation.checklist.publicLinkAvailable && (
        <div className="border-t border-indigo-300/20 pt-3">
          <p className="mb-1 text-[11px] text-slate-400">Tu enlace público</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <a href={publicUrl} target="_blank" rel="noreferrer" className="min-w-0 flex-1 break-all text-xs text-indigo-200 underline">
              {publicUrl}
            </a>
            <button type="button" onClick={onCopy} className="rounded-full border border-indigo-300/40 px-3 py-1.5 text-[11px] text-indigo-100 hover:bg-indigo-400/10">
              {copied ? 'Copiado' : 'Copiar enlace'}
            </button>
            <button type="button" onClick={onShare} className="rounded-full border border-indigo-300/40 px-3 py-1.5 text-[11px] text-indigo-100 hover:bg-indigo-400/10">
              Compartir
            </button>
          </div>
        </div>
      )}
    </section>
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
      className="relative inline-flex flex-col items-center justify-center gap-0.5 h-full px-1 text-[11px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 rounded-xl"
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
