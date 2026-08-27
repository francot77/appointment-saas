'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  normalizeMessagingSettings,
  type MessagingSettingsPayload,
  type MessagingSettingsView,
} from '@/lib/messaging/settings-contract';
import { presentAutomaticMessaging, type EntitlementReadModel } from '@/lib/entitlementPresentation';

const EVENTS = [
  ['confirmed', 'Plantilla de confirmación'],
  ['rescheduled', 'Plantilla de reprogramación'],
  ['reminder', 'Plantilla de recordatorio'],
] as const;

type Props = { className?: string };

function errorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return 'No pudimos cargar la configuración de mensajería. Intentá de nuevo más tarde.';
}

export default function MessagingSettingsCard({ className = '' }: Props) {
  const [view, setView] = useState<MessagingSettingsView | null>(null);
  const [payload, setPayload] = useState<MessagingSettingsPayload | null>(null);
  const [accessToken, setAccessToken] = useState('');
  const [leadTimeMinutes, setLeadTimeMinutes] = useState(60);
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [entitlement, setEntitlement] = useState<EntitlementReadModel | null>(null);

  async function load() {
    try {
      const response = await fetch('/api/admin/messaging/connection');
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Messaging settings are unavailable.');
      const next = normalizeMessagingSettings(json.connection);
      setPayload(json.connection);
      setView(next);
      setEnabled(next.enabled);
      setLeadTimeMinutes(next.leadTimeMinutes);
      setError(next.error || null);
    } catch (loadError) {
      setError(errorMessage(loadError));
    }
  }

  useEffect(() => { void load(); }, []);
  useEffect(() => { void fetch('/api/admin/entitlements').then(async (response) => { if (!response.ok) throw new Error('entitlements'); setEntitlement(await response.json()); }).catch(() => undefined); }, []);

  async function save() {
    if (!payload) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/messaging/connection', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumberId: payload.phoneNumberId,
          wabaId: payload.wabaId,
          enabled,
          leadTimeMinutes,
          templates: payload.templates,
          ...(accessToken ? { accessToken } : {}),
        }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'We could not save messaging settings.');
      setAccessToken('');
      setPayload(json.connection);
      setView(normalizeMessagingSettings(json.connection));
    } catch (saveError) {
      setError(errorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  const automaticMessaging = entitlement ? presentAutomaticMessaging(entitlement) : null;

  return (
    <section className={`rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm sm:p-6 ${className}`} aria-labelledby="messaging-settings-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-content-muted)]">Mensajería automática</p>
          <h3 id="messaging-settings-title" className="mt-1 text-lg font-semibold text-[var(--color-content)]">Conexión de WhatsApp</h3>
          <p className="mt-1 text-sm text-[var(--color-content-muted)]">Usá plantillas aprobadas de Meta para confirmaciones y recordatorios.</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${view?.status === 'connected' ? 'border border-[var(--color-success-border)] bg-[var(--color-success-background)] text-[var(--color-success-foreground)]' : 'bg-[var(--color-surface-muted)] text-[var(--color-content-muted)]'}`}>
          {view?.status === 'connected' ? 'Conectado' : 'Desconectado'}
        </span>
      </div>

      {error && <p className="mt-4 rounded-lg border border-[var(--color-danger-border)] bg-[var(--color-danger-background)] px-3 py-2 text-sm text-[var(--color-danger-foreground)]" role="alert">{error}</p>}

      {automaticMessaging && entitlement && <div className="mt-4 rounded-lg border border-[var(--color-info-border)] bg-[var(--color-info-background)] px-3 py-3 text-sm" role="status"><div className="flex items-center justify-between gap-3"><span className="font-semibold text-[var(--color-content)]">{automaticMessaging.label}</span><span className="text-xs text-[var(--color-content-muted)]">{entitlement.automaticMessaging.accepted} / {entitlement.automaticMessaging.limit} · {entitlement.automaticMessaging.period}</span></div><p className="mt-1 leading-5 text-[var(--color-content-muted)]">{automaticMessaging.detail}</p>{automaticMessaging.upgrade && <Link className="mt-2 inline-block font-semibold text-[var(--color-action)] underline" href="/billing">Mejorar plan</Link>}</div>}

      {view && payload && (
        <>
          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-[var(--color-content-muted)]">ID del remitente</dt><dd className="font-medium text-[var(--color-content)]">{view.phoneNumberId}</dd></div>
            <div><dt className="text-[var(--color-content-muted)]">ID de WABA</dt><dd className="font-medium text-[var(--color-content)]">{view.wabaId}</dd></div>
          </dl>
          <label className="mt-5 flex items-center gap-3 text-sm font-medium text-[var(--color-content)]">
            <input type="checkbox" checked={enabled} disabled={automaticMessaging?.state === 'unavailable'} onChange={(event) => setEnabled(event.target.checked)} />
            Habilitar confirmaciones y recordatorios de turnos
          </label>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="messaging-lead-time" className="text-sm font-medium text-[var(--color-content)]">Anticipación del recordatorio (minutos)</label>
              <input id="messaging-lead-time" type="number" min="0" max="10080" value={leadTimeMinutes} onChange={(event) => setLeadTimeMinutes(Number(event.target.value))} className="mt-2 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-content)] focus:border-[var(--color-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]/40" />
            </div>
            <div>
              <label htmlFor="messaging-access-token" className="text-sm font-medium text-[var(--color-content)]">Token de acceso</label>
              <input id="messaging-access-token" type="password" value={accessToken} onChange={(event) => setAccessToken(event.target.value)} placeholder="Solo escritura; nunca se muestra" className="mt-2 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-content)] placeholder:text-[var(--color-content-muted)] focus:border-[var(--color-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]/40" autoComplete="new-password" />
            </div>
          </div>
          <div className="mt-5 space-y-2">
            <p className="text-sm font-medium text-[var(--color-content)]">Plantillas aprobadas</p>
            {EVENTS.map(([event, label]) => {
              const template = view.templates.find((item) => item.event === event);
              return <div key={event} className="flex items-center justify-between rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"><span className="text-[var(--color-content)]">{label}</span><span className={template?.approved ? 'text-[var(--color-success-foreground)]' : 'text-[var(--color-content-muted)]'}>{template ? (template.approved ? template.name : `${template.name} (${template.status})`) : 'No configurada'}</span></div>;
            })}
          </div>
          <button type="button" onClick={() => void save()} disabled={saving} className="mt-5 rounded-full bg-[var(--color-action)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]/40 disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar configuración de mensajería'}</button>
        </>
      )}
    </section>
  );
}
