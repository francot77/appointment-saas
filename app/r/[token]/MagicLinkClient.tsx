// app/r/[token]/MagicLinkClient.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
type Service = {
  id: string;
  name: string;
  durationMinutes: number;
};

type Business = {
  name: string;
  slug: string;
  primaryColor: string;
};

type AppointmentClient = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'request' | 'confirmed' | 'cancelled' | 'rejected';
  clientName: string;
  clientPhone: string;
  notes: string;
  service: Service | null;
  business: Business | null;
};

type Slot = {
  startTime: string;
  endTime: string;
};

type Props = { token: string };

export default function MagicLinkClient({ token }: Props) {
  const router = useRouter();
  const [appt, setAppt] = useState<AppointmentClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // reprogramar
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadAppointment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function loadAppointment() {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    setSlots([]);
    setSelectedSlot(null);

    try {
      const res = await fetch(`/api/client/appointments/${token}`);
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'No se pudo cargar el turno');
        setAppt(null);
        return;
      }

      setAppt(json);
      setDate(json.date);
    } catch (e) {
      console.error(e);
      setError('Error al cargar el turno');
      setAppt(null);
    } finally {
      setLoading(false);
    }
  }

  const businessColor = appt?.business?.primaryColor || '#6366F1';

  const today = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  async function loadSlots() {
    if (!appt || !appt.business || !appt.service) return;

    setLoadingSlots(true);
    setError(null);
    setSuccessMessage(null);
    setSlots([]);
    setSelectedSlot(null);

    try {
      const params = new URLSearchParams({
        date,
        serviceId: appt.service.id,
      });

      const res = await fetch(
        `/api/public/${appt.business.slug}/availability?${params.toString()}`
      );
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'Error obteniendo horarios');
        return;
      }

      const sl: Slot[] = json.slots || [];
      setSlots(sl);

      if (sl.length === 0) {
        setSuccessMessage('No hay horarios disponibles para ese día.');
      }
    } catch (e) {
      console.error(e);
      setError('Error obteniendo horarios');
    } finally {
      setLoadingSlots(false);
    }
  }

  async function handleCancel() {
    if (!appt) return;

    const ok = window.confirm(
      '¿Seguro que querés cancelar este turno? Esta acción no se puede deshacer.'
    );
    if (!ok) return;

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/client/appointments/${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'No se pudo cancelar el turno');
        return;
      }

      setAppt((prev) => (prev ? { ...prev, status: 'cancelled' } : prev));
      setSuccessMessage('Tu turno fue cancelado correctamente.');
    } catch (e) {
      console.error(e);
      setError('Error al cancelar el turno');
    } finally {
      setSaving(false);
    }
  }

    async function handleReschedule() {
    if (!appt || !selectedSlot) {
      setError('Elegí un nuevo horario para reprogramar');
      return;
    }

    // guardamos datos ANTES de actualizar
    const oldDate = appt.date;
    const oldTime = appt.startTime;
    const serviceName = appt.service?.name ?? '';

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/client/appointments/${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reschedule',
          newDate: date,
          newStartTime: selectedSlot.startTime,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'No se pudo reprogramar el turno');
        return;
      }

      // actualizá estado local por si el usuario vuelve atrás / no navega
      setAppt((prev) =>
        prev
          ? {
              ...prev,
              date: json.date,
              startTime: json.startTime,
              endTime: json.endTime,
            }
          : prev
      );

      // armamos redirect "pro"
      const slug = appt.business?.slug;
      if (slug) {
        const params = new URLSearchParams();
        if (oldDate) params.set('oldDate', oldDate);
        if (oldTime) params.set('oldTime', oldTime);
        if (json.date) params.set('newDate', json.date);
        if (json.startTime) params.set('newTime', json.startTime);
        if (serviceName) params.set('service', serviceName);

        router.push(`/${slug}/turno-actualizado?${params.toString()}`);
      } else {
        // fallback si no hay slug por algún motivo raro
        setSuccessMessage(
          'Tu turno fue reprogramado correctamente. Se va a respetar el nuevo horario.'
        );
        setSlots([]);
        setSelectedSlot(null);
      }
    } catch (e) {
      console.error(e);
      setError('Error al reprogramar el turno');
    } finally {
      setSaving(false);
    }
  }


  const disabledByStatus =
    !appt || ['cancelled', 'rejected'].includes(appt.status);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex justify-center px-4 py-6">
      <div className="w-full max-w-md space-y-4">
        {/* Header */}
        <header className="flex items-center gap-3 mb-2">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shadow-lg shadow-black/40"
            style={{ backgroundColor: businessColor, color: '#020617' }}
          >
            {appt?.business?.name
              ? appt.business.name.trim().charAt(0).toUpperCase()
              : 'T'}
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wide">
              {appt?.business?.name || 'Turno'}
            </h1>
            <p className="text-[11px] text-slate-400">
              Link para gestionar tu turno
            </p>
          </div>
        </header>

        <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
          {loading && (
            <p className="text-xs text-slate-400">
              Cargando datos del turno...
            </p>
          )}

          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}

          {!loading && !appt && !error && (
            <p className="text-xs text-slate-400">
              No se encontró información para este turno.
            </p>
          )}

          {appt && (
            <>
              {/* Info principal del turno */}
              <div className="space-y-1 text-xs">
                <p className="text-[11px] text-slate-400">
                  Turno a nombre de{' '}
                  <span className="text-slate-100 font-medium">
                    {appt.clientName}
                  </span>
                </p>
                <p>
                  <span className="text-slate-400">Fecha: </span>
                  <span className="text-slate-100 font-medium">
                    {appt.date}
                  </span>
                </p>
                <p>
                  <span className="text-slate-400">Horario: </span>
                  <span className="text-slate-100 font-medium">
                    {appt.startTime} hs
                  </span>
                </p>
                {appt.service && (
                  <p>
                    <span className="text-slate-400">Servicio: </span>
                    <span className="text-slate-100 font-medium">
                      {appt.service.name}
                    </span>
                  </p>
                )}
                {appt.status === 'confirmed' && (
                  <p className="text-[11px] text-emerald-400 mt-1">
                    Este turno está confirmado.
                  </p>
                )}
                {appt.status === 'request' && (
                  <p className="text-[11px] text-slate-300 mt-1">
                    Este turno está pendiente de confirmación.
                  </p>
                )}
                {['cancelled', 'rejected'].includes(appt.status) && (
                  <p className="text-[11px] text-red-400 mt-1">
                    Este turno ya no está activo ({appt.status}).
                  </p>
                )}
              </div>

              {appt.notes && (
                <div className="mt-2 text-[11px] text-slate-300 bg-slate-950 border border-slate-800 rounded-lg p-2">
                  <span className="text-slate-400">Notas: </span>
                  {appt.notes}
                </div>
              )}

              {/* Acciones */}
              <div className="mt-3 space-y-3">
                {/* Cancelar */}
                <button
                  type="button"
                  disabled={saving || disabledByStatus}
                  onClick={handleCancel}
                  className="w-full rounded-full py-2 text-xs font-medium border border-red-500/60 text-red-300 hover:bg-red-500/10 disabled:opacity-60"
                >
                  Cancelar turno
                </button>

                {/* Reprogramar */}
                {!disabledByStatus && appt.service && appt.business && (
                  <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
                    <p className="text-xs font-medium text-slate-200">
                      Reprogramar turno
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Elegí una nueva fecha y horario. Solo vas a ver los
                      horarios disponibles.
                    </p>

                    <div className="space-y-2">
                      <label className="text-[11px] text-slate-300">
                        Nueva fecha
                      </label>
                      <input
                        type="date"
                        value={date}
                        min={today}
                        onChange={(e) => {
                          setDate(e.target.value);
                          setSlots([]);
                          setSelectedSlot(null);
                          setSuccessMessage(null);
                          setError(null);
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      />
                      <button
                        type="button"
                        onClick={loadSlots}
                        disabled={loadingSlots || !date}
                        className="w-full rounded-full py-1.5 text-xs font-medium bg-slate-100 text-slate-900 disabled:opacity-60"
                      >
                        {loadingSlots
                          ? 'Buscando horarios...'
                          : 'Ver horarios disponibles'}
                      </button>
                    </div>

                    {/* Horarios */}
                    {slots.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[11px] text-slate-300">
                          Elegí un nuevo horario
                        </p>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          {slots.map((slot) => {
                            const isSelected =
                              selectedSlot?.startTime === slot.startTime &&
                              selectedSlot?.endTime === slot.endTime;
                            return (
                              <button
                                key={slot.startTime}
                                type="button"
                                onClick={() => setSelectedSlot(slot)}
                                className={`rounded-full py-1.5 border text-center ${
                                  isSelected
                                    ? 'border-indigo-400 bg-indigo-500 text-slate-900'
                                    : 'border-slate-700 bg-slate-950 text-slate-100 hover:bg-slate-900'
                                }`}
                              >
                                {slot.startTime}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={saving || !selectedSlot}
                      onClick={handleReschedule}
                      className="w-full rounded-full py-2 text-xs font-medium shadow-md shadow-black/40 disabled:opacity-60"
                      style={{ backgroundColor: businessColor, color: '#020617' }}
                    >
                      {saving
                        ? 'Guardando cambios...'
                        : 'Confirmar nuevo horario'}
                    </button>
                  </div>
                )}
              </div>

              {successMessage && (
                <p className="text-[11px] text-emerald-400 mt-2">
                  {successMessage}
                </p>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
