import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const settingsTab = readFileSync(
  resolve(process.cwd(), 'app/dashboard/SettingsTab.tsx'),
  'utf8',
);
const publicPresentation = settingsTab.slice(
  settingsTab.indexOf('if (loading && !settings)'),
  settingsTab.indexOf('<MessagingSettingsCard />'),
);
const publicForm = settingsTab.slice(
  settingsTab.indexOf('<form onSubmit={handleSave}'),
  settingsTab.indexOf('<section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6" aria-labelledby="appearance-title">'),
);
const aboutAndSharing = settingsTab.slice(
  settingsTab.indexOf('aria-labelledby="about-title"'),
  settingsTab.indexOf('<div className="sticky bottom-3'),
);

describe('settings tab public presentation contract', () => {
  it('uses shared feedback primitives and semantic light tokens for migrated states', () => {
    expect(settingsTab).toMatch(
      /import \{[\s\S]*Alert[\s\S]*EmptyState[\s\S]*LoadingState[\s\S]*Status[\s\S]*\} from ['"]\.\.\/components\/ui\/feedback['"]/,
    );
    expect(publicPresentation).toContain('<LoadingState label="Cargando configuración..." />');
    expect(publicPresentation).toContain('<EmptyState title="No se pudo cargar la configuración." />');
    expect(publicPresentation).toContain('<Alert tone="danger" role="alert">{error}</Alert>');
    expect(publicPresentation).toContain('bg-[var(--color-canvas)]');
    expect(publicPresentation).toContain('border-[var(--color-border)]');
    expect(publicPresentation).toContain('text-[var(--color-content)]');
    expect(publicPresentation).toContain('text-[var(--color-content-muted)]');
    expect(publicPresentation).not.toMatch(/bg-slate-|text-slate-|border-slate-|text-red-/);
    for (const section of [publicForm, aboutAndSharing]) {
      expect(section).toContain('bg-[var(--color-surface)]');
      expect(section).toContain('border-[var(--color-border)]');
      expect(section).toContain('text-[var(--color-content)]');
      expect(section).toContain('text-[var(--color-content-muted)]');
      expect(section).not.toMatch(/bg-slate-|text-slate-|border-slate-|text-red-|text-emerald-/);
    }
  });

  it('preserves public fields, setup feedback, preview, and slug feedback copy', () => {
    for (const id of [
      'publicName',
      'heroTitle',
      'heroSubtitle',
      'ctaLabel',
      'aboutTitle',
      'aboutText',
      'whatsappNumber',
      'instagramHandle',
      'address',
      'slug',
    ]) {
      expect(settingsTab).toContain(`id="${id}"`);
    }
    expect(settingsTab).toContain('settings.aboutEnabled &&');
    expect(settingsTab).toContain('Página lista para compartir');
    expect(settingsTab).toContain('Falta completar algunos datos');
    expect(settingsTab).toContain('navigator.clipboard.writeText(`${window.location.origin}/${publicSlug}`)');
    expect(aboutAndSharing).toContain('Esta dirección está disponible.');
    expect(aboutAndSharing).toContain('Revisando disponibilidad...');
    expect(settingsTab).toContain('URL actualizada.');
    expect(aboutAndSharing).toContain('Solo letras, números y guiones.');
    expect(aboutAndSharing).toMatch(/aria-live="polite"/);
  });

  it('preserves settings and slug request, debounce, cancellation, ownership, and save contracts', () => {
    expect(settingsTab).toContain("fetch('/api/admin/settings')");
    expect(settingsTab).toContain("method: 'PUT'");
    expect(settingsTab).toContain('body: JSON.stringify(settings)');
    expect(settingsTab).toContain("fetch('/api/admin/slug')");
    expect(settingsTab).toContain('fetch(`/api/admin/slug?slug=${encodeURIComponent(value)}`)');
    expect(settingsTab).toContain("method: 'PATCH'");
    expect(settingsTab).toContain('body: JSON.stringify({ slug: normalizeSlugInput(slug) })');
    expect(settingsTab).toContain('}, 450);');
    expect(settingsTab).toContain('let cancelled = false;');
    expect(settingsTab).toContain('cancelled = true;');
    expect(settingsTab).toContain("code: 'OWN'");
    expect(settingsTab).toContain('slugSaving || slugChecking || !slug || (slugCheck ? !slugCheck.available : true) || slugIsOwned');
    expect(settingsTab).toContain("setSaveState('unsaved')");
    expect(settingsTab).toContain("setSaveState('saving')");
    expect(settingsTab).toContain("setSaveState('saved')");
    expect(settingsTab).toContain("setSaveState('error')");
  });

  it('canonicalizes slug ownership, availability, save gating, and submission', () => {
    expect(settingsTab).toContain("import { normalizeSlugInput } from '../../lib/slug'");
    expect(settingsTab).toContain('const candidate = normalizeSlugInput(slug)');
    expect(settingsTab).toContain('const ownedSlug = normalizeSlugInput(persistedSlug)');
    expect(settingsTab).toContain('const value = candidate');
    expect(settingsTab).toContain('body: JSON.stringify({ slug: normalizeSlugInput(slug) })');
    expect(settingsTab).toContain('const publicSlug = normalizeSlugInput(persistedSlug)');
    expect(settingsTab).toContain('const slugIsOwned = normalizeSlugInput(slug) === normalizeSlugInput(persistedSlug)');
  });

  it('settles slug checking for empty, owned, and superseded effect paths', () => {
    expect(settingsTab).toMatch(/if \(!value\)\s*\{\s*setSlugChecking\(false\);/);
    expect(settingsTab).toMatch(/if \(value === ownedSlug\)\s*\{\s*setSlugChecking\(false\);\s+setSlugCheck\(\{ available: true, slug: value, code: 'OWN' \}\);/);
    expect(settingsTab).toMatch(/cancelled = true;\s+clearTimeout\(t\);\s+setSlugChecking\(false\);/);
  });

  it('keeps the no-props parent contract and deferred boundaries intact', () => {
    expect(settingsTab).toContain('export default function SettingsTab()');
    expect(settingsTab).toContain('<MessagingSettingsCard />');
    expect(settingsTab).toContain('aria-labelledby="appearance-title"');
    expect(settingsTab).toContain("update('primaryColor', primary)");
    expect(settingsTab).toContain("update('backgroundType', t)");
    expect(settingsTab).toContain('className="sticky bottom-3');
    expect(publicForm).toContain('aria-labelledby="public-page-title"');
    expect(publicForm).not.toContain('aria-labelledby="appearance-title"');
  });
});
