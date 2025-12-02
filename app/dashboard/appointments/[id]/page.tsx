'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';

type DetailAppointment = {
  id: string;
  clientName: string;
  clientPhone: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'request' | 'confirmed' | 'cancelled' | 'rejected';
  notes: string;
  serviceName: string;
  serviceColor: string;
  reminderSent?: boolean;
  lastReminderAt?: string | null;
};

const PINK = '#e87dad';

function statusLabelEs(status: DetailAppointment['status']) {
  switch (status) {
    case 'request':
      return 'Pendiente';
    case 'confirmed':
      return 'Confirmado';
    case 'cancelled':
      return 'Cancelado';
    case 'rejected':
      return 'Rechazado';
    default:
      return status;
  }
}

function statusBadgeClasses(status: DetailAppointment['status']) {
  switch (status) {
    case 'request':
      return 'bg-amber-500/20 text-amber-300 border border-amber-400/50';
    case 'confirmed':
      return 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/60';
    case 'cancelled':
      return 'bg-slate-600/40 text-slate-100 border border-slate-500/70';
    case 'rejected':
      return 'bg-red-500/20 text-red-300 border border-red-500/60';
    default:
      return 'bg-slate-700/40 text-slate-200 border border-slate-600';
  }
}

export default function AppointmentDetailPage(
  props: {
    params: Promise<{ id: string }>;
  }
) {
  const params = use(props.params);
  const router = useRouter();
  const [appt, setAppt] = useState<DetailAppointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `/api/admin/appointments/${params.id}`
        );
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || 'Error cargando turno');
          return;
        }
        setAppt(json.appointment);
      } catch (e) {
        console.error(e);
        setError('Error cargando turno');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  async function changeStatus(
    target: 'confirm' | 'reject' | 'cancel'
  ) {
    if (!appt) return;

    const label =
      target === 'confirm'
        ? 'confirmar'
        : target === 'reject'
        ? 'rechazar'
        : 'cancelar';

    const ok = window.confirm(
      `¿Seguro que querés ${label} este turno?`
    );
    if (!ok) return;

    setSaving(true);
    try {
      const res = await fetch(
        `/api/admin/appointments/${appt.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: target }),
        }
      );
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Error actualizando turno');
        return;
      }
      setAppt((prev) =>
        prev ? { ...prev, status: json.status } : prev
      );
      if (json.waUrl) {
        window.open(json.waUrl, '_blank');
      }
    } catch (e) {
      console.error(e);
      alert('Error actualizando turno');
    } finally {
      setSaving(false);
    }
  }

  async function resendMessage() {
    if (!appt) return;
    setSaving(true);
    try {
      const res = await fetch(
        `/api/admin/appointments/${appt.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'resend' }),
        }
      );
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Error reenviando mensaje');
        return;
      }
      if (json.waUrl) {
        window.open(json.waUrl, '_blank');
      }
    } catch (e) {
      console.error(e);
      alert('Error reenviando mensaje');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <p className="text-sm text-slate-400">Cargando turno...</p>
      </main>
    );
  }

  if (error || !appt) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100">
        <p className="text-sm text-red-400 mb-3">
          {error || 'Turno no encontrado'}
        </p>
        <button
          className="text-xs border border-slate-600 px-3 py-1 rounded-md hover:bg-slate-800"
          onClick={() => router.push('/dashboard')}
        >
          Volver al panel
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-xl space-y-4">
        <header className="flex items-center justify-between">
          <h1 className="text-xl font-bold">
            <span style={{ color: PINK }}>Detalle</span> de turno
          </h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-xs border border-slate-600 px-3 py-1 rounded-md hover:bg-slate-800"
          >
            Volver
          </button>
        </header>

        <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold shadow-md shadow-black/40"
              style={{ backgroundColor: appt.serviceColor || PINK }}
            >
              {appt.clientName?.[0] ?? '?'}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">
                {appt.clientName}
              </p>
              <p className="text-xs text-slate-400">
                {appt.clientPhone || 'Sin teléfono'}
              </p>
            </div>
            <span
              className={
                'text-[11px] px-3 py-1 rounded-full font-medium ' +
                statusBadgeClasses(appt.status)
              }
            >
              {statusLabelEs(appt.status)}
            </span>
          </div>

          <div className="text-xs space-y-1 text-slate-300">
            <p>
              <span className="text-slate-400">Fecha: </span>
              {appt.date} · {appt.startTime}–{appt.endTime}
            </p>
            <p>
              <span className="text-slate-400">Servicio: </span>
              {appt.serviceName || '—'}
            </p>
            {appt.notes && (
              <p>
                <span className="text-slate-400">Notas: </span>
                {appt.notes}
              </p>
            )}
          </div>

          {/* Acciones */}
          <div className="pt-3 border-t border-slate-800 space-y-3">
            <div className="flex flex-wrap gap-2">
              <button
                disabled={saving}
                onClick={() => changeStatus('confirm')}
                className="text-xs px-3 py-1.5 rounded-md bg-emerald-500 text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
              >
                Marcar como confirmado
              </button>
              <button
                disabled={saving}
                onClick={() => changeStatus('reject')}
                className="text-xs px-3 py-1.5 rounded-md bg-red-500 text-slate-50 hover:bg-red-400 disabled:opacity-60"
              >
                Marcar como rechazado
              </button>
              <button
                disabled={saving}
                onClick={() => changeStatus('cancel')}
                className="text-xs px-3 py-1.5 rounded-md bg-slate-600 text-slate-50 hover:bg-slate-500 disabled:opacity-60"
              >
                Marcar como cancelado
              </button>
            </div>

            <div className="pt-3 border-t border-slate-800 flex flex-wrap gap-2 items-center justify-between">
              <button
                disabled={saving}
                onClick={resendMessage}
                className="text-xs px-3 py-1.5 rounded-md border border-pink-500 text-pink-300 hover:bg-pink-500/10 disabled:opacity-60"
              >
                Reenviar mensaje WhatsApp
              </button>

              {appt.lastReminderAt && (
                <span className="text-[10px] text-slate-500">
                  Último recordatorio:{' '}
                  <span className="text-slate-200">
                    {new Date(appt.lastReminderAt).toLocaleString()}
                  </span>
                </span>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
