'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';

type DemoService = { id: string; name: string; durationMinutes: number; price: number };
type DemoSlot = { startTime: string; endTime: string };
type View = 'clientForm' | 'clientSuccess' | 'adminList' | 'adminDetail' | 'magicReschedule';
type DemoAppt = { time: string; name: string; service: string; status: 'request' | 'confirmed' };

const STEPS: { id: View; title: string; description: string }[] = [
  { id: 'clientForm', title: 'Una persona elige un turno', description: 'La página pública muestra servicios, fecha, horarios y los datos necesarios para enviar una solicitud.' },
  { id: 'clientSuccess', title: 'La solicitud queda recibida', description: 'La persona ve un resumen claro. El turno queda pendiente hasta que el negocio lo confirme.' },
  { id: 'adminList', title: 'La solicitud aparece en tu agenda', description: 'El panel reúne turnos pendientes y confirmados para que sepas qué atender primero.' },
  { id: 'adminDetail', title: 'Consultás el detalle', description: 'El negocio puede revisar los datos del turno y usar las acciones reales disponibles en su panel.' },
  { id: 'magicReschedule', title: 'La persona puede reprogramar', description: 'Un enlace específico permite elegir otro horario sin crear una cuenta de cliente.' },
];

const DEMO_SERVICES: DemoService[] = [
  { id: '1', name: 'Corte clásico', durationMinutes: 30, price: 6000 },
  { id: '2', name: 'Corte + barba', durationMinutes: 45, price: 8000 },
];
const DEMO_SLOTS: DemoSlot[] = [
  { startTime: '10:00', endTime: '10:30' },
  { startTime: '10:30', endTime: '11:00' },
  { startTime: '11:00', endTime: '11:30' },
];
const DEMO_APPOINTMENTS: DemoAppt[] = [
  { time: '10:00', name: 'Lucas', service: 'Corte clásico', status: 'request' },
  { time: '11:00', name: 'Martín', service: 'Corte + barba', status: 'confirmed' },
  { time: '12:00', name: 'Santiago', service: 'Afeitado prolijo', status: 'confirmed' },
];

