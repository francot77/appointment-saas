// app/demo/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';

const PRIMARY = '#6366F1';

type DemoService = {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
};

type DemoSlot = {
  startTime: string;
  endTime: string;
};

type View =
  | 'clientForm'
  | 'clientSuccess'
  | 'adminList'
  | 'adminDetail'
  | 'magicReschedule';

const STEPS: { id: View; title: string; description: string }[] = [
  {
    id: 'clientForm',
    title: 'Cliente reserva el turno',
    description:
      'El cliente entra a tu página pública, elige servicio, fecha, horario y deja su WhatsApp.',
  },
  {
    id: 'clientSuccess',
    title: 'Pantalla de “turno recibido”',
    description:
      'Después de enviar el formulario, el cliente ve una confirmación clara con el resumen de su solicitud.',
  },
  {
    id: 'adminList',
    title: 'El turno aparece en el panel',
    description:
      'En el panel del negocio ves los turnos del día/semana, filtrás por estado y evitás superposiciones.',
  },
  {
    id: 'adminDetail',
    title: 'Detalle del turno (modal)',
    description:
      'Abrís el turno, ves todos los datos y podés confirmar, rechazar o reprogramar con un par de clicks.',
  },
  {
    id: 'magicReschedule',
    title: 'Reprogramación con link',
    description:
      'El cliente abre un link desde WhatsApp, elige otro horario y el cambio impacta directo en tu panel.',
  },
];

