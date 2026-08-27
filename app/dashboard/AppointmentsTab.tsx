import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminAppointment, BrandConfig, DEFAULT_BRAND } from './types';

type Slot = { startTime: string; endTime: string };
type ViewMode = 'day' | 'week';
type StatusFilter = 'request' | 'confirmed' | 'all';
type PendingAction = { kind: 'reminder' | 'status'; appointment: AdminAppointment; action?: 'confirm' | 'reject' };
type ErrorArea = 'appointments' | 'summary' | 'action' | 'slots' | 'reschedule';

function ownerErrorMessage(status: number, area: ErrorArea) {
  if (status === 401) return 'Tu sesión venció. Iniciá sesión nuevamente para continuar.';
  if (status === 402) return 'Tu acceso está pausado por el estado de tu plan. Revisá Facturación para recuperar la gestión de turnos.';
  if (status === 403) return 'No tenés permiso para gestionar estos turnos. Revisá la cuenta del negocio o contactá soporte.';
  if (status === 404) return area === 'slots' ? 'No encontramos el servicio elegido. Cerrá este diálogo y actualizá la agenda.' : 'El turno ya no está disponible. Actualizá la agenda e intentá nuevamente.';
  if (status === 409) return area === 'reschedule' ? 'Ese horario ya no está disponible. Elegí otro horario e intentá nuevamente.' : 'El turno cambió mientras lo gestionabas. Actualizá la agenda e intentá nuevamente.';
  if (status >= 500) return 'Tuvimos un problema al conectar con la agenda. Revisá tu conexión e intentá nuevamente.';
  if (area === 'summary') return 'No pudimos cargar el resumen de tu agenda. Revisá tu conexión e intentá nuevamente.';
  if (area === 'slots') return 'No pudimos cargar los horarios disponibles. Revisá tu conexión e intentá nuevamente.';
  if (area === 'reschedule') return 'No pudimos reprogramar el turno. Revisá los datos e intentá nuevamente.';
  if (area === 'action') return 'No pudimos completar la acción. Revisá tu conexión e intentá nuevamente.';
  return 'No pudimos cargar los turnos. Revisá tu conexión e intentá nuevamente.';
}

function dateParts(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return { year, month, day };
}

