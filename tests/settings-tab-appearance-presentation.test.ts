import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const settingsTab = readFileSync(
  resolve(process.cwd(), 'app/dashboard/SettingsTab.tsx'),
  'utf8',
);
const dashboardClient = readFileSync(
  resolve(process.cwd(), 'app/dashboard/DashboardClient.tsx'),
  'utf8',
);
const appearance = settingsTab.slice(
  settingsTab.lastIndexOf('aria-labelledby="appearance-title"'),
  settingsTab.indexOf('aria-labelledby="about-title"'),
);

describe('settings tab appearance presentation contract', () => {
  it('uses semantic light product chrome without taking ownership of tenant colors', () => {
    for (const token of [
      'bg-[var(--color-surface)]',
      'bg-[var(--color-surface-muted)]',
      'border-[var(--color-border)]',
      'text-[var(--color-content)]',
      'text-[var(--color-content-muted)]',
      'border-[var(--color-focus)]',
      'focus:ring-[var(--color-focus)]/40',
    ]) {
      expect(appearance).toContain(token);
    }
    expect(appearance).not.toMatch(/bg-slate-|border-slate-|text-slate-/);
    expect(appearance).toContain('style={{ backgroundColor: primary }}');
    expect(appearance).toContain('style={{ backgroundColor: secondary }}');
  });

  it('preserves preset tuples, selection, and raw custom color updates', () => {
    for (const value of [
      "['Clásico', '#2563eb', '#dbeafe', '#0f172a']",
      "['Cálido', '#c2410c', '#ffedd5', '#431407']",
      "['Natural', '#15803d', '#dcfce7', '#14532d']",
      "update('primaryColor', primary)",
      "update('secondaryColor', secondary)",
      "update('textColor', text)",
      'settings.primaryColor === primary && settings.secondaryColor === secondary && settings.textColor === text',
    ]) {
      expect(appearance).toContain(value);
    }
    expect(appearance).toContain("type=\"color\"");
    expect(appearance).toContain("value={settings[key]}");
    expect(appearance).toContain("onChange={(e) => update(key, e.target.value)}");
  });

  it('preserves exclusive background branches and the always-visible logo control', () => {
    for (const value of [
      "(['solid', 'gradient', 'image'] as const)",
      "update('backgroundType', t)",
      "settings.backgroundType === 'solid'",
      "update('backgroundColor', e.target.value)",
      "settings.backgroundType === 'gradient'",
      "update('gradientFrom', e.target.value)",
      "update('gradientTo', e.target.value)",
      "settings.backgroundType === 'image'",
      "update('backgroundImageUrl', e.target.value)",
      'id="logoUrl"',
      "update('logoUrl', e.target.value)",
    ]) {
      expect(appearance).toContain(value);
    }
  });

  it('preserves submission, feedback, copy, ownership, and deferred boundaries', () => {
    for (const value of [
      'function update<K extends keyof Settings>',
      'body: JSON.stringify(settings)',
      "method: 'PUT'",
      "setSaveState('unsaved')",
      "setSaveState('saving')",
      "setSaveState('saved')",
      "setSaveState('error')",
      'navigator.clipboard.writeText(`${window.location.origin}/${publicSlug}`)',
      "<MessagingSettingsCard />",
      'className="sticky bottom-3',
      'export default function SettingsTab()',
    ]) {
      expect(settingsTab).toContain(value);
    }
    expect(settingsTab).not.toMatch(/contrastRatio|readableText|contrast.*4\.5|4\.5.*contrast/i);
    expect(dashboardClient).toContain('<SettingsTab />');
  });
});
