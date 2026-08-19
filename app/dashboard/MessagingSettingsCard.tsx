'use client';

import { useEffect, useState } from 'react';
import {
  normalizeMessagingSettings,
  type MessagingSettingsPayload,
  type MessagingSettingsView,
} from '@/lib/messaging/settings-contract';

const EVENTS = [
  ['confirmed', 'Confirmation template'],
  ['rescheduled', 'Reschedule template'],
  ['reminder', 'Reminder template'],
] as const;

type Props = { className?: string };

function errorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return 'We could not load messaging settings. Try again later.';
}

export default function MessagingSettingsCard({ className = '' }: Props) {
  const [view, setView] = useState<MessagingSettingsView | null>(null);
  const [payload, setPayload] = useState<MessagingSettingsPayload | null>(null);
  const [accessToken, setAccessToken] = useState('');
  const [leadTimeMinutes, setLeadTimeMinutes] = useState(60);
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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

  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 ${className}`} aria-labelledby="messaging-settings-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Automatic messaging</p>
          <h3 id="messaging-settings-title" className="mt-1 text-lg font-semibold text-slate-950">WhatsApp connection</h3>
          <p className="mt-1 text-sm text-slate-500">Use approved Meta templates for confirmations and reminders.</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${view?.status === 'connected' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
          {view?.status === 'connected' ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}

      {view && payload && (
        <>
          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-slate-500">Sender ID</dt><dd className="font-medium text-slate-900">{view.phoneNumberId}</dd></div>
            <div><dt className="text-slate-500">WABA ID</dt><dd className="font-medium text-slate-900">{view.wabaId}</dd></div>
          </dl>
          <label className="mt-5 flex items-center gap-3 text-sm font-medium text-slate-800">
            <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
            Enable appointment confirmations and reminders
          </label>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="messaging-lead-time" className="text-sm font-medium text-slate-800">Reminder lead time (minutes)</label>
              <input id="messaging-lead-time" type="number" min="0" max="10080" value={leadTimeMinutes} onChange={(event) => setLeadTimeMinutes(Number(event.target.value))} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label htmlFor="messaging-access-token" className="text-sm font-medium text-slate-800">Access token</label>
              <input id="messaging-access-token" type="password" value={accessToken} onChange={(event) => setAccessToken(event.target.value)} placeholder="Write-only; never displayed" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" autoComplete="new-password" />
            </div>
          </div>
          <div className="mt-5 space-y-2">
            <p className="text-sm font-medium text-slate-800">Approved templates</p>
            {EVENTS.map(([event, label]) => {
              const template = view.templates.find((item) => item.event === event);
              return <div key={event} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm"><span className="text-slate-700">{label}</span><span className={template?.approved ? 'text-emerald-700' : 'text-slate-500'}>{template ? (template.approved ? template.name : `${template.name} (${template.status})`) : 'Not configured'}</span></div>;
            })}
          </div>
          <button type="button" onClick={() => void save()} disabled={saving} className="mt-5 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Saving...' : 'Save messaging settings'}</button>
        </>
      )}
    </section>
  );
}