function localDateString(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  const { year, month, day } = dateParts(date.toISOString().slice(0, 10));
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getWeekRange(dateStr: string) {
  const date = new Date(`${dateStr}T00:00:00`);
  const monday = new Date(date);
  monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { from: monday.toISOString().slice(0, 10), to: sunday.toISOString().slice(0, 10) };
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${date}T00:00:00`));
}

function formatShortDate(date: string) {
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit' }).format(new Date(`${date}T00:00:00`));
}

function statusLabel(status: AdminAppointment['status']) {
  return { request: 'Pendiente', confirmed: 'Confirmado', cancelled: 'Cancelado', rejected: 'Rechazado' }[status];
}

function durationLabel(appt: AdminAppointment) {
  if (!appt.endTime) return null;
  const [startHour, startMinute] = appt.startTime.split(':').map(Number);
  const [endHour, endMinute] = appt.endTime.split(':').map(Number);
  const minutes = endHour * 60 + endMinute - (startHour * 60 + startMinute);
  return minutes > 0 ? `${minutes} min` : null;
}

export default function AppointmentsTab({ brand }: { brand?: BrandConfig }) {
  const theme = brand ?? DEFAULT_BRAND;
  const [date, setDate] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('request');
  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [summary, setSummary] = useState<{ today: AdminAppointment[]; tomorrow: AdminAppointment[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rescheduleAppt, setRescheduleAppt] = useState<AdminAppointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleSlots, setRescheduleSlots] = useState<Slot[]>([]);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);
  const [rescheduleMessage, setRescheduleMessage] = useState<string | null>(null);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [rescheduleSaving, setRescheduleSaving] = useState(false);

  useEffect(() => setDate(localDateString()), []);
  // The loader intentionally follows the three user-controlled filters.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (date) void loadAppointments(); }, [date, statusFilter, viewMode]);
  useEffect(() => { void loadSummary(); }, []);

  async function loadAppointments() {
    setLoading(true); setError(null);
    let failureMessage = ownerErrorMessage(0, 'appointments');
    try {
      const params = new URLSearchParams({ status: statusFilter });
      if (viewMode === 'day') params.set('date', date);
      else { const range = getWeekRange(date); params.set('from', range.from); params.set('to', range.to); }
      const response = await fetch(`/api/admin/appointments?${params}`);
      const json = await response.json();
      if (!response.ok) {
        console.error('GET /api/admin/appointments failed', { status: response.status, code: json.code, error: json.error });
        failureMessage = ownerErrorMessage(response.status, 'appointments');
        throw new Error('Appointment list request failed');
      }
      setAppointments((json.appointments || []).filter((appt: AdminAppointment) => {
        if (appt.date !== localDateString()) return true;
        return new Date(`${appt.date}T${appt.endTime}:00`) >= new Date();
      }));
    } catch (cause) { console.error(cause); setAppointments([]); setError(failureMessage); }
    finally { setLoading(false); }
  }

  async function loadSummary() {
    setLoadingSummary(true); setSummaryError(null);
    let failureMessage = ownerErrorMessage(0, 'summary');
    try {
      const today = localDateString(); const tomorrow = localDateString(1);
      const [todayResponse, tomorrowResponse] = await Promise.all([
        fetch(`/api/admin/appointments?status=all&date=${today}`),
        fetch(`/api/admin/appointments?status=confirmed&date=${tomorrow}`),
      ]);
      const [todayJson, tomorrowJson] = await Promise.all([todayResponse.json(), tomorrowResponse.json()]);
      if (!todayResponse.ok || !tomorrowResponse.ok) {
        const failedResponse = todayResponse.ok ? tomorrowResponse : todayResponse;
        const failedJson = todayResponse.ok ? tomorrowJson : todayJson;
        console.error('GET /api/admin/appointments summary failed', { status: failedResponse.status, code: failedJson.code, error: failedJson.error });
        failureMessage = ownerErrorMessage(failedResponse.status, 'summary');
        throw new Error('Appointment summary request failed');
      }
      setSummary({ today: todayJson.appointments || [], tomorrow: tomorrowJson.appointments || [] });
    } catch (cause) { console.error(cause); setSummary(null); setSummaryError(failureMessage); }
    finally { setLoadingSummary(false); }
  }

  async function executePendingAction() {
    if (!pendingAction) return;
    setActionLoading(true); setFeedback(null);
    const { appointment, kind, action } = pendingAction;
    let failureMessage = ownerErrorMessage(0, 'action');
    try {
      const response = await fetch(`/api/admin/appointments/${appointment.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: kind === 'reminder' ? 'remind' : action }),
      });
      const json = await response.json();
      if (!response.ok) {
        console.error('PATCH /api/admin/appointments/[id] failed', { status: response.status, code: json.code, error: json.error });
        failureMessage = ownerErrorMessage(response.status, 'action');
        throw new Error('Appointment action request failed');
      }
      if (json.waUrl) window.open(json.waUrl, '_blank', 'noopener,noreferrer');
      if (kind === 'status') {
        setAppointments((current) => current.map((item) => item.id === appointment.id ? { ...item, status: json.status } : item));
        setFeedback(json.status === 'confirmed' ? (json.waUrl ? 'Turno confirmado. Se abrió WhatsApp para continuar la comunicación.' : 'Turno confirmado. No hay un enlace telefónico utilizable para abrir WhatsApp.') : 'Solicitud rechazada.');
      } else {
        setFeedback(json.waUrl ? 'WhatsApp se abrió para enviar el recordatorio manual.' : 'El recordatorio fue registrado, pero no hay un enlace telefónico utilizable para abrir WhatsApp.');
        setSummary((current) => current ? { today: current.today.map((item) => item.id === appointment.id ? { ...item, reminderSent: json.reminderSent } : item), tomorrow: current.tomorrow } : current);
      }
      setPendingAction(null); void loadSummary();
    } catch (cause) { console.error(cause); setFeedback(failureMessage); }
    finally { setActionLoading(false); }
  }

  function openReschedule(appt: AdminAppointment) { setRescheduleAppt(appt); setRescheduleDate(appt.date); setRescheduleTime(appt.startTime); setRescheduleSlots([]); setRescheduleError(null); setRescheduleMessage(null); }
  function closeReschedule() { setRescheduleAppt(null); setRescheduleDate(''); setRescheduleTime(''); setRescheduleSlots([]); setRescheduleError(null); setRescheduleMessage(null); }

  async function loadSlots() {
    if (!rescheduleAppt || !rescheduleDate) { setRescheduleError('Elegí una fecha para ver horarios disponibles.'); return; }
    setRescheduleLoading(true); setRescheduleError(null); setRescheduleMessage(null);
    let failureMessage = ownerErrorMessage(0, 'slots');
    try {
      const response = await fetch(`/api/admin/availability?date=${rescheduleDate}&serviceId=${rescheduleAppt.serviceId}`);
      const json = await response.json();
      if (!response.ok) {
        console.error('GET /api/admin/availability failed', { status: response.status, code: json.code, error: json.error });
        failureMessage = ownerErrorMessage(response.status, 'slots');
        throw new Error('Availability request failed');
      }
      const slots: Slot[] = json.slots || []; setRescheduleSlots(slots); if (!slots.length) setRescheduleMessage('No hay horarios disponibles para esa fecha.');
    } catch (cause) { console.error(cause); setRescheduleError(failureMessage); }
    finally { setRescheduleLoading(false); }
  }

  async function submitReschedule(event: FormEvent) {
    event.preventDefault(); if (!rescheduleAppt || !rescheduleDate || !rescheduleTime) { setRescheduleError('Elegí la nueva fecha y horario.'); return; }
    setRescheduleSaving(true); setRescheduleError(null);
    let failureMessage = ownerErrorMessage(0, 'reschedule');
    try {
      const response = await fetch(`/api/admin/appointments/${rescheduleAppt.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'reschedule', newDate: rescheduleDate, newStartTime: rescheduleTime }) });
      const json = await response.json();
      if (!response.ok) {
        console.error('PATCH /api/admin/appointments/[id] reschedule failed', { status: response.status, code: json.code, error: json.error });
        failureMessage = ownerErrorMessage(response.status, 'reschedule');
        throw new Error('Appointment reschedule request failed');
      }
      if (json.waUrl) window.open(json.waUrl, '_blank', 'noopener,noreferrer');
      setAppointments((current) => current.map((item) => item.id === rescheduleAppt.id ? { ...item, date: json.date, startTime: json.startTime, endTime: json.endTime } : item));
      closeReschedule(); setFeedback(json.waUrl ? 'Turno reprogramado. WhatsApp se abrió para comunicar el cambio manualmente.' : 'Turno reprogramado. El cambio fue registrado, pero no hay un enlace telefónico utilizable para abrir WhatsApp.'); void loadSummary();
    } catch (cause) { console.error(cause); setRescheduleError(failureMessage); }
    finally { setRescheduleSaving(false); }
  }

  const weekLabel = date && viewMode === 'week' ? (() => { const range = getWeekRange(date); return `${formatShortDate(range.from)} al ${formatShortDate(range.to)}`; })() : null;
  const requestCount = summary?.today.filter((appt) => appt.status === 'request').length ?? 0;

  return <div className="space-y-6 text-slate-900">
    <section className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-[0_12px_35px_rgba(79,70,229,0.07)] sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-700">Prioridad de hoy</p><h2 className="mt-2 text-xl font-semibold tracking-[-0.02em]">{requestCount ? `${requestCount} solicitud${requestCount === 1 ? '' : 'es'} necesita${requestCount === 1 ? '' : 'n'} tu respuesta` : 'Tu agenda de hoy y mañana'}</h2><p className="mt-1 text-sm text-slate-500">Revisá las solicitudes antes de atender tu agenda confirmada.</p></div><button type="button" onClick={() => void loadSummary()} className="min-h-11 rounded-full border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:border-indigo-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">Actualizar</button></div>
      {summaryError && <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800" role="alert">{summaryError} <button type="button" className="ml-2 font-semibold underline" onClick={() => void loadSummary()}>Reintentar</button></p>}
      {loadingSummary && <p className="mt-4 text-sm text-slate-500" role="status">Cargando agenda de hoy y mañana...</p>}
      {summary && <div className="mt-5 grid gap-4 md:grid-cols-2"><SummaryDay label="Hoy" date={summary.today[0]?.date || localDateString()} appointments={summary.today} theme={theme} onReminder={(appt) => setPendingAction({ kind: 'reminder', appointment: appt })} /><SummaryDay label="Mañana" date={summary.tomorrow[0]?.date || localDateString(1)} appointments={summary.tomorrow} theme={theme} onReminder={(appt) => setPendingAction({ kind: 'reminder', appointment: appt })} /></div>}
    </section>
    {feedback && <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">{feedback}</p>}
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Agenda</p><h2 className="mt-1 text-xl font-semibold tracking-[-0.02em]">Todos tus turnos</h2></div><div className="grid min-w-0 w-full gap-4 sm:grid-cols-2 xl:w-auto xl:grid-cols-[minmax(10rem,12rem)_minmax(12rem,auto)_minmax(20rem,auto)]"><label className="min-w-0 text-sm font-semibold text-slate-700">Fecha<input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-1 block min-w-0 max-w-full min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-normal focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200" /></label><fieldset className="min-w-0"><legend className="text-sm font-semibold text-slate-700">Período</legend><div className="mt-1 flex min-w-0 flex-wrap rounded-xl border border-slate-300 p-1"><Toggle active={viewMode === 'day'} onClick={() => setViewMode('day')}>Día</Toggle><Toggle active={viewMode === 'week'} onClick={() => setViewMode('week')}>Semana</Toggle></div></fieldset><fieldset className="min-w-0"><legend className="text-sm font-semibold text-slate-700">Estado</legend><div className="mt-1 flex min-w-0 flex-wrap rounded-xl border border-slate-300 p-1"><Toggle active={statusFilter === 'request'} onClick={() => setStatusFilter('request')}>Pendientes</Toggle><Toggle active={statusFilter === 'confirmed'} onClick={() => setStatusFilter('confirmed')}>Confirmados</Toggle><Toggle active={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>Todos</Toggle></div></fieldset></div></div>{weekLabel && <p className="mt-4 text-sm text-slate-500">Semana del {weekLabel}</p>}
      {loading && <p className="mt-5 text-sm text-slate-500" role="status">Cargando turnos...</p>}{error && <p className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">{error} <button type="button" className="ml-2 font-semibold underline" onClick={() => void loadAppointments()}>Reintentar</button></p>}{!loading && !error && !appointments.length && <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center"><p className="text-base font-semibold text-slate-800">No hay turnos en esta vista</p><p className="mt-1 text-sm text-slate-500">Probá otro estado, fecha o vista para revisar la agenda.</p></div>}
      <div className="mt-5 space-y-3">{appointments.map((appt) => <AppointmentCard key={appt.id} appointment={appt} theme={theme} onAction={(action) => setPendingAction({ kind: 'status', appointment: appt, action })} onReschedule={() => openReschedule(appt)} />)}</div>
    </section>
    {pendingAction && <ConfirmationDialog pending={pendingAction} loading={actionLoading} onCancel={() => setPendingAction(null)} onConfirm={() => void executePendingAction()} />}
    {rescheduleAppt && <RescheduleDialog appointment={rescheduleAppt} date={rescheduleDate} time={rescheduleTime} slots={rescheduleSlots} error={rescheduleError} message={rescheduleMessage} loading={rescheduleLoading} saving={rescheduleSaving} theme={theme} onClose={closeReschedule} onSubmit={submitReschedule} onDateChange={(value) => { setRescheduleDate(value); setRescheduleSlots([]); setRescheduleMessage(null); }} onTimeChange={setRescheduleTime} onLoadSlots={() => void loadSlots()} />}
  </div>;
}

function Toggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) { return <button type="button" aria-pressed={active} onClick={onClick} className={`min-h-11 min-w-0 flex-1 whitespace-normal rounded-lg px-2 text-center leading-tight text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 sm:px-3 ${active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{children}</button>; }

function SummaryDay({ label, date, appointments, theme, onReminder }: { label: string; date: string; appointments: AdminAppointment[]; theme: BrandConfig; onReminder: (appointment: AdminAppointment) => void }) { return <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-baseline justify-between gap-3"><div><h3 className="text-base font-semibold text-slate-900">{label}</h3><p className="text-sm capitalize text-slate-500">{formatDate(date)}</p></div><span className="text-sm font-semibold text-slate-500">{appointments.length} {appointments.length === 1 ? 'turno' : 'turnos'}</span></div>{!appointments.length ? <p className="mt-4 text-sm text-slate-500">No hay turnos para este día.</p> : <ul className="mt-4 space-y-3">{appointments.map((appt) => <li key={appt.id} className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900"><span style={{ color: theme.primary }}>{appt.startTime}</span> · {appt.clientName}</p><p className="truncate text-sm text-slate-500">{appt.serviceName} <span className="sr-only">Estado: </span><span className="font-medium text-slate-700">({statusLabel(appt.status)})</span></p></div>{appt.status === 'confirmed' && <button type="button" onClick={() => onReminder(appt)} className="min-h-10 shrink-0 rounded-full border px-3 text-sm font-semibold hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" style={{ borderColor: theme.primary, color: theme.primary }}>{appt.reminderSent ? 'Reenviar WhatsApp' : 'Recordar por WhatsApp'}</button>}</li>)}</ul>}</div>; }

