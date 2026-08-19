/* eslint-disable @next/next/no-img-element */
'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Service = {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
  color: string;
};

type Slot = { startTime: string; endTime: string };

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

const INK = '#18212b';

function publicErrorMessage(status: number, code: string | undefined, action: 'availability' | 'request') {
  if (status === 404 || code === 'NOT_FOUND') return 'No encontramos este negocio o servicio. Volvé a la página anterior e intentá de nuevo.';
  if (status === 409 || code === 'CONFLICT') return action === 'availability'
    ? 'Ese horario cambió y ya no está disponible. Elegí otra fecha.'
    : 'Ese horario ya no está disponible. Elegí otro para enviar la solicitud.';
  if (status === 400 || code === 'VALIDATION') return action === 'availability'
    ? 'Revisá la fecha y el servicio elegidos.'
    : 'Revisá tus datos y el horario elegido antes de continuar.';
  return action === 'availability'
    ? 'No pudimos consultar los horarios. Revisá tu conexión e intentá de nuevo.'
    : 'No pudimos enviar la solicitud. Revisá tu conexión e intentá de nuevo.';
}

function validHex(value: string | undefined, fallback: string) {
  return value && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value) ? value : fallback;
}

function contrastRatio(first: string, second: string) {
  const channel = (value: number) => {
    const normalized = value / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  const luminance = (color: string) => {
    const hex = color.replace('#', '');
    const normalized = hex.length === 3 ? hex.split('').map((part) => part + part).join('') : hex;
    const [red, green, blue] = [0, 2, 4].map((index) => parseInt(normalized.slice(index, index + 2), 16));
    return 0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue);
  };
  const lighter = Math.max(luminance(first), luminance(second));
  const darker = Math.min(luminance(first), luminance(second));
  return (lighter + 0.05) / (darker + 0.05);
}

function readableText(color: string) {
  return contrastRatio(color, '#ffffff') >= 4.5 ? '#ffffff' : INK;
}

function formatPrice(price: number) {
  return price > 0
    ? `$${new Intl.NumberFormat('es-AR').format(price)}`
    : 'Precio a confirmar';
}

function formatDate(date: string) {
  if (!date) return '';
  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(`${date}T12:00:00`));
}

function localDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function TurnosClient({ slug, businessName, services, settings }: Props) {
  const router = useRouter();
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hasLoadedSlots, setHasLoadedSlots] = useState(false);
  const availabilityRequest = useRef(0);
  const availabilityController = useRef<AbortController | null>(null);

  const primaryColor = validHex(settings.primaryColor, '#334e68');
  const accentColor = validHex(settings.secondaryColor, '#b94735');
  const buttonText = readableText(primaryColor);
  const displayName = settings.publicName?.trim() || businessName.trim() || 'Negocio';
  const selectedService = useMemo(
    () => services.find((service) => service.id === selectedServiceId),
    [services, selectedServiceId],
  );
  const today = useMemo(() => localDateString(new Date()), []);
  const formattedDate = useMemo(() => formatDate(date), [date]);
  const businessInitial = displayName.charAt(0).toUpperCase();
  const detailsStarted = Boolean(selectedSlot);
  const currentStep = !selectedServiceId ? 1 : !date ? 2 : !selectedSlot ? 3 : 4;

  useEffect(() => {
    if (services.length > 0 && !selectedServiceId) setSelectedServiceId(services[0].id);
  }, [services, selectedServiceId]);

  const loadSlots = useCallback(async () => {
    const requestId = ++availabilityRequest.current;
    availabilityController.current?.abort();
    const controller = new AbortController();
    availabilityController.current = controller;
    setAvailabilityError(null);
    setSubmitError(null);
    setSelectedSlot(null);
    setSlots([]);
    setHasLoadedSlots(false);

    if (!selectedServiceId || !date) return;
    setLoadingSlots(true);
    try {
      const params = new URLSearchParams({ date, serviceId: selectedServiceId });
      const res = await fetch(`/api/public/${slug}/availability?${params.toString()}`, { signal: controller.signal });
      const json = await res.json();
      if (requestId !== availabilityRequest.current) return;
      if (!res.ok) {
        console.error('GET public availability failed', { status: res.status, code: json.code, error: json.error });
        setAvailabilityError(publicErrorMessage(res.status, json.code, 'availability'));
        return;
      }
      setSlots(Array.isArray(json.slots) ? json.slots : []);
      setHasLoadedSlots(true);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      if (requestId !== availabilityRequest.current) return;
      console.error(error);
      setAvailabilityError('No pudimos consultar los horarios. Revisá tu conexión e intentá de nuevo.');
    } finally {
      if (requestId !== availabilityRequest.current) return;
      setLoadingSlots(false);
    }
  }, [date, selectedServiceId, slug]);

  function invalidateAvailability() {
    availabilityRequest.current += 1;
    availabilityController.current?.abort();
    availabilityController.current = null;
  }

  useEffect(() => {
    if (selectedServiceId && date) loadSlots();
  }, [date, selectedServiceId, loadSlots]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    if (!selectedServiceId || !date || !selectedSlot) {
      setSubmitError('Elegí un servicio, una fecha y un horario antes de continuar.');
      return;
    }

    const formData = new FormData(event.currentTarget);
    const clientName = String(formData.get('clientName') || '').trim();
    const clientPhone = String(formData.get('clientPhone') || '').trim();
    const notes = String(formData.get('notes') || '').trim();
    if (!clientName || !clientPhone) {
      setSubmitError('Completá tu nombre y teléfono para enviar la solicitud.');
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
        console.error('POST public appointment failed', { status: res.status, code: json.code, error: json.error });
        setSubmitError(publicErrorMessage(res.status, json.code, 'request'));
        return;
      }

      const params = new URLSearchParams({
        date,
        time: selectedSlot.startTime,
        service: selectedService?.name || '',
      });
      const reference = json.appointment?._id || json.appointment?.id;
      if (reference) params.set('reference', String(reference));
      router.push(`/${slug}/turno-recibido?${params.toString()}`);
    } catch (error) {
      console.error(error);
      setSubmitError('No pudimos enviar la solicitud. Revisá tu conexión e intentá de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  function resetAvailability() {
    invalidateAvailability();
    setDate('');
    setSlots([]);
    setSelectedSlot(null);
    setAvailabilityError(null);
    setHasLoadedSlots(false);
  }

  return (
    <main className="min-h-screen bg-[#fbf8f1] px-4 py-5 text-[#18212b] sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-2xl">
        <header className="mb-6 flex items-center gap-3">
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt="" className="h-11 w-11 rounded-full border border-[#d9d4c9] object-cover" />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-full text-lg font-semibold" style={{ backgroundColor: primaryColor, color: buttonText }}>
              {businessInitial}
            </div>
          )}
          <div>
            <p className="text-[15px] font-semibold tracking-tight">{displayName}</p>
            <p className="text-[15px] text-[#617083]">{settings.heroSubtitle?.trim() || 'Reservá tu turno online'}</p>
          </div>
        </header>

        <section className="rounded-[2rem] border border-[#ded9cf] bg-white p-5 shadow-[0_16px_50px_rgba(24,33,43,0.08)] sm:p-8">
          <div className="mb-7 border-b border-[#ebe7df] pb-6">
            <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.16em]" style={{ color: accentColor }}>Reservas online</p>
            <h1 className="max-w-xl text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-4xl">{settings.heroTitle?.trim() || 'Elegí un momento para vos'}</h1>
            <p className="mt-3 max-w-xl text-[15px] leading-6 text-[#617083]">Completá estos cuatro pasos. La solicitud queda pendiente hasta que el negocio confirme tu turno.</p>
          </div>

          <div className="mb-8 grid grid-cols-4 gap-2" aria-label="Progreso de la reserva">
            {[
              ['Servicio', Boolean(selectedServiceId)],
              ['Fecha', Boolean(date)],
              ['Horario', Boolean(selectedSlot)],
              ['Tus datos', detailsStarted],
            ].map(([label, complete], index) => {
              const step = index + 1;
              const isCurrent = currentStep === step;
              return (
                <div key={String(label)} className="min-w-0">
                  <div className="mb-2 h-1.5 rounded-full bg-[#ebe7df]" aria-hidden="true">
                    <div className="h-full rounded-full transition-all" style={{ width: complete ? '100%' : isCurrent ? '45%' : '0%', backgroundColor: primaryColor }} />
                  </div>
                  <p className={`truncate text-[13px] ${isCurrent || complete ? 'font-semibold text-[#18212b]' : 'text-[#8a96a3]'}`}>
                    <span className="sr-only">Paso {step}: </span>{label}
                    {complete && <span className="sr-only"> completado</span>}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="space-y-8">
            <section aria-labelledby="service-heading">
              <StepHeading id="service-heading" number="1" title="Elegí el servicio" hint="Seleccioná la opción que necesitás." />
              {services.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#c9c2b6] bg-[#faf8f3] p-5 text-[15px] text-[#617083]">Este negocio todavía no tiene servicios disponibles.</div>
              ) : (
                <fieldset className="grid gap-3 sm:grid-cols-2">
                  <legend className="sr-only">Servicios disponibles</legend>
                  {services.map((service) => {
                    const isSelected = service.id === selectedServiceId;
                    const serviceColor = validHex(service.color, accentColor);
                    return (
                      <label
                        key={service.id}
                        className={`relative flex min-h-[84px] cursor-pointer rounded-2xl border p-4 text-left transition focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 ${isSelected ? 'border-[#18212b] bg-[#f7f3eb]' : 'border-[#ded9cf] bg-white hover:border-[#a9b2bb]'}`}
                        style={isSelected ? { boxShadow: `inset 4px 0 0 ${serviceColor}`, outlineColor: primaryColor } : { outlineColor: primaryColor }}
                      >
                        <input type="radio" name="service" value={service.id} checked={isSelected} onChange={() => { invalidateAvailability(); setSelectedServiceId(service.id); setSlots([]); setSelectedSlot(null); setAvailabilityError(null); setHasLoadedSlots(false); }} className="sr-only" />
                        <span>
                          <span className="block text-[16px] font-semibold">{service.name}</span>
                          <span className="mt-1 block text-[14px] text-[#617083]">{service.durationMinutes} min · {formatPrice(service.price)}</span>
                        </span>
                      </label>
                    );
                  })}
                </fieldset>
              )}
            </section>

            <section aria-labelledby="date-heading">
              <StepHeading id="date-heading" number="2" title="Elegí la fecha" hint="Te mostramos solo horarios que pueden solicitarse." />
              <label htmlFor="booking-date" className="sr-only">Fecha del turno</label>
              <input id="booking-date" type="date" value={date} min={today} onChange={(event) => { invalidateAvailability(); setDate(event.target.value); setSelectedSlot(null); setAvailabilityError(null); setHasLoadedSlots(false); }} className="min-h-12 w-full rounded-xl border border-[#c9c2b6] bg-white px-4 text-[16px] text-[#18212b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2" style={{ outlineColor: primaryColor }} />
            </section>

            <section aria-labelledby="time-heading">
              <StepHeading id="time-heading" number="3" title="Elegí el horario" hint={date ? `Disponibilidad para el ${formattedDate}.` : 'Primero elegí una fecha.'} />
              <div aria-live="polite" aria-atomic="true">
                {loadingSlots && <div className="rounded-2xl border border-[#ded9cf] bg-[#faf8f3] p-5 text-[15px] text-[#617083]">Buscando horarios disponibles para el {formattedDate}...</div>}
                {!loadingSlots && availabilityError && (
                  <div className="rounded-2xl border border-[#d9a7a0] bg-[#fff5f2] p-5" role="alert">
                    <p className="text-[15px] font-semibold text-[#8d3328]">No pudimos cargar los horarios.</p>
                    <p className="mt-1 text-[15px] text-[#617083]">{availabilityError}</p>
                    <button type="button" onClick={loadSlots} className="mt-4 min-h-11 rounded-full border border-[#8d3328] px-5 text-[15px] font-semibold text-[#8d3328] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2" style={{ outlineColor: primaryColor }}>Reintentar</button>
                  </div>
                )}
                {!loadingSlots && !availabilityError && !date && <p className="rounded-2xl bg-[#faf8f3] p-5 text-[15px] text-[#617083]">Elegí una fecha para consultar los horarios.</p>}
                {!loadingSlots && !availabilityError && date && hasLoadedSlots && slots.length === 0 && <div className="rounded-2xl border border-dashed border-[#c9c2b6] bg-[#faf8f3] p-5"><p className="text-[15px] font-semibold">No hay horarios disponibles ese día.</p><p className="mt-1 text-[15px] text-[#617083]">Probá con otra fecha para encontrar un momento disponible.</p><button type="button" onClick={resetAvailability} className="mt-4 min-h-11 rounded-full border border-[#18212b] px-5 text-[15px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2" style={{ outlineColor: primaryColor }}>Elegir otra fecha</button></div>}
                {!loadingSlots && !availabilityError && slots.length > 0 && (
                  <fieldset className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <legend className="sr-only">Horarios disponibles</legend>
                    {slots.map((slot) => {
                      const isSelected = selectedSlot?.startTime === slot.startTime;
                      return <label key={slot.startTime} className="relative flex min-h-12 cursor-pointer items-center justify-center rounded-xl border text-[16px] font-semibold transition focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2" style={isSelected ? { backgroundColor: primaryColor, borderColor: primaryColor, color: buttonText, outlineColor: primaryColor } : { borderColor: '#c9c2b6', backgroundColor: '#fff', color: INK, outlineColor: primaryColor }}><input type="radio" name="slot" value={slot.startTime} checked={isSelected} onChange={() => setSelectedSlot(slot)} className="sr-only" /><span>{slot.startTime}</span></label>;
                    })}
                  </fieldset>
                )}
              </div>
            </section>

            {selectedSlot && selectedService && (
              <section aria-labelledby="details-heading" className="border-t border-[#ebe7df] pt-8">
                <StepHeading id="details-heading" number="4" title="Completá tus datos" hint="Los necesitamos para que el negocio pueda contactarte." />
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="rounded-2xl border border-[#ded9cf] bg-[#faf8f3] p-5" aria-label="Resumen de la solicitud">
                    <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#617083]">Antes de enviar</p>
                    <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-[15px]">
                      <SummaryItem label="Servicio" value={selectedService.name} />
                      <SummaryItem label="Duración" value={`${selectedService.durationMinutes} minutos`} />
                      <SummaryItem label="Precio" value={formatPrice(selectedService.price)} />
                      <SummaryItem label="Fecha" value={formattedDate} />
                      <SummaryItem label="Horario" value={`${selectedSlot.startTime} hs`} />
                    </dl>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="text-[15px] font-semibold" htmlFor="client-name">Tu nombre<input id="client-name" name="clientName" autoComplete="name" required className="mt-2 min-h-12 w-full rounded-xl border border-[#c9c2b6] px-4 text-[16px] font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2" style={{ outlineColor: primaryColor }} /></label>
                    <label className="text-[15px] font-semibold" htmlFor="client-phone">Teléfono o WhatsApp<input id="client-phone" name="clientPhone" type="tel" autoComplete="tel" placeholder="Ej: 11 2345 6789" required className="mt-2 min-h-12 w-full rounded-xl border border-[#c9c2b6] px-4 text-[16px] font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2" style={{ outlineColor: primaryColor }} /></label>
                  </div>
                  <label className="block text-[15px] font-semibold" htmlFor="booking-notes">Nota para el negocio <span className="font-normal text-[#617083]">(opcional)</span><textarea id="booking-notes" name="notes" rows={3} className="mt-2 w-full rounded-xl border border-[#c9c2b6] px-4 py-3 text-[16px] font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2" style={{ outlineColor: primaryColor }} /></label>
                  <p className="text-[14px] leading-5 text-[#617083]">Al enviar, vas a pedir este horario. El turno queda pendiente hasta que el negocio lo confirme por WhatsApp o por el canal que use.</p>
                  {submitError && <p className="text-[15px] font-semibold text-[#8d3328]" role="alert" aria-live="assertive">{submitError}</p>}
                  <button type="submit" disabled={submitting} className="min-h-14 w-full rounded-full px-6 text-[16px] font-semibold shadow-sm transition hover:brightness-95 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2" style={{ backgroundColor: primaryColor, color: buttonText, outlineColor: primaryColor }}>{submitting ? 'Enviando solicitud...' : settings.ctaLabel?.trim() || 'Enviar solicitud de turno'}</button>
                </form>
              </section>
            )}
          </div>
        </section>

        {settings.aboutEnabled && (settings.aboutTitle?.trim() || settings.aboutText?.trim()) && <section className="mt-5 rounded-2xl border border-[#ded9cf] bg-white p-5"><h2 className="text-lg font-semibold">{settings.aboutTitle?.trim() || 'Sobre el negocio'}</h2><p className="mt-2 whitespace-pre-line text-[15px] leading-6 text-[#617083]">{settings.aboutText}</p></section>}
        {(settings.whatsappNumber || settings.instagramHandle || settings.address) && <section className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[15px] text-[#617083]"><span className="sr-only">Información de contacto:</span>{settings.whatsappNumber && <a className="underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2" style={{ outlineColor: primaryColor }} href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">WhatsApp</a>}{settings.instagramHandle && <a className="underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2" style={{ outlineColor: primaryColor }} href={`https://instagram.com/${settings.instagramHandle.replace(/^@/, '')}`} target="_blank" rel="noreferrer">Instagram</a>}{settings.address && <span>{settings.address}</span>}</section>}
      </div>
    </main>
  );
}

function StepHeading({ id, number, title, hint }: { id: string; number: string; title: string; hint: string }) {
  return <div className="mb-4"><h2 id={id} className="text-[19px] font-semibold tracking-tight"><span className="mr-2 text-[#b94735]">{number}.</span>{title}</h2><p className="mt-1 text-[15px] leading-5 text-[#617083]">{hint}</p></div>;
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-[13px] text-[#617083]">{label}</dt><dd className="mt-0.5 font-semibold">{value}</dd></div>;
}
