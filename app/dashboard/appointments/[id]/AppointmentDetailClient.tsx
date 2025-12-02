'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { PINK, AdminAppointment } from '../../types';

type AppointmentDetail = AdminAppointment & {
  createdAt?: string;
  updatedAt?: string;
  reminderSentAt?: string | null;
};

type Props = {
  id: string;
};

function statusLabelEs(status: AppointmentDetail['status']) {
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

function statusBadgeClasses(status: AppointmentDetail['status']) {
  switch (status) {
    case 'request':
      return 'bg-amber-500/20 text-amber-300 border border-amber-400/50';
    case 'confirmed':
      return 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/60';
    case 'cancelled':
      return 'bg-slate-600/30 text-slate-200 border border-slate-500/70';
    case 'rejected':
      return 'bg-red-500/20 text-red-300 border border-red-500/60';
    default:
      return 'bg-slate-700/40 text-slate-200 border border-slate-600';
  }
}

export default function AppointmentDetailClient({ id }: Props) {
  const router = useRouter();
  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<
    'confirm' | 'reject' | 'cancel' | 'remind' | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/appointments/${id}`);
        const json = await res.json();
        if (!res.ok) {
          if (mounted) {
            setError(json.error || 'Error cargando el turno');
            setAppointment(null);
          }
        } else {
          if (mounted) setAppointment(json.appointment);
        }
      } catch (e) {
        console.error(e);
        if (mounted) {
          setError('Error cargando el turno');
          setAppointment(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  async function handleAction(action: 'confirm' | 'reject' | 'cancel') {
    if (!appointment) return;
    setActionLoading(action);
    setError(null);
    try {
      const res = await fetch(`/api/admin/appointments/${appointment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'No se pudo actualizar el turno');
        return;
      }

      // si la API devuelve waUrl cuando se confirma / rechaza, abrimos pestaña
      if (json.waUrl) {
        window.open(json.waUrl, '_blank');
      }

      setAppointment((prev: AppointmentDetail | null) =>
        prev ? { ...prev, status: json.status || actionMapToStatus(action) } : prev
      );
    } catch (e) {
      console.error(e);
      setError('No se pudo actualizar el turno');
    } finally {
      setActionLoading(null);
    }
  }

  function actionMapToStatus(action: 'confirm' | 'reject' | 'cancel') {
    switch (action) {
      case 'confirm':
        return 'confirmed';
      case 'reject':
        return 'rejected';
      case 'cancel':
        return 'cancelled';
    }
  }

  async function handleRemind() {
    if (!appointment) return;
    setActionLoading('remind');
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/appointments/${appointment.id}/remind`,
        { method: 'POST' }
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'No se pudo generar el recordatorio');
        return;
      }

      if (json.waUrl) {
        window.open(json.waUrl, '_blank');
      }

      if (json.reminderSentAt && appointment) {
        setAppointment((prev: AppointmentDetail | null) =>
          prev ? { ...prev, reminderSentAt: json.reminderSentAt } : prev
        );
      }
    } catch (e) {
      console.error(e);
      setError('No se pudo generar el recordatorio');
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex justify-center p-4">
        <div className="w-full max-w-3xl">
          <p className="text-sm text-slate-400">Cargando turno...</p>
        </div>
      </main>
    );
  }

  if (!appointment) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex justify-center p-4">
        <div className="w-full max-w-3xl space-y-3">
          <button
            onClick={() => router.back()}
            className="text-xs mb-2 text-slate-300 hover:text-slate-100"
          >
            ← Volver al panel
          </button>
          <p className="text-sm text-red-400">
            No se encontró la información del turno.
          </p>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      </main>
    );
  }

  const {
    clientName,
    clientPhone,
    date,
    startTime,
    endTime,
    serviceName,
    serviceColor,
    status,
    notes,
  } = appointment;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex justify-center p-4">
      <div className="w-full max-w-3xl space-y-4">
        <button
          onClick={() => router.back()}
          className="text-xs text-slate-300 hover:text-slate-100"
        >
          ← Volver al panel
        </button>

        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">
              <span style={{ color: PINK }}>Detalle</span> del turno
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {date} · {startTime}
              {endTime ? ` — ${endTime}` : ''}
            </p>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-[11px] font-medium ${statusBadgeClasses(
              status
            )}`}
          >
            {statusLabelEs(status)}
          </div>
        </header>

        {/* Tarjeta principal */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          {/* Datos básicos */}
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold shadow-md shadow-black/40"
              style={{ backgroundColor: serviceColor || PINK }}
            >
              {clientName?.[0] ?? '?'}
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold">{clientName}</h2>
                {clientPhone && (
                  <span className="text-[11px] text-slate-300">
                    📞 {clientPhone}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300">
                Servicio:{' '}
                <span className="font-medium text-slate-100">
                  {serviceName}
                </span>
              </p>
              <p className="text-[11px] text-slate-400">
                Fecha:{' '}
                <span className="text-slate-100">
                  {date}
                </span>{' '}
                · Horario:{' '}
                <span className="text-slate-100">
                  {startTime}
                  {endTime ? ` — ${endTime}` : ''}
                </span>
              </p>
            </div>
          </div>

          {/* Notas */}
          {notes && (
            <div className="border border-slate-800 rounded-lg p-3 bg-slate-950/60">
              <h3 className="text-xs font-semibold mb-1 text-slate-200">
                Notas de la clienta
              </h3>
              <p className="text-xs text-slate-100 whitespace-pre-wrap">
                {notes}
              </p>
            </div>
          )}

          {/* Acciones de estado */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-300">
              Cambiar estado del turno
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={actionLoading === 'confirm'}
                onClick={() => handleAction('confirm')}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500 text-slate-900 hover:bg-emerald-400 disabled:opacity-60"
              >
                {actionLoading === 'confirm'
                  ? 'Confirmando...'
                  : 'Marcar como confirmado'}
              </button>

              <button
                type="button"
                disabled={actionLoading === 'reject'}
                onClick={() => handleAction('reject')}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-red-500 text-slate-50 hover:bg-red-400 disabled:opacity-60"
              >
                {actionLoading === 'reject'
                  ? 'Rechazando...'
                  : 'Marcar como rechazado'}
              </button>

              <button
                type="button"
                disabled={actionLoading === 'cancel'}
                onClick={() => handleAction('cancel')}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-slate-600 text-slate-50 hover:bg-slate-500 disabled:opacity-60"
              >
                {actionLoading === 'cancel'
                  ? 'Cancelando...'
                  : 'Marcar como cancelado'}
              </button>
            </div>
          </div>

          {/* Acciones de comunicación */}
          <div className="space-y-2 pt-2 border-t border-slate-800/60">
            <h3 className="text-xs font-semibold text-slate-300">
              Comunicación
            </h3>
            <div className="flex flex-wrap gap-2 items-center">
              <button
                type="button"
                disabled={actionLoading === 'remind'}
                onClick={handleRemind}
                className="px-3 py-1.5 rounded-full text-xs font-medium border border-slate-500 bg-slate-950 hover:bg-slate-900 disabled:opacity-60"
                style={{ borderColor: PINK, color: PINK }}
              >
                {actionLoading === 'remind'
                  ? 'Abriendo WhatsApp...'
                  : 'Reenviar mensaje por WhatsApp'}
              </button>

              {appointment.reminderSentAt && (
                <span className="text-[10px] text-slate-400">
                  Último recordatorio:{' '}
                  <span className="text-slate-200">
                    {new Date(appointment.reminderSentAt).toLocaleString()}
                  </span>
                </span>
              )}
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-400 pt-1">{error}</p>
          )}
        </section>
      </div>
    </main>
  );
}