function AppointmentCard({ appointment: appt, theme, onAction, onReschedule }: { appointment: AdminAppointment; theme: BrandConfig; onAction: (action: 'confirm' | 'reject') => void; onReschedule: () => void }) { return <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5" style={{ borderLeftWidth: 4, borderLeftColor: appt.serviceColor || theme.primary }}><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-x-3 gap-y-1"><p className="text-sm font-medium capitalize text-slate-500">{formatDate(appt.date)}</p><p className="text-lg font-semibold" style={{ color: theme.primary }}>{appt.startTime}{appt.endTime ? ` - ${appt.endTime}` : ''}</p><span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700"><span className="sr-only">Estado: </span>{statusLabel(appt.status)}</span></div><h3 className="mt-3 text-lg font-semibold text-slate-950">{appt.clientName}</h3><p className="mt-1 text-sm text-slate-600">{appt.serviceName}{durationLabel(appt) ? ` · ${durationLabel(appt)}` : ''}{appt.clientPhone ? ` · ${appt.clientPhone}` : ''}</p>{appt.notes && <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{appt.notes}</p>}<div className="mt-4 flex flex-wrap gap-3"><Link href={`/dashboard/appointments/${appt.id}`} className="inline-flex min-h-11 items-center rounded-full border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:border-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">Ver detalle</Link>{(appt.status === 'request' || appt.status === 'confirmed') && <button type="button" onClick={onReschedule} className="min-h-11 rounded-full border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:border-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">Reprogramar</button>}</div></div>{appt.status === 'request' && <div className="flex w-full gap-2 lg:w-auto"><button type="button" onClick={() => onAction('confirm')} className="min-h-11 flex-1 rounded-full px-4 text-sm font-semibold shadow-sm hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 lg:flex-none" style={{ backgroundColor: theme.primary, color: theme.textOnPrimary }}>Confirmar</button><button type="button" onClick={() => onAction('reject')} className="min-h-11 flex-1 rounded-full border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 lg:flex-none">Rechazar</button></div>}</div></article>; }

function ConfirmationDialog({ pending, loading, onCancel, onConfirm }: { pending: PendingAction; loading: boolean; onCancel: () => void; onConfirm: () => void }) { const isReminder = pending.kind === 'reminder'; const actionText = pending.action === 'confirm' ? 'confirmar' : 'rechazar'; return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="presentation"><div role="dialog" aria-modal="true" aria-labelledby="appointment-confirm-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><h2 id="appointment-confirm-title" className="text-lg font-semibold text-slate-950">{isReminder ? 'Enviar recordatorio por WhatsApp' : `¿Querés ${actionText} este turno?`}</h2><p className="mt-2 text-sm text-slate-600">{isReminder ? `Se abrirá WhatsApp para que envíes manualmente el recordatorio a ${pending.appointment.clientName}.` : `${pending.appointment.clientName} · ${formatDate(pending.appointment.date)} a las ${pending.appointment.startTime}.`}</p><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onCancel} className="min-h-11 rounded-full border border-slate-300 px-4 text-sm font-semibold text-slate-700">Cancelar</button><button type="button" autoFocus onClick={onConfirm} disabled={loading} className="min-h-11 rounded-full bg-slate-900 px-4 text-sm font-semibold text-white disabled:opacity-60">{loading ? 'Procesando...' : isReminder ? 'Abrir WhatsApp' : `Sí, ${actionText}`}</button></div></div></div>; }

function RescheduleDialog({ appointment, date, time, slots, error, message, loading, saving, theme, onClose, onSubmit, onDateChange, onTimeChange, onLoadSlots }: { appointment: AdminAppointment; date: string; time: string; slots: Slot[]; error: string | null; message: string | null; loading: boolean; saving: boolean; theme: BrandConfig; onClose: () => void; onSubmit: (event: FormEvent) => void; onDateChange: (value: string) => void; onTimeChange: (value: string) => void; onLoadSlots: () => void }) { return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"><div role="dialog" aria-modal="true" aria-labelledby="reschedule-title" className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><h2 id="reschedule-title" className="text-lg font-semibold text-slate-950">Reprogramar turno</h2><p className="mt-1 text-sm text-slate-500">{appointment.clientName} · {appointment.serviceName}</p></div><button type="button" onClick={onClose} aria-label="Cerrar reprogramación" className="min-h-11 min-w-11 rounded-full text-xl text-slate-500 hover:bg-slate-100">×</button></div><form onSubmit={onSubmit} className="mt-6 space-y-4"><label className="block text-sm font-semibold text-slate-700">Nueva fecha<input type="date" value={date} onChange={(event) => onDateChange(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 font-normal" /></label><div><p className="text-sm font-semibold text-slate-700">Horarios disponibles</p><button type="button" onClick={onLoadSlots} disabled={loading || !date} className="mt-2 min-h-11 rounded-full border border-slate-300 px-4 text-sm font-semibold text-slate-700 disabled:opacity-50">{loading ? 'Buscando horarios...' : 'Ver horarios disponibles'}</button>{slots.length > 0 && <div className="mt-3 grid grid-cols-3 gap-2">{slots.map((slot) => <button type="button" key={slot.startTime} onClick={() => onTimeChange(slot.startTime)} aria-pressed={time === slot.startTime} className="min-h-11 rounded-xl border text-sm font-semibold" style={time === slot.startTime ? { backgroundColor: theme.primary, borderColor: theme.primary, color: theme.textOnPrimary } : undefined}>{slot.startTime}</button>)}</div>}{message && <p className="mt-2 text-sm text-slate-500">{message}</p>}</div><label className="block text-sm font-semibold text-slate-700">Horario<input type="time" value={time} onChange={(event) => onTimeChange(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 font-normal" /></label>{error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700" role="alert">{error}</p>}<div className="flex justify-end gap-3"><button type="button" onClick={onClose} className="min-h-11 rounded-full border border-slate-300 px-4 text-sm font-semibold text-slate-700">Cancelar</button><button type="submit" disabled={saving} className="min-h-11 rounded-full px-4 text-sm font-semibold disabled:opacity-60" style={{ backgroundColor: theme.primary, color: theme.textOnPrimary }}>{saving ? 'Guardando...' : 'Guardar cambio'}</button></div></form></div></div>; }
