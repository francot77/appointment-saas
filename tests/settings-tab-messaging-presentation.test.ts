import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(__dirname, '..');
const settingsTab = readFileSync(resolve(root, 'app/dashboard/SettingsTab.tsx'), 'utf8');
const messagingCard = readFileSync(resolve(root, 'app/dashboard/MessagingSettingsCard.tsx'), 'utf8');
const dashboardClient = readFileSync(resolve(root, 'app/dashboard/DashboardClient.tsx'), 'utf8');

function stickyBarSource() {
  const start = settingsTab.indexOf('<div className="sticky');
  const end = settingsTab.indexOf('</form>', start);
  return settingsTab.slice(start, end);
}

describe('SettingsTab messaging and sticky-save presentation contract', () => {
  it('uses semantic light feedback for every main-save state', () => {
    const bar = stickyBarSource();

    expect(bar).toContain('sticky bottom-3');
    expect(bar).toContain('z-10');
    expect(bar).toContain('sm:flex-row sm:items-center sm:justify-between');
    expect(bar).toContain('border-[var(--color-border)]');
    expect(bar).toContain('bg-[var(--color-surface)]');
    expect(bar).toContain('text-[var(--color-content)]');
    expect(bar).toContain('bg-[var(--color-action)]');
    expect(bar).toContain('focus:ring-[var(--color-focus)]');
    expect(bar).not.toMatch(/(?:slate|amber|emerald|red)-/);
    expect(bar).toContain('aria-live="polite"');
    expect(bar).toContain("saveState === 'unsaved'");
    expect(bar).toContain("saveState === 'saving'");
    expect(bar).toContain("saveState === 'saved'");
    expect(bar).toContain("saveState === 'error'");
    expect(bar).toContain("<Status tone=\"warning\" label=\"Tenés cambios sin guardar.\" />");
    expect(bar).toContain("<Status tone=\"info\" label=\"Guardando cambios...\" />");
    expect(bar).toContain("<Status tone=\"success\" label=\"Todos los cambios están guardados.\" />");
    expect(bar).toContain("<Status tone=\"danger\" label=\"No se pudieron guardar los cambios.\" />");
    expect(bar).toContain('type="submit"');
    expect(bar).toContain('disabled={saving}');
    expect(bar).toContain("{saving ? 'Guardando...' : 'Guardar cambios'}");
  });

  it('preserves the main settings state machine and request contract', () => {
    expect(settingsTab).toContain('export default function SettingsTab()');
    expect(settingsTab).toContain('function update<K extends keyof Settings>');
    expect(settingsTab).toContain("setSaveState('unsaved')");
    expect(settingsTab).toContain("setSaveState('saving')");
    expect(settingsTab).toContain("setSaveState('saved')");
    expect(settingsTab).toContain("setSaveState('error')");
    expect(settingsTab).toContain("fetch('/api/admin/settings'");
    expect(settingsTab).toContain("method: 'PUT'");
    expect(settingsTab).toContain("'Content-Type': 'application/json'");
    expect(settingsTab).toContain('body: JSON.stringify(settings)');
    expect(settingsTab).toContain('const [saving, setSaving]');
    expect(settingsTab).toContain('const [saveState, setSaveState]');
    expect(settingsTab).toContain('<MessagingSettingsCard />');
    expect(settingsTab).toContain('aria-labelledby="public-page-title"');
    expect(settingsTab).toContain('aria-labelledby="appearance-title"');
    expect(settingsTab).toContain('aria-labelledby="about-title"');
    expect(settingsTab).toContain('aria-labelledby="sharing-title"');
  });

  it('keeps messaging ownership, fields, copy, and APIs independent', () => {
    expect(messagingCard).toContain('const [error, setError]');
    expect(messagingCard).toContain('const [saving, setSaving]');
    expect(messagingCard).toContain("fetch('/api/admin/messaging/connection'");
    expect(messagingCard).toContain("fetch('/api/admin/entitlements'");
    expect(messagingCard).toContain("method: 'PUT'");
    expect(messagingCard).toContain('phoneNumberId: payload.phoneNumberId');
    expect(messagingCard).toContain('wabaId: payload.wabaId');
    expect(messagingCard).toContain('enabled,');
    expect(messagingCard).toContain('leadTimeMinutes,');
    expect(messagingCard).toContain('templates: payload.templates');
    expect(messagingCard).toContain('...(accessToken ? { accessToken } : {})');
    expect(messagingCard).toContain('min="0" max="10080"');
    expect(messagingCard).toContain('autoComplete="new-password"');
    expect(messagingCard).toContain("['confirmed', 'Confirmation template']");
    expect(messagingCard).toContain("['rescheduled', 'Reschedule template']");
    expect(messagingCard).toContain("['reminder', 'Reminder template']");
    expect(messagingCard).toContain('disabled={saving}');
    expect(messagingCard).toContain('Save messaging settings');
    expect(settingsTab).toContain('<MessagingSettingsCard />');
    expect(settingsTab).not.toContain('<MessagingSettingsCard saving=');
  });

  it('preserves the no-props parent contract and excludes browser claims', () => {
    expect(dashboardClient).toContain("{tab === 'settings' && <SettingsTab />}");
    expect(settingsTab).not.toContain('window.getComputedStyle');
    expect(settingsTab).not.toContain('contrast');
  });
});
