/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useRef, useState } from 'react';
import { BrandConfig, DEFAULT_BRAND } from './types';
import {
  Alert,
  EmptyState,
  LoadingState,
  Status,
} from '@/app/components/ui/feedback';

type Service = {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
  color?: string;
  isActive: boolean;
};

type Props = {
  brand?: BrandConfig;
};

export default function ServicesTab({ brand }: Props) {
  const theme = brand ?? DEFAULT_BRAND;

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState({
    name: '',
    price: '',
    durationMinutes: '',
    color: '',
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const deleteDialogRef = useRef<HTMLDialogElement>(null);
  const deleteCancelRef = useRef<HTMLButtonElement>(null);
  const deleteTriggerRef = useRef<HTMLButtonElement>(null);

  function serviceError(action: 'load' | 'save' | 'update' | 'delete') {
    return action === 'load'
      ? 'No pudimos cargar tus servicios. Intentá nuevamente.'
      : action === 'save'
        ? 'No pudimos guardar el servicio. Revisá los datos e intentá nuevamente.'
        : action === 'update'
          ? 'No pudimos actualizar la visibilidad del servicio. Intentá nuevamente.'
          : 'No pudimos eliminar el servicio. Intentá nuevamente.';
  }

  useEffect(() => {
    loadServices();
  }, []);

  function resetForm() {
    setEditing(null);
    setForm({
      name: '',
      price: '',
      durationMinutes: '',
      color: '',
      isActive: true,
    });
  }

  async function loadServices() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/services');
      const json = await res.json();

      if (!res.ok) {
        throw new Error('load');
      }

      const list: Service[] =
        json.services?.map((s: any) => ({
          id: String(s.id || s._id),
          name: s.name,
          price: s.price,
          durationMinutes: s.durationMinutes,
          color: s.color,
          isActive: s.active ?? true,
        })) ?? [];

      setServices(list);
    } catch (e: any) {
      console.error(e);
      setError(serviceError('load'));
      setServices([]);
    } finally {
      setLoading(false);
    }
  }

  function startEdit(service: Service) {
    setEditing(service);
    setForm({
      name: service.name,
      price: String(service.price),
      durationMinutes: String(service.durationMinutes),
      color: service.color ?? '',
      isActive: service.isActive,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const body = {
        name: form.name.trim(),
        price: Number(form.price),
        durationMinutes: Number(form.durationMinutes),
        color: form.color || undefined,
        active: form.isActive,
      };

      const url = editing
        ? `/api/admin/services/${editing.id}`
        : '/api/admin/services';

      const res = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      await res.json();

      if (!res.ok) {
        throw new Error('save');
      }

      await loadServices();
      resetForm();
    } catch (e: any) {
      console.error(e);
      setError(serviceError('save'));
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(service: Service) {
    try {
      const res = await fetch(`/api/admin/services/${service.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !service.isActive }),
      });

      await res.json();
      if (!res.ok) {
        throw new Error('update');
      }

      setServices((prev) =>
        prev.map((s) =>
          s.id === service.id ? { ...s, isActive: !s.isActive } : s
        )
      );
    } catch (e) {
      console.error(e);
      setError(serviceError('update'));
    }
  }

  function handleDelete(service: Service, trigger: HTMLButtonElement) {
    deleteTriggerRef.current = trigger;
    setDeleteTarget(service);
  }

  useEffect(() => {
    if (!deleteTarget) {
      deleteTriggerRef.current?.focus();
      return;
    }

    const dialog = deleteDialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    deleteCancelRef.current?.focus();

    return () => {
      deleteTriggerRef.current?.focus();
    };
  }, [deleteTarget]);

  async function confirmDelete() {
    if (!deleteTarget) return;
    const service = deleteTarget;
    setDeleteTarget(null);
    try {
      const res = await fetch(`/api/admin/services/${service.id}`, {
        method: 'DELETE',
      });
      await res.json();
      if (!res.ok) {
        throw new Error('delete');
      }

      await loadServices();
      if (editing?.id === service.id) {
        resetForm();
      }
    } catch (e) {
      console.error(e);
      setError(serviceError('delete'));
    }
  }

  return (
    <div className="space-y-4 bg-[var(--color-canvas)] text-[var(--color-content)]">
      {/* Encabezado */}
      <section className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Servicios</h2>
          <p className="text-[11px] text-[var(--color-content-muted)]">
            Configurá los servicios que ofrecés, precios y duración.
          </p>
        </div>
        <button
          type="button"
          onClick={resetForm}
          className="text-[11px] px-3 py-1 rounded-full border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)]"
        >
          Nuevo
        </button>
      </section>

      {/* Formulario */}
      <section className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-3">
        <h3 className="text-xs font-semibold mb-2">
          {editing ? 'Editar servicio' : 'Nuevo servicio'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="service-name" className="text-xs text-[var(--color-content-muted)]">
                Nombre
              </label>
              <input
                id="service-name"
                className="bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-md px-2 py-1 text-sm"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="service-price" className="text-xs text-[var(--color-content-muted)]">
                Precio (ARS)
              </label>
              <input
                type="number"
                id="service-price"
                min={0}
                className="bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-md px-2 py-1 text-sm"
                value={form.price}
                onChange={(e) =>
                  setForm((f) => ({ ...f, price: e.target.value }))
                }
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="service-duration" className="text-xs text-[var(--color-content-muted)]">
                Duración (minutos)
              </label>
              <input
                type="number"
                id="service-duration"
                min={5}
                step={5}
                className="bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-md px-2 py-1 text-sm"
                value={form.durationMinutes}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    durationMinutes: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="service-color" className="text-xs text-[var(--color-content-muted)]">
                Color (opcional)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  aria-label="Color del servicio"
                  className="h-8 w-8 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)]"
                  value={form.color || '#3b82f6'}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, color: e.target.value }))
                  }
                />
                <input
                  id="service-color"
                  className="flex-1 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-md px-2 py-1 text-sm"
                  value={form.color}
                  placeholder="#38bdf8"
                  onChange={(e) =>
                    setForm((f) => ({ ...f, color: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-[11px] text-[var(--color-content-muted)]">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) =>
                  setForm((f) => ({ ...f, isActive: e.target.checked }))
                }
                className="h-3 w-3 rounded border-[var(--color-border)] bg-[var(--color-surface-muted)]"
              />
              Servicio activo (visible para los clientes)
            </label>

            <div className="flex gap-2">
              {editing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs px-3 py-1 rounded-md border border-[var(--color-border)] text-[var(--color-content)] hover:bg-[var(--color-surface-muted)]"
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                disabled={saving}
                className="text-xs px-3 py-1 rounded-md shadow-sm"
                style={{
                  backgroundColor: theme.primary,
                  color: theme.textOnPrimary,
                  opacity: saving ? 0.6 : 1,
                  boxShadow: `0 0 10px ${theme.primary}40`,
                }}
              >
                {saving
                  ? 'Guardando...'
                  : editing
                  ? 'Guardar cambios'
                  : 'Crear servicio'}
              </button>
            </div>
          </div>

          {error && (
            <Alert tone="danger" role="alert">{error}</Alert>
          )}
        </form>
      </section>

      {/* Lista */}
      <section className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold">
            Servicios configurados
          </h3>
          {loading && (
            <LoadingState label="Cargando..." />
          )}
        </div>

        {services.length === 0 && !loading && !error && (
          <EmptyState title="Todavía no agregaste servicios. Creá el primero para que tus clientes puedan elegirlo." />
        )}

        <div className="space-y-2">
          {services.map((s) => (
            <div
              key={s.id}
              className="bg-[var(--color-surface-muted)] rounded-lg px-3 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border border-[var(--color-border)]"
            >
              <div className="flex items-start gap-2">
                <div
                  className="h-8 w-1.5 rounded-full mt-1"
                  style={{
                    backgroundColor: s.color || theme.primary,
                  }}
                />
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold">
                      {s.name}
                    </span>
                    <span className="text-[11px] text-[var(--color-content-muted)]">
                      {s.durationMinutes} min
                    </span>
                    <span className="text-[11px] text-[var(--color-content-muted)]">
                      ${s.price}
                    </span>
                    <Status
                      tone={s.isActive ? 'success' : 'info'}
                      label={s.isActive ? 'Activo' : 'Oculto'}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => toggleActive(s)}
                  className="text-[11px] px-2.5 py-1 rounded-full border border-[var(--color-border)] text-[var(--color-content)] hover:bg-[var(--color-surface)]"
                >
                  {s.isActive ? 'Ocultar' : 'Mostrar'}
                </button>
                <button
                  type="button"
                  onClick={() => startEdit(s)}
                  className="text-[11px] px-2.5 py-1 rounded-full border border-[var(--color-border)] text-[var(--color-content)] hover:bg-[var(--color-surface)]"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={(event) => handleDelete(s, event.currentTarget)}
                  className="text-[11px] px-2.5 py-1 rounded-full border border-[var(--color-danger-border)] text-[var(--color-danger-foreground)] hover:bg-[var(--color-danger-background)]"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {deleteTarget && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/80 p-4" role="presentation">
          <dialog
            ref={deleteDialogRef}
            aria-labelledby="delete-service-title"
            aria-describedby="delete-service-description"
            onCancel={(event) => {
              event.preventDefault();
              setDeleteTarget(null);
            }}
            onClose={() => setDeleteTarget(null)}
            className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-900 p-4 text-slate-100 shadow-2xl"
          >
            <h2 id="delete-service-title" className="text-sm font-semibold">Eliminar servicio</h2>
            <p id="delete-service-description" className="mt-2 text-xs text-slate-300">
              ¿Eliminar &quot;{deleteTarget.name}&quot;? Los turnos existentes seguirán mostrando el nombre antiguo.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button ref={deleteCancelRef} type="button" onClick={() => setDeleteTarget(null)} className="rounded-md border border-slate-600 px-3 py-1.5 text-xs">Cancelar</button>
              <button type="button" onClick={confirmDelete} className="rounded-md border border-red-500/60 px-3 py-1.5 text-xs text-red-300">Eliminar</button>
            </div>
          </dialog>
        </div>
      )}
    </div>
  );
}
