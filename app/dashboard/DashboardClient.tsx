/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';

import AppointmentsTab from './AppointmentsTab';
import ServicesTab from './ServicesTab';
import ScheduleTab from './ScheduleTab';
import CalendarTab from './CalendarTab';
import SettingsTab from './SettingsTab';
import { BrandConfig, DEFAULT_BRAND } from './types';

type TabKey = 'appointments' | 'services' | 'schedule' | 'calendar' | 'settings';
type Props = { businessName: string; businessSlug: string; avatarUrl?: string | null; brand?: BrandConfig };
type ActivationState = {
  checklist: { serviceConfigured: boolean; workingHoursConfigured: boolean; profileConfigured: boolean; publicLinkAvailable: boolean };
  slug: string | null;
};
type ActivationVisitState = 'unresolved' | 'incomplete' | 'completion' | 'suppressed';

const NAV_ITEMS: { key: TabKey; label: string; icon: IconName }[] = [
  { key: 'appointments', label: 'Turnos', icon: 'calendar' },
  { key: 'services', label: 'Servicios', icon: 'scissors' },
  { key: 'schedule', label: 'Horarios', icon: 'clock' },
  { key: 'calendar', label: 'Calendario', icon: 'grid' },
  { key: 'settings', label: 'Ajustes', icon: 'sliders' },
];

type IconName = 'calendar' | 'scissors' | 'clock' | 'grid' | 'sliders' | 'arrow' | 'logout' | 'check' | 'external';

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    calendar: <><rect x="3" y="4" width="18" height="17" rx="3" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
    scissors: <><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="m8.5 7.5 11 10M8.5 16.5l5-5M14 8l5-5" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    grid: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></>,
    sliders: <><path d="M4 6h16M4 12h16M4 18h16" /><circle cx="9" cy="6" r="2" /><circle cx="15" cy="12" r="2" /><circle cx="10" cy="18" r="2" /></>,
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M14 4h5v16h-5" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    external: <><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6" /></>,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

async function logout() { await signOut({ callbackUrl: '/login' }); }

