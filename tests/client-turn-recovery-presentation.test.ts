import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const client = readFileSync(resolve(process.cwd(), 'app/r/[token]/MagicLinkClient.tsx'), 'utf8');
const updatedTurn = readFileSync(resolve(process.cwd(), 'app/[slug]/turno-actualizado/page.tsx'), 'utf8');

describe('client turn recovery presentation contract', () => {
  it('uses the shared semantic feedback primitives for every client branch', () => {
    expect(client).toMatch(/import \{[\s\S]*Alert[\s\S]*EmptyState[\s\S]*LoadingState[\s\S]*Status[\s\S]*\}/);
    expect(client).toContain('<LoadingState label="Cargando datos del turno..." />');
    expect(client).toMatch(/<Alert\s+tone="danger"\s+role="alert"/);
    expect(client).toContain('<EmptyState title="No se encontró información para este turno." />');
    expect(client).toContain('<Status tone="success" label="Confirmado"');
    expect(client).toContain('<Status tone="warning" label="Pendiente de confirmación"');
    expect(client).toContain('<Status tone="danger" label="No disponible"');
    expect(client).toMatch(/<Alert\s+tone=\{successMessage\.includes/);
  });

  it('uses Editorial-light presentation without tenant-owned semantic status styling', () => {
    expect(client).toContain('bg-[var(--color-canvas)]');
    expect(client).toContain('bg-[var(--color-surface)]');
    expect(client).toContain('border-[var(--color-border)]');
    expect(client).toContain('text-[var(--color-content)]');
    expect(client).not.toMatch(/bg-slate-|text-slate-|border-slate-|text-red-|text-emerald-|bg-indigo-/);
    expect(client).toContain('style={{ backgroundColor: businessColor, color: \'#020617\' }}');
    expect(client).not.toContain('tone={businessColor}');
  });

  it('preserves appointment loading, persistence, timeout, and retry contracts', () => {
    expect(client).toContain('fetch(`/api/client/appointments/${token}`, {');
    expect(client).toContain('signal: controller.signal');
    expect(client).toContain('window.setTimeout(() => controller.abort(), 10000)');
    expect(client).toContain('window.clearTimeout(timeout)');
    expect(client).toContain('saveAppointment({');
    expect(client).toContain('removeSavedAppointmentByToken(token)');
    expect(client).toContain("res.status === 404 || res.status === 410");
    expect(client).toContain('onClick={loadAppointment}');
    expect(client).toContain('Intentá nuevamente');
    expect(client).toContain('No se encontró información para este turno.');
  });

  it('owns token and retry loads with abortable request identities', () => {
    expect(client).toContain('useRef');
    expect(client).toContain('activeAppointmentRequestRef');
    expect(client).toContain('activeAppointmentRequestRef.current?.controller.abort()');
    expect(client).toContain('appointmentRequestIdRef');
    expect(client).toContain('const isCurrentRequest = () =>');
    expect(client).toContain('if (!isCurrentRequest()) return;');
  });

  it('guards stale state, storage, expiry cleanup, and finally effects', () => {
    expect(client).toMatch(
      /if \(!isCurrentRequest\(\)\) return;[\s\S]*removeSavedAppointmentByToken\(token\)/,
    );
    expect(client).toMatch(
      /if \(!isCurrentRequest\(\)\) return;[\s\S]*saveAppointment\(\{/,
    );
    expect(client).toMatch(
      /finally \{[\s\S]*window\.clearTimeout\(timeout\);[\s\S]*if \(isCurrentRequest\(\)\) \{[\s\S]*setLoading\(false\)/,
    );
  });

  it('preserves cancellation, availability, selection, and reschedule behavior', () => {
    expect(client).toContain('window.confirm(');
    expect(client).toContain('body: JSON.stringify({ action: \'cancel\' })');
    expect(client).toContain('`/api/public/${appt.business.slug}/availability?${params.toString()}`');
    expect(client).toContain('setSelectedSlot(slot)');
    expect(client).toContain("action: 'reschedule'");
    expect(client).toContain('newDate: date');
    expect(client).toContain('newStartTime: selectedSlot.startTime');
    expect(client).toContain('router.push(`/${slug}/turno-actualizado?${params.toString()}`)');
    expect(client).toContain('Tu turno fue reprogramado correctamente. Se va a respetar el nuevo horario.');
    expect(client).toContain("disabled={saving || disabledByStatus}");
    expect(client).toContain("disabled={saving || !selectedSlot}");
  });

  it('keeps the authorized production boundary and unchanged user-facing copy', () => {
    expect(client).toContain('Turno a nombre de');
    expect(client).toContain('Link para gestionar tu turno');
    expect(client).toContain('Este turno está confirmado.');
    expect(client).toContain('Este turno está pendiente de confirmación.');
    expect(client).toContain('Este turno ya no está disponible.');
    expect(client).toContain('Cancelar turno');
    expect(client).toContain('Reprogramar turno');
    expect(client).toContain('Ver horarios disponibles');
    expect(client).toContain('Confirmar nuevo horario');
    expect(client).not.toContain('Dialog');
  });

  it('uses the shared semantic success alert and Editorial-light result hierarchy', () => {
    expect(updatedTurn).toMatch(/import \{\s*Alert\s*\} from ['"]@\/app\/components\/ui\/feedback['"]/);
    expect(updatedTurn).toMatch(/<Alert\s+tone="success"\s+role="status">/);
    expect(updatedTurn).toContain('bg-[var(--color-canvas)]');
    expect(updatedTurn).toContain('bg-[var(--color-surface)]');
    expect(updatedTurn).toContain('border-[var(--color-border)]');
    expect(updatedTurn).not.toMatch(/bg-slate-|text-slate-|border-slate-/);
  });

  it('preserves result summaries, identity, accent ownership, and return copy', () => {
    expect(updatedTurn).toContain('¡Tu turno fue reprogramado! 🔁');
    expect(updatedTurn).toContain('Actualizamos tu turno con el nuevo horario que elegiste.');
    expect(updatedTurn).toContain('Resumen de tu turno:');
    expect(updatedTurn).toContain('Horario anterior:');
    expect(updatedTurn).toContain('Nuevo horario:');
    expect(updatedTurn).toContain('style={{ backgroundColor: primaryColor');
    expect(updatedTurn).toContain('style={{ backgroundColor: accentColor');
    expect(updatedTurn).toContain('href={`/${slug}`}');
    expect(updatedTurn).toContain('Volver a la página de turnos');
  });

  it('preserves not-found, canonical redirect, and all supported query forwarding', () => {
    expect(updatedTurn).toContain('if (!business) notFound();');
    expect(updatedTurn).toContain('redirect(`/${(business as any).slug}/turno-actualizado${suffix}`);');
    expect(updatedTurn).toContain("qp.set('oldDate', String(oldDate))");
    expect(updatedTurn).toContain("qp.set('oldTime', String(oldTime))");
    expect(updatedTurn).toContain("qp.set('newDate', String(newDate))");
    expect(updatedTurn).toContain("qp.set('newTime', String(newTime))");
    expect(updatedTurn).toContain("qp.set('service', String(service))");
  });
});
