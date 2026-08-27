import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(process.cwd());
const dashboardClient = readFileSync(resolve(root, 'app/dashboard/DashboardClient.tsx'), 'utf8');
const appointmentsTab = readFileSync(resolve(root, 'app/dashboard/AppointmentsTab.tsx'), 'utf8');

describe('dashboard presentation source contracts', () => {
  it('gives the product canvas neutral ownership without losing tenant accents', () => {
    expect(dashboardClient).toContain('className="min-h-screen bg-[#f4f1ec] text-slate-900"');
    expect(dashboardClient).not.toContain('style={{ backgroundColor: theme.background ||');
    expect(dashboardClient).toContain('theme.primary');
    expect(dashboardClient).toContain('theme.secondary');
    expect(dashboardClient).toContain('backgroundColor: theme.primary');
  });

  it('contains appointment controls with intrinsic-width-safe responsive markers', () => {
    expect(appointmentsTab).toContain('flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between');
    expect(appointmentsTab).toContain('grid min-w-0 w-full gap-4 sm:grid-cols-2 xl:w-auto');
    expect(appointmentsTab).toContain('min-w-0 max-w-full');
    expect(appointmentsTab).toContain('mt-1 flex min-w-0 flex-wrap');
    expect(appointmentsTab).toContain('min-h-11 min-w-0 flex-1 whitespace-normal');
  });

  it('uses precise owner-facing Spanish copy and removes superseded phrases', () => {
    for (const phrase of [
      'No pudimos revisar los pasos para activar tu página.',
      'Revisando los pasos para activar tu página...',
      'pasos completados.',
      'completado',
      'Tu agenda de hoy y mañana',
      'Todos tus turnos',
      'Período',
    ]) expect(`${dashboardClient}\n${appointmentsTab}`).toContain(phrase);
    for (const phrase of [
      'No se pudo cargar el checklist de activación.',
      'Revisando la configuración inicial...',
      'Tus próximos turnos, en orden',
      'Turnos para gestionar',
      '>Mostrar<',
    ]) expect(`${dashboardClient}\n${appointmentsTab}`).not.toContain(phrase);
  });

  it('preserves appointment filters, effect dependencies, and request contracts', () => {
    expect(appointmentsTab).toContain('}, [date, statusFilter, viewMode]);');
    expect(appointmentsTab).toContain("new URLSearchParams({ status: statusFilter })");
    expect(appointmentsTab).toContain("params.set('date', date)");
    expect(appointmentsTab).toContain("params.set('from', range.from)");
    expect(appointmentsTab).toContain("params.set('to', range.to)");
    expect(appointmentsTab).toContain("method: 'PATCH'");
    expect(appointmentsTab).toContain("action: kind === 'reminder' ? 'remind' : action");
    expect(appointmentsTab).toContain("action: 'reschedule'");
    expect(appointmentsTab).toContain("setStatusFilter('request')");
    expect(appointmentsTab).toContain("setStatusFilter('confirmed')");
    expect(appointmentsTab).toContain("setStatusFilter('all')");
  });

  it('preserves activation, navigation, and public-link behavior in the shell', () => {
    expect(dashboardClient).toContain("fetch('/api/admin/activation'");
    expect(dashboardClient).toContain("window.scrollTo({ top: 0, behavior: 'smooth' })");
    expect(dashboardClient).toContain('href={publicUrl}');
    expect(dashboardClient).toContain('navigator.clipboard.writeText(absoluteUrl)');
    expect(dashboardClient).toContain('navigator.share');
    expect(dashboardClient).toContain('<AppointmentsTab brand={theme} />');
  });

  it('places appointments before contextual support content and models mounted activation visits', () => {
    expect(dashboardClient.indexOf("{tab === 'appointments' && <AppointmentsTab brand={theme} />}")).toBeLessThan(dashboardClient.indexOf('<ActivationChecklist'));
    expect(dashboardClient).toContain("type ActivationVisitState = 'unresolved' | 'incomplete' | 'completion' | 'suppressed';");
    expect(dashboardClient).toContain("current === 'incomplete' ? 'completion'");
    expect(dashboardClient).toContain("current === 'suppressed' ? current : 'suppressed'");
    expect(dashboardClient).toContain('activationVisitStateRef');
    expect(dashboardClient).toContain("activationVisitState === 'incomplete' || activationVisitState === 'completion'");
  });

  it('keeps sharing independent from checklist visibility', () => {
    expect(dashboardClient).toContain('<PublicLinkUtility');
    expect(dashboardClient).toContain('activation?.checklist.publicLinkAvailable');
    expect(dashboardClient).toContain('onAcknowledge');
    expect(dashboardClient).toContain('navigator.clipboard.writeText(absoluteUrl)');
    expect(dashboardClient).toContain('navigator.share');
  });
});