export default function DashboardClient({ businessName, businessSlug, avatarUrl, brand }: Props) {
  const [tab, setTab] = useState<TabKey>('appointments');
  const [activation, setActivation] = useState<ActivationState | null>(null);
  const [activationError, setActivationError] = useState<string | null>(null);
  const [activationVisitState, setActivationVisitState] = useState<ActivationVisitState>('unresolved');
  const [copied, setCopied] = useState(false);
  const activationRequestRef = useRef(0);
  const activationControllerRef = useRef<AbortController | null>(null);
  const activationVisitStateRef = useRef<ActivationVisitState>('unresolved');
  const theme = brand ?? DEFAULT_BRAND;
  const initial = businessName?.trim().charAt(0).toUpperCase() || 'B';
  const currentPage = NAV_ITEMS.find((item) => item.key === tab) ?? NAV_ITEMS[0];

  async function loadActivation() {
    const requestId = ++activationRequestRef.current;
    activationControllerRef.current?.abort();
    const controller = new AbortController();
    activationControllerRef.current = controller;
    try {
      const res = await fetch('/api/admin/activation', { signal: controller.signal });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo cargar la activación');
      if (requestId !== activationRequestRef.current) return;
      setActivation(data);
      const complete = data.checklist.serviceConfigured && data.checklist.workingHoursConfigured && data.checklist.profileConfigured && data.checklist.publicLinkAvailable;
      const current = activationVisitStateRef.current;
      const next = complete ? (current === 'incomplete' ? 'completion' : current === 'completion' || current === 'suppressed' ? current : 'suppressed') : 'incomplete';
      activationVisitStateRef.current = next;
      setActivationVisitState(next);
      setActivationError(null);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      if (requestId !== activationRequestRef.current) return;
      setActivationError('No pudimos revisar los pasos para activar tu página.');
    } finally {
      if (requestId === activationRequestRef.current) activationControllerRef.current = null;
    }
  }

  useEffect(() => {
    loadActivation();
    function refreshWhenVisible() { if (document.visibilityState === 'visible') loadActivation(); }
    window.addEventListener('focus', loadActivation);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      window.removeEventListener('focus', loadActivation);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      activationRequestRef.current += 1;
      activationControllerRef.current?.abort();
    };
  }, []);

  const publicUrl = `/${encodeURIComponent(activation?.slug || businessSlug)}`;
  async function copyPublicUrl() {
    const absoluteUrl = `${window.location.origin}${publicUrl}`;
    try {
      let copiedWithClipboard = false;
      if (navigator.clipboard) { try { await navigator.clipboard.writeText(absoluteUrl); copiedWithClipboard = true; } catch { /* use fallback */ } }
      if (!copiedWithClipboard) {
        const textarea = document.createElement('textarea'); textarea.value = absoluteUrl; textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed'; textarea.style.opacity = '0'; document.body.appendChild(textarea); textarea.select();
        if (!document.execCommand('copy')) throw new Error('COPY_UNAVAILABLE'); textarea.remove();
      }
      setCopied(true); window.setTimeout(() => setCopied(false), 1800);
    } catch { setActivationError('No se pudo copiar el enlace.'); }
  }
  async function sharePublicUrl() {
    const absoluteUrl = `${window.location.origin}${publicUrl}`;
    if (navigator.share) { try { await navigator.share({ title: businessName, url: absoluteUrl }); return; } catch { return; } }
    await copyPublicUrl();
  }
  function goTo(nextTab: TabKey) { setTab(nextTab); loadActivation(); window.scrollTo({ top: 0, behavior: 'smooth' }); }

  return (
    <main className="min-h-screen bg-[#f4f1ec] text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-[1500px]">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200/80 bg-[#faf9f6] px-5 py-6 lg:flex">
          <BrandMark avatarUrl={avatarUrl} businessName={businessName} initial={initial} theme={theme} />
          <p className="mt-12 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Tu negocio</p>
          <nav aria-label="Navegación principal" className="mt-3 space-y-1">
            {NAV_ITEMS.map((item) => <NavItem key={item.key} item={item} active={tab === item.key} onClick={() => goTo(item.key)} theme={theme} />)}
          </nav>
          <div className="mt-auto space-y-3">
            <Link href="/billing" className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
              <span>Estado de cuenta</span><Icon name="arrow" size={15} />
            </Link>
            <button type="button" onClick={logout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"><Icon name="logout" size={16} />Salir</button>
          </div>
        </aside>

        <div className="min-w-0 flex-1 pb-20 lg:pb-8">
          <header className="border-b border-slate-200/80 bg-[#faf9f6]/90 px-4 py-5 backdrop-blur sm:px-8 lg:px-12 lg:py-7">
            <div className="mx-auto flex max-w-6xl items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="lg:hidden"><BrandMark avatarUrl={avatarUrl} businessName={businessName} initial={initial} theme={theme} compact /></div>
                <div className="min-w-0"><p className="text-xs font-medium text-slate-500">{businessName}</p><h1 className="mt-1 truncate text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">{currentPage.label}</h1><p className="mt-1 text-sm text-slate-500">{tab === 'appointments' ? 'Revisá lo que necesita tu atención hoy.' : 'Gestioná este espacio desde un solo lugar.'}</p></div>
              </div>
              <div className="mt-1 flex shrink-0 items-center gap-2 lg:hidden">
                <Link href="/billing" aria-label="Ver estado de cuenta" className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"><span className="sm:hidden">Cuenta</span><span className="hidden sm:inline">Estado de cuenta</span><Icon name="arrow" size={14} /></Link>
                <button type="button" onClick={logout} aria-label="Cerrar sesión" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"><Icon name="logout" size={15} /><span className="hidden sm:inline">Salir</span></button>
              </div>
            </div>
          </header>
           <div className="mx-auto max-w-6xl px-4 py-5 sm:px-8 lg:px-12 lg:py-8">
             <section aria-label={currentPage.label}>
               {tab === 'appointments' && <AppointmentsTab brand={theme} />}
               {activationVisitState === 'unresolved' && <p className="mb-6 text-xs text-slate-500" role="status">Revisando los pasos para activar tu página...</p>}
                {activationVisitState === 'incomplete' || activationVisitState === 'completion' ? <ActivationChecklist activation={activation} error={activationError} onNavigate={goTo} onAcknowledge={() => { activationVisitStateRef.current = 'suppressed'; setActivationVisitState('suppressed'); }} theme={theme} /> : activationError && <p className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800" role="status">{activationError}</p>}
               <PublicLinkUtility activation={activation} publicUrl={publicUrl} copied={copied} onCopy={copyPublicUrl} onShare={sharePublicUrl} theme={theme} />
               {tab === 'services' && <ServicesTab brand={theme} />}
              {tab === 'schedule' && <ScheduleTab brand={theme} />}
              {tab === 'calendar' && <CalendarTab brand={theme} />}
              {tab === 'settings' && <SettingsTab />}
            </section>
          </div>
        </div>
      </div>
      <nav className="fixed bottom-0 inset-x-0 z-50 border-t border-slate-200 bg-[#faf9f6]/95 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden" aria-label="Navegación principal">
        <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">{NAV_ITEMS.map((item) => <NavItem key={item.key} item={item} active={tab === item.key} onClick={() => goTo(item.key)} theme={theme} mobile />)}</div>
      </nav>
    </main>
  );
}

function BrandMark({ avatarUrl, businessName, initial, theme, compact = false }: { avatarUrl?: string | null; businessName: string; initial: string; theme: BrandConfig; compact?: boolean }) {
  return <div className="flex min-w-0 items-center gap-3">{avatarUrl ? <img src={avatarUrl} alt={businessName} className={`${compact ? 'h-9 w-9' : 'h-11 w-11'} rounded-2xl object-cover`} /> : <div className={`${compact ? 'h-9 w-9 text-sm' : 'h-11 w-11 text-base'} flex shrink-0 items-center justify-center rounded-2xl font-bold`} style={{ backgroundImage: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`, color: theme.textOnPrimary }}>{initial}</div>}{!compact && <div className="min-w-0"><p className="truncate text-sm font-bold text-slate-950">{businessName}</p><p className="text-xs text-slate-500">Panel de gestión</p></div>}</div>;
}

function NavItem({ item, active, onClick, theme, mobile = false }: { item: typeof NAV_ITEMS[number]; active: boolean; onClick: () => void; theme: BrandConfig; mobile?: boolean }) {
  return <button type="button" onClick={onClick} aria-current={active ? 'page' : undefined} aria-label={item.label} className={`group relative flex items-center rounded-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${mobile ? 'h-14 w-16 flex-col justify-center gap-1 text-[10px]' : 'w-full gap-3 px-3 py-3 text-left text-sm'} ${active ? 'font-semibold text-slate-950' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`} style={active ? { backgroundColor: `${theme.primary}12` } : undefined}><span style={active ? { color: theme.primary } : undefined}><Icon name={item.icon} size={mobile ? 19 : 18} /></span><span>{item.label}</span>{active && <span className={mobile ? 'absolute bottom-0 h-0.5 w-8 rounded-full' : 'absolute left-0 h-7 w-0.5 rounded-full'} style={{ backgroundColor: theme.primary }} />}</button>;
}

function ActivationChecklist({ activation, error, onNavigate, onAcknowledge, theme }: { activation: ActivationState | null; error: string | null; onNavigate: (tab: TabKey) => void; onAcknowledge: () => void; theme: BrandConfig }) {
  if (error) return <p className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800" role="status">{error}</p>;
  if (!activation) return <p className="mb-6 text-xs text-slate-500" role="status">Revisando los pasos para activar tu página...</p>;
  const items = [{ key: 'serviceConfigured', label: 'Crear tu primer servicio', tab: 'services' as const }, { key: 'workingHoursConfigured', label: 'Definir tus horarios', tab: 'schedule' as const }, { key: 'profileConfigured', label: 'Completar el perfil público', tab: 'settings' as const }] as const;
  const completed = items.filter((item) => activation.checklist[item.key]).length;
  const complete = completed === items.length && activation.checklist.publicLinkAvailable;
  return <section className="mb-8 overflow-hidden rounded-2xl border border-indigo-200 bg-white shadow-[0_12px_35px_rgba(79,70,229,0.08)]"><div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6"><div><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-indigo-700"><span className="h-2 w-2 rounded-full bg-indigo-600" />{complete ? 'Todo listo' : 'Siguiente paso'}</div><p className="mt-2 text-lg font-semibold tracking-[-0.02em] text-slate-950">{complete ? 'Tu página está lista para compartir' : 'Terminá de activar tu página de turnos'}</p><p className="mt-1 text-sm text-slate-500">{completed} de 3 pasos completados.</p></div><div className="min-w-32 text-right"><p className="text-2xl font-semibold text-slate-950">{Math.round((completed / 3) * 100)}%</p><p className="text-xs text-slate-500">completado</p></div></div><div className="h-1 bg-slate-100"><div className="h-full transition-all" style={{ width: `${(completed / 3) * 100}%`, backgroundColor: theme.primary }} /></div><div className="grid gap-2 p-4 sm:grid-cols-3 sm:p-5">{items.map((item) => { const done = activation.checklist[item.key]; return <button key={item.key} type="button" onClick={() => !done && onNavigate(item.tab)} disabled={done} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-left text-xs transition hover:border-indigo-200 hover:bg-indigo-50 disabled:cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"><span className={done ? 'text-emerald-600' : 'text-slate-400'}><Icon name={done ? 'check' : 'arrow'} size={15} /></span><span className={done ? 'text-slate-500 line-through' : 'font-semibold text-slate-800'}>{item.label}</span></button>; })}</div>{complete && <button type="button" onClick={onAcknowledge} className="m-4 rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">Ocultar checklist</button>}</section>;
}

function PublicLinkUtility({ activation, publicUrl, copied, onCopy, onShare, theme }: { activation: ActivationState | null; publicUrl: string; copied: boolean; onCopy: () => void; onShare: () => void; theme: BrandConfig }) {
  if (!activation?.checklist.publicLinkAvailable) return null;
  return <section className="mb-8 rounded-2xl border border-slate-200 bg-white px-5 py-4 sm:px-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><p className="text-xs font-semibold text-slate-700">Tu enlace público</p><a href={publicUrl} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-1 break-all text-xs text-indigo-700 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">{publicUrl}<Icon name="external" size={13} /></a></div><div className="flex gap-2"><button type="button" onClick={onCopy} className="rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">{copied ? 'Copiado' : 'Copiar enlace'}</button><button type="button" onClick={onShare} className="rounded-full px-3 py-2 text-xs font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" style={{ backgroundColor: theme.primary }}>Compartir</button></div></div></section>;
}
