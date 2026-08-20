import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const servicesTab = readFileSync(
  resolve(process.cwd(), 'app/dashboard/ServicesTab.tsx'),
  'utf8',
);
const presentation = servicesTab.split('{deleteTarget && (')[0];

describe('services tab presentation contract', () => {
  it('uses shared feedback primitives for every service state', () => {
    expect(servicesTab).toMatch(
      /import \{[\s\S]*Alert[\s\S]*EmptyState[\s\S]*LoadingState[\s\S]*Status[\s\S]*\}/,
    );
    expect(servicesTab).toContain('<LoadingState label="Cargando..." />');
    expect(servicesTab).toMatch(/<Alert\s+tone="danger"\s+role="alert">\{error\}<\/Alert>/);
    expect(servicesTab).toContain(
      '<EmptyState title="Todavía no agregaste servicios. Creá el primero para que tus clientes puedan elegirlo." />',
    );
    expect(servicesTab).toContain("tone={s.isActive ? 'success' : 'info'}");
    expect(servicesTab).toContain("label={s.isActive ? 'Activo' : 'Oculto'}");
    expect(servicesTab).not.toMatch(/import\s+\{[^}]*Dialog[^}]*\}\s+from/);
  });

  it('uses light semantic product surfaces while keeping tenant accents scoped', () => {
    expect(presentation).toContain('bg-[var(--color-canvas)]');
    expect(presentation).toContain('bg-[var(--color-surface)]');
    expect(presentation).toContain('bg-[var(--color-surface-muted)]');
    expect(presentation).toContain('border-[var(--color-border)]');
    expect(presentation).toContain('text-[var(--color-content)]');
    expect(presentation).toContain('text-[var(--color-content-muted)]');
    expect(presentation).not.toMatch(/bg-slate-|text-slate-|border-slate-|text-red-|text-emerald-/);
    expect(presentation).toContain('backgroundColor: theme.primary');
    expect(presentation).toContain('backgroundColor: s.color || theme.primary');
  });

  it('preserves service CRUD, normalized bodies, validation, and transitions', () => {
    expect(servicesTab).toContain("fetch('/api/admin/services')");
    expect(servicesTab).toContain("method: editing ? 'PATCH' : 'POST'");
    expect(servicesTab).toContain("body: JSON.stringify(body)");
    expect(servicesTab).toContain('name: form.name.trim()');
    expect(servicesTab).toContain('body: JSON.stringify({ active: !service.isActive })');
    expect(servicesTab).toContain("method: 'DELETE'");
    expect(servicesTab).toContain('disabled={saving}');
    expect(servicesTab).toMatch(/saving\s*\?\s*'Guardando\.\.\.'/);
    expect(servicesTab).toContain('required');
    expect(servicesTab).toContain('min={0}');
    expect(servicesTab).toContain('min={5}');
    expect(servicesTab).toContain('step={5}');
  });

  it('preserves Spanish copy, parent brand input, and native dialog focus contract', () => {
    expect(servicesTab).toContain('brand?: BrandConfig');
    expect(servicesTab).toContain('theme.primary');
    expect(servicesTab).toContain('Nuevo servicio');
    expect(servicesTab).toContain('Editar servicio');
    expect(servicesTab).toContain('Servicio activo (visible para los clientes)');
    expect(servicesTab).toContain('¿Eliminar &quot;{deleteTarget.name}&quot;? Los turnos existentes seguirán mostrando el nombre antiguo.');
    expect(servicesTab).toContain('<dialog');
    expect(servicesTab).toContain('deleteDialogRef');
    expect(servicesTab).toContain('deleteCancelRef.current?.focus()');
    expect(servicesTab).toContain('deleteTriggerRef.current?.focus()');
    expect(servicesTab).not.toContain('Dialog }');
  });

  it('keeps the authorized source boundary', () => {
    expect(presentation).not.toContain('SettingsTab');
    expect(servicesTab).toContain('setServices([]);');
    expect(servicesTab).toContain('if (editing?.id === service.id)');
  });
});