export default function DemoPage() {
  const [stepIndex, setStepIndex] = useState(0);
  const step = STEPS[stepIndex];

  function go(delta: number) {
    setStepIndex((current) => Math.max(0, Math.min(STEPS.length - 1, current + delta)));
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#fbf8f1] text-[#18212b]">
      <header className="border-b border-[#ded9cf] bg-[#fbf8f1]/95">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#334e68]" aria-label="FezTime, inicio">
            <Image src="/feztime-logo.svg" alt="" width={34} height={34} priority />
            <span className="truncate text-base font-semibold tracking-[-0.02em]">FezTime <span className="font-normal text-[#617083]">/ Vista previa</span></span>
          </Link>
          <nav className="flex items-center gap-3 text-sm font-semibold sm:gap-5" aria-label="Navegación de demo">
            <Link href="/login" className="rounded px-1 py-2 text-[#617083] underline-offset-4 hover:text-[#18212b] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#334e68]">Ingresar</Link>
            <Link href="/register" className="rounded-full bg-[#334e68] px-4 py-2.5 text-white shadow-sm hover:bg-[#263e54] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#334e68] focus-visible:ring-offset-2">Crear mi agenda</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-end">
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-[#b94735]">Demo guiada · datos ficticios</p>
            <h1 className="max-w-xl text-4xl font-semibold leading-[1.05] tracking-[-0.05em] sm:text-6xl">Una agenda clara para ver cómo funciona FezTime.</h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-[#617083] sm:text-lg">Recorré una solicitud de turno desde la página pública hasta el panel del negocio. Esta experiencia es una vista previa: no crea reservas ni guarda cambios.</p>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <Link href="/register" className="inline-flex min-h-12 items-center rounded-full bg-[#334e68] px-6 font-semibold text-white shadow-sm hover:bg-[#263e54] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#334e68] focus-visible:ring-offset-2">Crear mi agenda <span aria-hidden="true" className="ml-2">→</span></Link>
              <Link href="/login" className="rounded px-1 py-2 font-semibold text-[#334e68] underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#334e68]">Ya tengo una cuenta</Link>
            </div>
          </div>
          <div className="border-l-2 border-[#e5b0a7] pl-5 text-sm leading-6 text-[#617083] sm:pl-7"><p className="font-semibold text-[#18212b]">Qué estás viendo</p><p className="mt-1">Una representación orientativa de la experiencia del cliente y del negocio. Los nombres, horarios y precios son de ejemplo.</p></div>
        </div>

        <div className="mt-12 overflow-hidden rounded-[1.5rem] border border-[#d9d4c9] bg-white shadow-[0_18px_55px_rgba(24,33,43,0.08)] sm:mt-16">
          <div className="border-b border-[#ebe7df] bg-[#faf8f3] p-5 sm:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-3"><button type="button" onClick={() => go(-1)} disabled={stepIndex === 0} aria-label="Paso anterior" className="h-10 w-10 shrink-0 rounded-full border border-[#c9c2b6] text-lg text-[#334e68] hover:bg-white disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#334e68]">←</button><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#b94735]">Paso {stepIndex + 1} de {STEPS.length}</p><h2 className="mt-1 text-xl font-semibold tracking-[-0.03em]">{step.title}</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-[#617083]">{step.description}</p></div></div>
              <button type="button" onClick={() => go(1)} disabled={stepIndex === STEPS.length - 1} className="min-h-11 rounded-full border border-[#334e68] px-4 text-sm font-semibold text-[#334e68] hover:bg-white disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#334e68]">Siguiente <span aria-hidden="true">→</span></button>
            </div>
            <div className="mt-6 grid grid-cols-5 gap-1.5" aria-label="Pasos de la vista previa">
              {STEPS.map((item, index) => <button key={item.id} type="button" onClick={() => setStepIndex(index)} aria-label={`Ver paso ${index + 1}: ${item.title}`} aria-current={index === stepIndex ? 'step' : undefined} className={`h-1.5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#334e68] ${index <= stepIndex ? 'bg-[#334e68]' : 'bg-[#d9d4c9]'}`} />)}
            </div>
          </div>
          <div className="p-4 sm:p-8">
            <div className="mb-5 flex items-center justify-between gap-3"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#617083]">Vista del producto</p><span className="rounded-full border border-[#e5b0a7] bg-[#fff5f2] px-3 py-1 text-xs font-semibold text-[#8d3328]">Simulación · no se guarda</span></div>
            <div className="rounded-2xl border border-[#ded9cf] bg-[#fbf8f1] p-4 sm:p-7">
              {step.id === 'clientForm' && <DemoClientBooking />}
              {step.id === 'clientSuccess' && <DemoClientSuccess />}
              {step.id === 'adminList' && <DemoAdminPanel />}
              {step.id === 'adminDetail' && <DemoAdminDetail />}
              {step.id === 'magicReschedule' && <DemoMagicReschedule />}
            </div>
          </div>
        </div>
         <p className="mt-5 max-w-3xl text-sm leading-6 text-[#617083]">Datos de ejemplo; no crea reservas ni guarda cambios.</p>
      </section>
    </main>
  );
}

function Frame({ eyebrow, title, subtitle, children }: { eyebrow: string; title: string; subtitle: string; children: ReactNode }) {
  return <div className="mx-auto max-w-3xl"><div className="mb-6 flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#334e68] text-lg font-semibold text-white">B</div><div><p className="font-semibold">Barbería Centro <span className="ml-1 text-xs font-normal text-[#617083]">(ejemplo)</span></p><p className="text-sm text-[#617083]">{subtitle}</p></div></div><div className="rounded-2xl border border-[#ded9cf] bg-white p-5 shadow-sm sm:p-7"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#b94735]">{eyebrow}</p><h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{title}</h3>{children}</div></div>;
}

function DemoClientBooking() {
  const [serviceId, setServiceId] = useState(DEMO_SERVICES[0].id);
  const [slot, setSlot] = useState(DEMO_SLOTS[0].startTime);
  const service = DEMO_SERVICES.find((item) => item.id === serviceId) ?? DEMO_SERVICES[0];
  return <Frame eyebrow="Página pública · simulación" title="Reservá un turno" subtitle="Elegí servicio, fecha y horario"><p className="mt-2 text-sm leading-6 text-[#617083]">Así puede verse una agenda compartible para tus clientes.</p><fieldset className="mt-7"><legend className="text-sm font-semibold">1. Servicio</legend><div className="mt-2 grid gap-3 sm:grid-cols-2">{DEMO_SERVICES.map((item) => <label key={item.id} className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 focus-within:ring-2 focus-within:ring-[#334e68] ${item.id === serviceId ? 'border-[#334e68] bg-[#f7f3eb]' : 'border-[#ded9cf]'}`}><span><input type="radio" name="demo-service" value={item.id} checked={item.id === serviceId} onChange={() => setServiceId(item.id)} className="sr-only" /><span className="block font-semibold">{item.name}</span><span className="mt-1 block text-sm text-[#617083]">{item.durationMinutes} min</span></span><span className="text-sm font-semibold">${item.price.toLocaleString('es-AR')}</span></label>)}</div></fieldset><div className="mt-6"><p className="text-sm font-semibold">2. Fecha</p><div className="mt-2 rounded-xl border border-[#ded9cf] bg-[#faf8f3] px-4 py-3 text-sm">Lunes 12 de enero de 2026 <span className="ml-2 text-[#617083]">(ejemplo)</span></div></div><fieldset className="mt-6"><legend className="text-sm font-semibold">3. Horario</legend><div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">{DEMO_SLOTS.map((item) => <label key={item.startTime} className={`flex min-h-12 cursor-pointer items-center justify-center rounded-xl border text-sm font-semibold focus-within:ring-2 focus-within:ring-[#334e68] ${item.startTime === slot ? 'border-[#334e68] bg-[#334e68] text-white' : 'border-[#c9c2b6] bg-white'}`}><input type="radio" name="demo-slot" value={item.startTime} checked={item.startTime === slot} onChange={() => setSlot(item.startTime)} className="sr-only" />{item.startTime}</label>)}</div></fieldset><p className="mt-6 border-t border-[#ebe7df] pt-5 text-sm leading-6 text-[#617083]">En el producto real, el cliente completa sus datos y envía una solicitud. Este control solo cambia la vista previa.</p><p className="mt-3 text-sm font-semibold text-[#334e68]">Seleccionado: {service.name} · {slot} hs</p></Frame>;
}

function DemoClientSuccess() {
  return <Frame eyebrow="Turno recibido · simulación" title="Tu solicitud fue enviada" subtitle="La persona recibe un resumen claro"><div className="mt-6 rounded-xl border border-[#c9ded2] bg-[#f3faf5] p-4"><p className="font-semibold text-[#23613f]">Solicitud recibida, pendiente de confirmación</p><p className="mt-1 text-sm leading-6 text-[#496756]">El negocio todavía debe confirmar el horario. No es una confirmación automática.</p></div><dl className="mt-6 grid gap-4 border-b border-[#ebe7df] pb-6 sm:grid-cols-2"><Detail label="Servicio" value="Corte clásico" /><Detail label="Fecha y hora" value="Lunes 12/01/2026 · 10:00 hs" /><Detail label="Contacto" value="WhatsApp del cliente" /><Detail label="Estado" value="Pendiente" /></dl><p className="mt-5 text-sm leading-6 text-[#617083]">En esta demo no se envía ningún mensaje ni se crea un turno. El flujo real conserva el estado pendiente hasta la respuesta del negocio.</p></Frame>;
}

function DemoAdminPanel() {
  return <div className="mx-auto max-w-3xl"><div className="flex flex-col gap-4 border-b border-[#ded9cf] pb-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#b94735]">Panel del negocio · simulación</p><h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Agenda de Barbería Centro</h3></div><p className="text-sm text-[#617083]">Lunes 12 de enero · datos ficticios</p></div><div className="mt-6 grid gap-3">{DEMO_APPOINTMENTS.map((appointment) => <div key={appointment.time} className="flex flex-col gap-3 rounded-xl border border-[#ded9cf] bg-white p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-start gap-4"><span className="font-semibold text-[#334e68]">{appointment.time}</span><div className="min-w-0"><p className="font-semibold">{appointment.name}</p><p className="truncate text-sm text-[#617083]">{appointment.service}</p></div></div><StatusPill status={appointment.status} /></div>)}</div><p className="mt-5 text-sm leading-6 text-[#617083]">La lista muestra estados reales del flujo, pero estos registros son solo ejemplos. Las acciones de confirmar, rechazar y comunicar se ejecutan en el panel real, no desde esta demo.</p></div>;
}

function DemoAdminDetail() {
  return <div className="mx-auto max-w-3xl"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#b94735]">Detalle de turno · simulación</p><h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Solicitud de Lucas</h3><div className="mt-6 grid gap-4 rounded-xl border border-[#ded9cf] bg-white p-5 sm:grid-cols-2"><Detail label="Servicio" value="Corte clásico" /><Detail label="Fecha" value="Lunes 12 de enero de 2026" /><Detail label="Horario" value="10:00 a 10:30 hs" /><Detail label="Estado" value="Pendiente" /><Detail label="WhatsApp" value="Número de ejemplo" /><Detail label="Nota" value="Mantener el largo de arriba" /></div><div className="mt-5 rounded-xl border border-[#e5b0a7] bg-[#fff5f2] p-4 text-sm leading-6 text-[#8d3328]">Las acciones visibles en esta pantalla no son botones porque esta vista previa no persiste cambios ni abre WhatsApp. En el producto real, el panel ofrece esas acciones con confirmación y feedback.</div></div>;
}

function DemoMagicReschedule() {
  const [slot, setSlot] = useState('12:00');
  const [simulated, setSimulated] = useState(false);
  return <div className="mx-auto max-w-3xl"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#b94735]">Enlace de reprogramación · simulación</p><h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Elegí otro horario</h3><p className="mt-2 text-sm leading-6 text-[#617083]">El enlace de un turno puede llevar a una pantalla específica, sin pedir una cuenta de cliente.</p><div className="mt-6 rounded-xl border border-[#ded9cf] bg-white p-5"><p className="text-sm font-semibold">Turno actual</p><p className="mt-2 text-sm text-[#617083]">Barbería Centro · Corte clásico · lunes 12/01/2026 · 10:00 hs</p><fieldset className="mt-6"><legend className="text-sm font-semibold">Nuevo horario</legend><div className="mt-2 grid grid-cols-3 gap-3">{['11:00', '11:30', '12:00'].map((time) => <label key={time} className={`flex min-h-12 cursor-pointer items-center justify-center rounded-xl border text-sm font-semibold focus-within:ring-2 focus-within:ring-[#334e68] ${slot === time ? 'border-[#334e68] bg-[#334e68] text-white' : 'border-[#c9c2b6]'}`}><input type="radio" name="reschedule-slot" value={time} checked={slot === time} onChange={() => { setSlot(time); setSimulated(false); }} className="sr-only" />{time}</label>)}</div></fieldset><button type="button" onClick={() => setSimulated(true)} className="mt-6 min-h-12 w-full rounded-full bg-[#334e68] px-5 font-semibold text-white hover:bg-[#263e54] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#334e68] focus-visible:ring-offset-2">Simular selección de {slot} hs</button>{simulated && <p className="mt-4 rounded-lg bg-[#f3faf5] p-3 text-sm font-semibold text-[#23613f]" role="status">Vista previa actualizada. Ningún turno fue modificado.</p>}</div></div>;
}

function Detail({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs font-bold uppercase tracking-[0.12em] text-[#617083]">{label}</dt><dd className="mt-1 text-sm font-semibold">{value}</dd></div>; }
function StatusPill({ status }: { status: DemoAppt['status'] }) { return <span className={`self-start rounded-full border px-3 py-1 text-xs font-semibold sm:self-auto ${status === 'request' ? 'border-[#e5b0a7] bg-[#fff5f2] text-[#8d3328]' : 'border-[#c9ded2] bg-[#f3faf5] text-[#23613f]'}`}>{status === 'request' ? 'Pendiente' : 'Confirmado'}</span>; }
