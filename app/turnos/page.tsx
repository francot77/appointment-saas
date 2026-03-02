'use client';

import { useEffect, useState } from 'react';
import { BRAND_NAME, BRAND_PRIMARY } from '../dashboard/types';

type Service = {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
  color: string;
};

type Slot = {
  startTime: string;
  endTime: string;
};

export default function TurnosPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cargar servicios al montar
  useEffect(() => {
    async function loadServices() {
      try {
        const res = await fetch('/api/services');
        const json = await res.json();
        setServices(json);
      } catch (e) {
        console.error(e);
        setError('Error cargando servicios');
      } finally {
        setLoadingServices(false);
      }
    }
    loadServices();
  }, []);

  async function loadSlots() {
    setError(null);
    setMessage(null);
    setSelectedSlot(null);
    setSlots([]);

    if (!selectedServiceId || !date) {
      setError('Elegí un servicio y una fecha');
      return;
    }

    setLoadingSlots(true);

    try {
      const params = new URLSearchParams({
        date,
        serviceId: selectedServiceId,
      });
      const res = await fetch(`/api/availability?${params.toString()}`);
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'Error obteniendo horarios');
      } else {
        setSlots(json.slots || []);
        if ((json.slots || []).length === 0) {
          setMessage('No hay horarios disponibles para ese día.');
        }
      }
    } catch (e) {
      console.error(e);
      setError('Error obteniendo horarios');
    } finally {
      setLoadingSlots(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!selectedServiceId || !date || !selectedSlot) {
      setError('Elegí un servicio, una fecha y un horario');
      return;
    }

    const formData = new FormData(e.currentTarget);
    const clientName = String(formData.get('clientName') || '');
    const clientPhone = String(formData.get('clientPhone') || '');
    const notes = String(formData.get('notes') || '');

    if (!clientName || !clientPhone) {
      setError('Completá tu nombre y teléfono');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/appointments/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName,
          clientPhone,
          notes,
          serviceId: selectedServiceId,
          date,
          startTime: selectedSlot.startTime,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'Error al solicitar el turno');
      } else {
        setMessage(
          'Tu solicitud fue enviada. Te van a confirmar el turno por WhatsApp 🙂'
        );
        setSelectedSlot(null);
        setSlots([]);

      }
    } catch (e) {
      console.error(e);
      setError('Error al solicitar el turno');
    } finally {
      setSubmitting(false);
    }
  }

  const selectedService = services.find((s) => s.id === selectedServiceId);
  const minDate = new Date().toISOString().slice(0, 10);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex justify-center px-4 py-6">
      <div className="w-full max-w-xl space-y-5">
        {/* Header */}
        <header className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-lg shadow-black/40"
              style={{ backgroundColor: BRAND_PRIMARY, color: '#020617' }}
            >
              {BRAND_NAME.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-wide">
                {BRAND_NAME}
              </h1>
              <p className="text-[11px] text-slate-400">
                Pedí tu turno online
              </p>
            </div>
          </div>
        </header>

        {/* Card principal */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl shadow-black/40 space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-1">
              Reservar un turno
            </h2>
            <p className="text-xs text-slate-300">
              Son 3 pasos: elegís servicio, fecha y horario; después completás tus datos.
            </p>
          </div>

          {/* Pasos */}
          <div className="flex gap-2 text-[11px] text-slate-300">
            <StepBadge active={!!selectedServiceId} label="Servicio" index={1} />
            <StepBadge active={!!date} label="Fecha" index={2} />
            <StepBadge active={!!selectedSlot} label="Horario" index={3} />
            <StepBadge active={false} label="Tus datos" index={4} />
          </div>

          {/* Servicio */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-200">
              1. Elegí el servicio
            </label>
            {loadingServices ? (
              <p className="text-xs text-slate-400">
                Cargando servicios...
              </p>
            ) : (
              <select
                value={selectedServiceId}
                onChange={(e) => {
                  setSelectedServiceId(e.target.value);
                  setSlots([]);
                  setSelectedSlot(null);
                  setMessage(null);
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                <option value="">Elegí un servicio</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}{' '}
                    {s.durationMinutes
                      ? `· ${s.durationMinutes} min`
                      : ''}{' '}
                    {s.price ? `· $${s.price}` : ''}
                  </option>
                ))}
              </select>
            )}
            {selectedService && (
              <p className="text-[11px] text-slate-400">
                Duración aproximada:{' '}
                <span className="text-slate-200">
                  {selectedService.durationMinutes} minutos
                </span>
                {selectedService.price && (
                  <>
                    {' '}
                    · Precio estimado:{' '}
                    <span className="text-slate-200">
                      ${selectedService.price}
                    </span>
                  </>
                )}
              </p>
            )}
          </div>

          {/* Fecha */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-200">
              2. Elegí la fecha
            </label>
            <input
              type="date"
              value={date}
              min={minDate}
              onChange={(e) => {
                setDate(e.target.value);
                setSlots([]);
                setSelectedSlot(null);
                setMessage(null);
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            />
            <button
              type="button"
              onClick={loadSlots}
              disabled={loadingSlots || !selectedServiceId || !date}
              className="w-full bg-slate-100 text-slate-900 rounded-full py-2 text-xs font-medium mt-1 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              {loadingSlots ? 'Buscando horarios...' : 'Ver horarios disponibles'}
            </button>
          </div>

          {/* Horarios */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-200">
              3. Elegí el horario
            </label>
            {slots.length > 0 ? (
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
                      className={`rounded-full py-1.5 border text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${isSelected
                          ? 'border-indigo-400 bg-indigo-500 text-slate-50'
                          : 'border-slate-700 bg-slate-950 text-slate-100 hover:bg-slate-900'
                        }`}
                    >
                      {slot.startTime}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                Primero elegí servicio y fecha, y tocá &quot;Ver horarios disponibles&quot;.
              </p>
            )}
            {message && (
              <p className="text-[11px] text-slate-300">{message}</p>
            )}
          </div>

          {/* Form datos cliente */}
          {selectedSlot && (
            <form onSubmit={handleSubmit} className="space-y-3 pt-2 border-t border-slate-800">
              <div className="text-xs text-slate-300">
                Turno seleccionado:{' '}
                <span className="font-semibold text-slate-100">
                  {date} · {selectedSlot.startTime}
                </span>
                {selectedService && (
                  <>
                    {' '}
                    · {selectedService.name}
                  </>
                )}
              </div>

              <div>
                <label className="block text-xs mb-1 text-slate-200">
                  Tu nombre
                </label>
                <input
                  name="clientName"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                  required
                />
              </div>

              <div>
                <label className="block text-xs mb-1 text-slate-200">
                  Teléfono (WhatsApp)
                </label>
                <input
                  name="clientPhone"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                  placeholder="Ej: 11 2345 6789"
                  required
                />
              </div>

              <div>
                <label className="block text-xs mb-1 text-slate-200">
                  Notas (diseño, color, uñas que tenés, etc.)
                </label>
                <textarea
                  name="notes"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm min-h-[70px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full py-2 text-sm font-medium shadow-md shadow-black/40 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                style={{ backgroundColor: BRAND_PRIMARY, color: '#020617' }}
              >
                {submitting ? 'Enviando solicitud...' : 'Enviar solicitud de turno'}
              </button>
            </form>
          )}

          {error && (
            <p className="text-xs text-red-400 pt-1 border-t border-slate-800">
              {error}
            </p>
          )}
          {message && !selectedSlot && (
            <p className="text-xs text-emerald-400">{message}</p>
          )}
        </section>
      </div>
    </main>
  );
}

// Badge de pasos
function StepBadge(props: { index: number; label: string; active: boolean }) {
  const { index, label, active } = props;
  return (
    <div className="flex items-center gap-1">
      <div
        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] border ${active
          ? 'bg-slate-100 text-slate-900 border-slate-100'
          : 'bg-slate-900 text-slate-200 border-slate-600'
          }`}
      >
        {index}
      </div>
      <span
        className={`text-[11px] ${active ? 'text-slate-100' : 'text-slate-400'
          }`}
      >
        {label}
      </span>
    </div>
  );
}