export default function DemoPage() {
  const [stepIndex, setStepIndex] = useState(0);
  const step = STEPS[stepIndex];
  const view = step.id;

  function go(delta: number) {
    setStepIndex((prev) => {
      const next = prev + delta;
      if (next < 0) return 0;
      if (next >= STEPS.length) return STEPS.length - 1;
      return next;
    });
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden">
      {/* HEADER */}
      <header className="border-b border-slate-800">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shadow-lg shadow-black/40"
              style={{ backgroundColor: PRIMARY, color: '#020617' }}
            >
              T
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-wide">
                Demo · Tu SaaS de Turnos
              </p>
              <p className="text-[10px] text-slate-400">
                Flujo completo con pantallas clave
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Link href="/" className="text-slate-400 hover:text-slate-100">
              Volver al inicio
            </Link>
            <Link
              href="/login"
              className="px-1.5 py-1.5 text-center rounded-full border border-slate-700 hover:bg-slate-900"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-8 space-y-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">
            Demo del flujo real de turnos
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl">
            Mirá, paso a paso, qué ve el cliente, qué ves vos en el panel y cómo
            funciona la reprogramación con link desde WhatsApp.
          </p>
        </div>

        {/* CONTENEDOR DE DEMO */}
        <div className="relative">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="absolute bottom-[-20px] -left-8 w-40 h-40 rounded-full bg-emerald-500/20 blur-3xl" />

          <div className="relative bg-slate-950/90 border border-slate-800 rounded-2xl p-4 shadow-2xl shadow-black/60 space-y-4">
            {/* CARROUSEL DE PASO ACTUAL */}
            <div className="flex items-center justify-between gap-3 text-[11px]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => go(-1)}
                  disabled={stepIndex === 0}
                  className="px-2 py-1 rounded-full border border-slate-700 text-slate-300 hover:bg-slate-900 disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  ◀
                </button>
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-slate-100">
                    {step.title}
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-md">
                    {step.description}
                  </p>
                </div>
              </div>

              <div className="text-right space-y-1">
                <p className="text-[10px] text-slate-400">
                  Paso {stepIndex + 1} de {STEPS.length}
                </p>
                <div className="flex items-center justify-end gap-1">
                  {STEPS.map((_, idx) => (
                    <span
                      key={idx}
                      className={`w-1.5 h-1.5 rounded-full ${
                        idx === stepIndex
                          ? 'bg-slate-100'
                          : 'bg-slate-600/60'
                      }`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => go(1)}
                  disabled={stepIndex === STEPS.length - 1}
                  className="mt-1 px-2 py-1 rounded-full border border-slate-700 text-[10px] text-slate-200 hover:bg-slate-900 disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  Siguiente ▶
                </button>
              </div>
            </div>

            {/* PREVIEW PRINCIPAL */}
            <div className="border border-slate-800 rounded-xl p-3 bg-slate-950/80">
              {view === 'clientForm' && <DemoClientBooking />}
              {view === 'clientSuccess' && <DemoClientSuccess />}
              {view === 'adminList' && <DemoAdminPanel />}
              {view === 'adminDetail' && <DemoAdminDetail />}
              {view === 'magicReschedule' && <DemoMagicReschedule />}
            </div>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 max-w-3xl">
          En la implementación real los layouts y funciones pueden ser ligeramente diferentes a la demo, pero la experiencia general y los conceptos son los mismos.
        </p>
      </section>
    </main>
  );
}

/* ===========================
   DEMO: FLUJO CLIENTE
   =========================== */

const DEMO_SERVICES: DemoService[] = [
  { id: '1', name: 'Corte clásico', durationMinutes: 30, price: 6000 },
  { id: '2', name: 'Corte + barba', durationMinutes: 45, price: 8000 },
];

const DEMO_SLOTS: DemoSlot[] = [
  { startTime: '10:00', endTime: '10:30' },
  { startTime: '10:30', endTime: '11:00' },
  { startTime: '11:00', endTime: '11:30' },
];

function DemoClientBooking() {
  const service = DEMO_SERVICES[0];

  return (
    <div className="space-y-3 text-[11px]">
      {/* Header negocio */}
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg shadow-black/40"
          style={{ backgroundColor: PRIMARY, color: '#020617' }}
        >
          B
        </div>
        <div>
          <p className="text-[11px] font-semibold">Barbería Centro</p>
          <p className="text-[10px] text-slate-400">
            Reservá tu turno online
          </p>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-3">
        <div>
          <p className="text-[11px] font-semibold">
            Reservar un turno
          </p>
          <p className="text-[10px] text-slate-400">
            El cliente elige servicio, fecha, horario y deja su WhatsApp.
          </p>
        </div>

        {/* Servicio */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-slate-300">
            1. Servicio
          </label>
          <div className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 flex items-center justify-between">
            <span className="text-[10px] text-slate-300">
              {service.name} · {service.durationMinutes} min
            </span>
            <span className="text-[10px] text-slate-400">
              ${service.price}
            </span>
          </div>
        </div>

        {/* Fecha */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-slate-300">
            2. Fecha
          </label>
          <div className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-300">
            2026-01-12
          </div>
        </div>

        {/* Horario */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-slate-300">
            3. Horario
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {DEMO_SLOTS.map((slot, idx) => (
              <button
                key={slot.startTime}
                className={`rounded-full py-1 border text-center ${
                  idx === 0
                    ? 'border-slate-100 bg-slate-100 text-slate-900'
                    : 'border-slate-700 bg-slate-950 text-slate-100'
                }`}
              >
                {slot.startTime}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5 pt-1 border-t border-slate-800">
          <p className="text-[10px] text-slate-400">
            En la app real, después de elegir horario el cliente completa nombre
            y WhatsApp. El turno entra al panel del negocio.
          </p>
        </div>
      </div>
    </div>
  );
}

function DemoClientSuccess() {
  return (
    <div className="space-y-3 text-[11px]">
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg shadow-black/40"
          style={{ backgroundColor: PRIMARY, color: '#020617' }}
        >
          B
        </div>
        <div>
          <p className="text-[11px] font-semibold">Barbería Centro</p>
          <p className="text-[10px] text-emerald-400">
            Tu turno fue recibido
          </p>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-emerald-600/40 rounded-xl p-3 space-y-3">
        <div className="flex items-start gap-2">
          <div className="mt-[2px]">
            <span className="inline-flex w-4 h-4 items-center justify-center rounded-full bg-emerald-500 text-slate-950 text-[10px]">
              ✓
            </span>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-emerald-300">
              Tu solicitud de turno fue enviada
            </p>
            <p className="text-[10px] text-slate-300 mt-1">
              Vas a recibir la confirmación por WhatsApp al número que
              ingresaste. Si necesitás reprogramar o cancelar, te van a pasar un
              link directo.
            </p>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-lg p-2 space-y-1">
          <p className="text-[10px] text-slate-400">
            Resumen de tu solicitud:
          </p>
          <p className="text-[10px] text-slate-200">
            • Servicio: <span className="font-medium">Corte clásico</span>
          </p>
          <p className="text-[10px] text-slate-200">
            • Día: <span className="font-medium">Lunes 12/01/2026</span>
          </p>
          <p className="text-[10px] text-slate-200">
            • Horario: <span className="font-medium">10:00</span>
          </p>
        </div>

        <p className="text-[10px] text-slate-500">
          Esta pantalla es lo que ve el cliente después de enviar el formulario.
          El turno entra como “Pendiente” en el panel del negocio.
        </p>
      </div>
    </div>
  );
}

/* ===========================
   DEMO: PANEL ADMIN (LISTA)
   =========================== */

type DemoAppt = {
  time: string;
  name: string;
  service: string;
  status: 'request' | 'confirmed';
};

const DEMO_APPOINTMENTS: DemoAppt[] = [
  { time: '10:00', name: 'Lucas', service: 'Corte clásico', status: 'request' },
  { time: '11:00', name: 'Martín', service: 'Corte + barba', status: 'confirmed' },
  { time: '12:00', name: 'Santiago', service: 'Afeitado prolijo', status: 'confirmed' },
];

function StatusPill({
  label,
  variant,
}: {
  label: string;
  variant: 'request' | 'confirmed';
}) {
  const classes =
    variant === 'request'
      ? 'bg-amber-500/20 text-amber-300'
      : 'bg-emerald-500/20 text-emerald-300';

  return (
    <span
      className={`text-[9px] px-2 py-0.5 rounded-full ${classes}`}
    >
      {label}
    </span>
  );
}

function DemoAdminPanel() {
  return (
    <div className="space-y-3 text-[11px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold"
            style={{ backgroundColor: PRIMARY, color: '#020617' }}
          >
            B
          </div>
          <div>
            <p className="font-semibold">Barbería Centro</p>
            <p className="text-[10px] text-slate-400">
              Panel de turnos · Hoy
            </p>
          </div>
        </div>
        <div className="text-[10px] text-slate-400">
          Vista día / semana / calendario
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 text-[10px]">
        <div className="inline-flex rounded-md border border-slate-700 overflow-hidden">
          <span className="px-2 py-0.5 bg-slate-100 text-slate-900">
            Día
          </span>
          <span className="px-2 py-0.5 bg-slate-900 text-slate-400">
            Semana
          </span>
        </div>
        <div className="inline-flex rounded-md border border-slate-700 overflow-hidden">
          <span className="px-2 py-0.5 bg-slate-100 text-slate-900">
            Pendientes
          </span>
          <span className="px-2 py-0.5 bg-slate-900 text-slate-400">
            Confirmados
          </span>
          <span className="px-2 py-0.5 bg-slate-900 text-slate-400">
            Todos
          </span>
        </div>
      </div>

      {/* Lista de turnos */}
      <div className="space-y-1.5 mt-1">
        {DEMO_APPOINTMENTS.map((a, idx) => (
          <div
            key={idx}
            className="flex items-start justify-between bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-indigo-300">
                  {a.time}
                </span>
                <span className="text-[11px]">{a.name}</span>
                <StatusPill
                  label={a.status === 'request' ? 'Pendiente' : 'Confirmado'}
                  variant={a.status}
                />
              </div>
              <p className="text-[10px] text-slate-400 truncate max-w-[200px]">
                {a.service}
              </p>
            </div>
            {a.status === 'request' && (
              <div className="flex gap-1 ml-2">
                <div className="px-2 py-0.5 rounded-md text-[10px] bg-slate-100 text-slate-900">
                  Confirmar
                </div>
                <div className="px-2 py-0.5 rounded-md text-[10px] border border-slate-700 text-slate-200">
                  Rechazar
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 space-y-1">
        <p>
          Acá ves los turnos del día. En la app real también cambiás a semana o
          calendario para ver mejor la carga.
        </p>
      </div>
    </div>
  );
}

/* ===========================
   DEMO: DETALLE / MODAL ADMIN
   =========================== */

function DemoAdminDetail() {
  return (
    <div className="space-y-3 text-[11px]">
      {/* Mini contexto: turno seleccionado en la lista */}
      <div className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-indigo-300">
            10:00
          </span>
          <span className="text-[11px]">Lucas</span>
          <span className="text-[10px] text-slate-400">
            Corte clásico
          </span>
        </div>
        <span className="text-[10px] text-slate-500">
          Turno seleccionado en la lista
        </span>
      </div>

      {/* "Modal" de detalle – pero en flujo normal, sin absolute */}
      <div className="w-full bg-slate-950 border border-slate-800 rounded-xl shadow-2xl shadow-black/80 p-3 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold">
            Detalle del turno
          </p>
          <span className="text-[10px] text-slate-500">
            Vista tipo modal / panel lateral
          </span>
        </div>

        <div className="space-y-1 text-[10px]">
          <p className="text-slate-400">
            Cliente:{' '}
            <span className="text-slate-100 font-medium">Lucas</span>
          </p>
          <p className="text-slate-400">
            Servicio:{' '}
            <span className="text-slate-100 font-medium">
              Corte clásico
            </span>
          </p>
          <p className="text-slate-400">
            Día:{' '}
            <span className="text-slate-100 font-medium">
              Lunes 12/01/2026
            </span>
          </p>
          <p className="text-slate-400">
            Hora:{' '}
            <span className="text-slate-100 font-medium">
              10:00–10:30
            </span>
          </p>
          <p className="text-slate-400">
            WhatsApp:{' '}
            <span className="text-slate-100 font-medium">
              +54 9 11 2345 6789
            </span>
          </p>
        </div>

        <div className="space-y-1 text-[10px]">
          <p className="text-slate-400">
            Notas del cliente:
          </p>
          <p className="text-slate-200 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1">
            “Corte clásico, sin navaja. Si se puede, mantener el largo de la
            parte de arriba.”
          </p>
        </div>

        <div className="flex flex-wrap gap-2 justify-end pt-1">
          <button className="px-3 py-1.5 rounded-md border border-slate-700 text-[10px] text-slate-200 hover:bg-slate-900">
            Reprogramar
          </button>
          <button className="px-3 py-1.5 rounded-md border border-slate-700 text-[10px] text-slate-200 hover:bg-slate-900">
            Rechazar
          </button>
          <button
            className="px-3 py-1.5 rounded-md text-[10px] font-semibold shadow-md shadow-black/40"
            style={{ backgroundColor: PRIMARY, color: '#020617' }}
          >
            Confirmar y abrir WhatsApp
          </button>
        </div>

        <p className="text-[10px] text-slate-500">
          Desde acá, en la app real, se dispara el mensaje de WhatsApp con
          fecha, hora, servicio y el link único para reprogramar o cancelar.
        </p>
      </div>
    </div>
  );
}


/* ===========================
   DEMO: MAGIC LINK Y REPROGRAMACIÓN
   =========================== */

function DemoMagicReschedule() {
  return (
    <div className="space-y-3 text-[11px]">
      {/* Encabezado tipo "página pública especial" */}
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg shadow-black/40"
          style={{ backgroundColor: PRIMARY, color: '#020617' }}
        >
          B
        </div>
        <div>
          <p className="text-[11px] font-semibold">
            Reprogramar tu turno
          </p>
          <p className="text-[10px] text-slate-400">
            Este link se abre desde el mensaje de WhatsApp
          </p>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-3">
        <div className="space-y-1">
          <p className="text-[10px] text-slate-300">
            Turno actual:
          </p>
          <div className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-[10px] text-slate-200 space-y-0.5">
            <p>
              Barbería Centro · Corte clásico
            </p>
            <p>
              Lunes 12/01/2026 · 10:00
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-[10px] text-slate-300">
            Elegí un nuevo horario
          </p>
          <div className="grid grid-cols-3 gap-1.5 text-[10px]">
            <button className="rounded-full py-1 border border-slate-700 bg-slate-950 text-slate-100">
              11:00
            </button>
            <button className="rounded-full py-1 border border-slate-700 bg-slate-950 text-slate-100">
              11:30
            </button>
            <button className="rounded-full py-1 border-slate-100 bg-slate-100 text-slate-900">
              12:00
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <button
            className="w-full rounded-full py-2 text-[11px] font-medium shadow-md shadow-black/40"
            style={{ backgroundColor: PRIMARY, color: '#020617' }}
          >
            Confirmar nueva fecha y hora
          </button>
        </div>

        <div className="space-y-1 pt-2 border-t border-slate-800">
          <p className="text-[10px] text-emerald-300">
            Tu turno fue reprogramado
          </p>
          <p className="text-[10px] text-slate-300">
            Vas a recibir un mensaje de confirmación con el nuevo horario. El
            negocio ve el cambio instantáneamente en su panel.
          </p>
        </div>

        <p className="text-[10px] text-slate-500 pt-1">
          Esta página no necesita que el cliente tenga usuario ni contraseña.
          Cada link es único para un turno específico.
        </p>
      </div>
    </div>
  );
}
