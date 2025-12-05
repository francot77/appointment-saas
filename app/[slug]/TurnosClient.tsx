/* eslint-disable @next/next/no-img-element */
'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
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

type BusinessSettings = {
  publicName: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  backgroundType: 'solid' | 'gradient' | 'image';
  backgroundColor: string;
  gradientFrom: string;
  gradientTo: string;
  backgroundImageUrl: string;
  logoUrl: string;
  heroTitle: string;
  heroSubtitle: string;
  ctaLabel: string;
  aboutEnabled: boolean;
  aboutTitle: string;
  aboutText: string;
  whatsappNumber: string;
  instagramHandle: string;
  address: string;
};

type Props = {
  slug: string;
  businessName: string;
  services: Service[];
  settings: BusinessSettings;
};

export default function TurnosClient({
  slug,
  businessName,
  services,
  settings,
}: Props) {

  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const {
    publicName,
    primaryColor,
    textColor,
    backgroundType,
    backgroundColor,
    gradientFrom,
    gradientTo,
    backgroundImageUrl,
    logoUrl,
    heroTitle,
    heroSubtitle,
    ctaLabel,
    aboutEnabled,
    aboutTitle,
    aboutText,
    whatsappNumber,
    instagramHandle,
    address,
  } = settings;

  // fondo según configuración
  const bgStyle =
    backgroundType === 'image' && backgroundImageUrl
      ? {
        backgroundImage: `url(${backgroundImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
      : backgroundType === 'gradient'
        ? {
          backgroundImage: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
        }
        : {
          backgroundColor: backgroundColor || '#020617',
        };

  // inicial: elegir primer servicio si hay
  useEffect(() => {
    if (services.length > 0 && !selectedServiceId) {
      setSelectedServiceId(services[0].id);
    }
  }, [services, selectedServiceId]);

  const loadSlots = useCallback(async () => {
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

      const res = await fetch(
        `/api/public/${slug}/availability?${params.toString()}`
      );
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
  }, [date, selectedServiceId, slug]);
  useEffect(() => {
    if (!selectedServiceId || !date) return;

    setSelectedSlot(null);
    setMessage(null);
    loadSlots();
  }, [date, selectedServiceId, loadSlots]);
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
      const res = await fetch(`/api/public/${slug}/appointments`, {
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

        const selectedServiceName = services.find(
          (s) => s.id === selectedServiceId
        )?.name;

        const params = new URLSearchParams();
        if (date) params.set('date', date);
        if (selectedSlot.startTime)
          params.set('time', selectedSlot.startTime);
        if (selectedServiceName)
          params.set('service', selectedServiceName);

        router.push(`/${slug}/turno-recibido?${params.toString()}`);
      }
    } catch (e) {
      console.error(e);
      setError('Error al solicitar el turno');
    } finally {
      setSubmitting(false);
    }
  }


  const selectedService = useMemo(
    () => services.find((s) => s.id === selectedServiceId),
    [services, selectedServiceId]
  );


  const today = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  const businessInitial = (
    publicName && publicName.trim()
      ? publicName.trim()
      : businessName && businessName.trim()
        ? businessName.trim()
        : 'B'
  )
    .charAt(0)
    .toUpperCase();


  return (
    <main
      className="min-h-screen text-slate-100 flex justify-center px-4 py-6"
      style={bgStyle}
    >
      <div className="w-full max-w-xl space-y-5">

        <header className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={publicName || businessName}

                className="w-8 h-8 rounded-full object-cover border border-slate-800"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-lg shadow-black/40"
                style={{ backgroundColor: primaryColor, color: '#020617' }}
              >
                {businessInitial}
              </div>
            )}
            <div>
              <h1 className="text-sm font-semibold tracking-wide">
                {publicName || businessName}
              </h1>
              <p className="text-[11px] text-slate-300">
                {heroSubtitle || 'Pedí tu turno online'}
              </p>
            </div>
          </div>
        </header>


        <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl shadow-black/40 space-y-4">
          <div>
            <h2
              className="text-lg font-semibold mb-1"
              style={{ color: textColor || '#f9fafb' }}
            >
              {heroTitle || 'Reservar un turno'}
            </h2>
            <p className="text-xs text-slate-300">
              Son 3 pasos: elegís servicio, fecha y horario; después completás
              tus datos.
            </p>
          </div>


          <div className="flex gap-2 text-[11px] text-slate-300">
            <StepBadge
              active={!!selectedServiceId}
              label="Servicio"
              index={1}
            />
            <StepBadge active={!!date} label="Fecha" index={2} />
            <StepBadge active={!!selectedSlot} label="Horario" index={3} />
            <StepBadge active={false} label="Tus datos" index={4} />
          </div>


          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-200">
              1. Elegí el servicio
            </label>
            {services.length === 0 ? (
              <p className="text-xs text-slate-400">
                Este negocio todavía no cargó servicios.
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
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-500"
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
              min={today}
              onChange={(e) => {
                setDate(e.target.value);
                setSlots([]);
                setSelectedSlot(null);
                setMessage(null);
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
            {date && <button
              type="button"
              onClick={loadSlots}
              disabled={loadingSlots || !selectedServiceId || !date}
              className="w-full bg-slate-100 text-slate-900 rounded-full py-2 text-xs font-medium mt-1 disabled:opacity-60"
            >
              {loadingSlots ? 'Actualizando horarios...' : 'Actualizar horarios'}
            </button>}
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
                      className="rounded-full py-1.5 border text-center transition-colors"
                      style={
                        isSelected
                          ? {
                            borderColor: primaryColor,
                            backgroundColor: primaryColor,
                            color: '#020617',
                          }
                          : {
                            borderColor: '#334155',
                            backgroundColor: '#020617',
                            color: '#e5e7eb',
                          }
                      }
                    >
                      {slot.startTime}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                Primero elegí servicio y fecha, y tocá &quot;Ver horarios
                disponibles&quot;.
              </p>
            )}

          </div>

          {/* Form datos cliente */}
          {selectedSlot && (
            <form
              onSubmit={handleSubmit}
              className="space-y-3 pt-2 border-t border-slate-800"
            >
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
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs mb-1 text-slate-200">
                  Teléfono (WhatsApp)
                </label>
                <input
                  name="clientPhone"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-500"
                  placeholder="Ej: 11 2345 6789"
                  required
                />
              </div>

              <div>
                <label className="block text-xs mb-1 text-slate-200">
                  Notas
                </label>
                <textarea
                  name="notes"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm min-h-[70px] focus:outline-none focus:ring-1 focus:ring-slate-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full py-2 text-sm font-medium shadow-md shadow-black/40 disabled:opacity-60"
                style={{ backgroundColor: primaryColor, color: '#020617' }}
              >
                {submitting
                  ? 'Enviando solicitud...'
                  : ctaLabel || 'Enviar solicitud de turno'}
              </button>
            </form>
          )}

          {error && (
            <p className="text-xs text-red-400 pt-1 border-t border-slate-800">
              {error}
            </p>
          )}
          {message && !selectedSlot && (
            <p className="text-xs text-red-400">{message}</p>
          )}
        </section>

        {/* SOBRE / REDES */}
        {aboutEnabled && (aboutTitle || aboutText) && (
          <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
            <h3 className="text-sm font-semibold">
              {aboutTitle || 'Sobre el estudio'}
            </h3>
            <p className="text-slate-300 whitespace-pre-line">
              {aboutText}
            </p>
          </section>
        )}

        {(whatsappNumber || instagramHandle || address) && (
          <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
            {whatsappNumber && (
              <p>
                WhatsApp:{' '}
                <a
                  href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}`}
                  className="underline underline-offset-2"
                  target="_blank"
                  rel="noreferrer"
                >
                  {whatsappNumber}
                </a>
              </p>
            )}
            {instagramHandle && (
              <p>
                Instagram:{' '}
                <a
                  href={`https://instagram.com/${instagramHandle.replace(
                    /^@/,
                    ''
                  )}`}
                  className="underline underline-offset-2"
                  target="_blank"
                  rel="noreferrer"
                >
                  {instagramHandle}
                </a>
              </p>
            )}
            {address && <p>Dirección: {address}</p>}
          </section>
        )}
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
