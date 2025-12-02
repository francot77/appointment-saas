// app/HeroPreviews.tsx
'use client';

import { useState } from 'react';

type Props = {
  primaryColor: string;
};

type PreviewTab = 'panel' | 'calendar' | 'public';

export default function HeroPreviews({ primaryColor }: Props) {
  const [tab, setTab] = useState<PreviewTab>('panel');

  return (
    <div className="relative">
      {/* Tabs */}
      <div className="inline-flex text-[11px] bg-slate-900/80 border border-slate-800 rounded-full p-1 mb-3">
        <button
          type="button"
          onClick={() => setTab('panel')}
          className={`px-3 py-1 rounded-full ${
            tab === 'panel'
              ? 'bg-slate-100 text-slate-900'
              : 'text-slate-300'
          }`}
        >
          Panel de turnos
        </button>
        <button
          type="button"
          onClick={() => setTab('calendar')}
          className={`px-3 py-1 rounded-full ${
            tab === 'calendar'
              ? 'bg-slate-100 text-slate-900'
              : 'text-slate-300'
          }`}
        >
          Calendario
        </button>
        <button
          type="button"
          onClick={() => setTab('public')}
          className={`px-3 py-1 rounded-full ${
            tab === 'public'
              ? 'bg-slate-100 text-slate-900'
              : 'text-slate-300'
          }`}
        >
          Página de reservas
        </button>
      </div>

      {/* Card preview */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3 shadow-2xl shadow-black/60">
        {tab === 'panel' && <PanelPreview primaryColor={primaryColor} />}
        {tab === 'calendar' && <CalendarPreview primaryColor={primaryColor} />}
        {tab === 'public' && <PublicPreview primaryColor={primaryColor} />}
      </div>
    </div>
  );
}

function StatusPill({
  label,
  variant,
}: {
  label: string;
  variant: 'request' | 'confirmed' | 'cancelled';
}) {
  const classes =
    variant === 'request'
      ? 'bg-amber-500/20 text-amber-300'
      : variant === 'confirmed'
      ? 'bg-emerald-500/20 text-emerald-300'
      : 'bg-red-500/20 text-red-300';

  return (
    <span
      className={`text-[9px] px-2 py-0.5 rounded-full ${classes}`}
    >
      {label}
    </span>
  );
}

function PanelPreview({ primaryColor }: { primaryColor: string }) {
  return (
    <div className="space-y-2">
      {/* mini header */}
      <div className="flex items-center justify-between text-[11px] mb-1">
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold"
            style={{ backgroundColor: primaryColor, color: '#020617' }}
          >
            B
          </div>
          <span className="font-semibold">Barbería Centro</span>
        </div>
        <span className="text-slate-400">Hoy · Vista día</span>
      </div>

      {/* filtros fake */}
      <div className="flex flex-wrap gap-2 text-[10px] mb-1">
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

      {/* lista de turnos fake */}
      <div className="space-y-1.5 text-[11px]">
        {[
          {
            time: '10:00',
            name: 'Lucas',
            service: 'Corte clásico',
            status: 'request' as const,
          },
          {
            time: '11:00',
            name: 'Martín',
            service: 'Corte + barba',
            status: 'confirmed' as const,
          },
          {
            time: '12:00',
            name: 'Santiago',
            service: 'Afeitado prolijo',
            status: 'confirmed' as const,
          },
        ].map((a, idx) => (
          <div
            key={idx}
            className="flex items-start justify-between bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="text-[11px] font-semibold"
                  style={{ color: primaryColor }}
                >
                  {a.time}
                </span>
                <span className="text-[11px]">{a.name}</span>
                <StatusPill
                  label={
                    a.status === 'request'
                      ? 'Pendiente'
                      : a.status === 'confirmed'
                      ? 'Confirmado'
                      : 'Cancelado'
                  }
                  variant={a.status}
                />
              </div>
              <p className="text-[10px] text-slate-400 truncate max-w-[180px]">
                {a.service}
              </p>
            </div>
            <div className="flex gap-1 ml-2">
              {a.status === 'request' && (
                <>
                  <div className="px-2 py-0.5 rounded-md text-[10px] bg-slate-100 text-slate-900">
                    Confirmar
                  </div>
                  <div className="px-2 py-0.5 rounded-md text-[10px] border border-slate-700 text-slate-200">
                    Rechazar
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CalendarPreview({ primaryColor }: { primaryColor: string }) {
  const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const selectedDay = 'Jue';

  return (
    <div className="space-y-2 text-[11px]">
      {/* header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold"
            style={{ backgroundColor: primaryColor, color: '#020617' }}
          >
            B
          </div>
          <span className="font-semibold">Barbería Centro</span>
        </div>
        <span className="text-slate-400">Agenda semanal</span>
      </div>

      {/* semana */}
      <div className="flex justify-between gap-1 mb-2">
        {days.map((d) => {
          const isSelected = d === selectedDay;
          return (
            <div
              key={d}
              className={`flex-1 text-center py-1 rounded-md border text-[10px] ${
                isSelected
                  ? 'bg-slate-100 text-slate-900 border-slate-100'
                  : 'bg-slate-900 text-slate-300 border-slate-700'
              }`}
            >
              {d}
            </div>
          );
        })}
      </div>

      {/* grid de horas x días (mini) */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-2">
        <div className="grid grid-cols-[auto,1fr,1fr,1fr] gap-1 text-[9px] text-slate-400 mb-1">
          <span />
          <span>Jue</span>
          <span>Vie</span>
          <span>Sáb</span>
        </div>

        <div className="space-y-1">
          {['10:00', '11:00', '12:00', '13:00'].map((hour) => (
            <div
              key={hour}
              className="grid grid-cols-[auto,1fr,1fr,1fr] gap-1 items-center"
            >
              <span className="text-[9px] text-slate-500">{hour}</span>

              {/* JUEVES */}
              <div
                className={`h-4 rounded-sm ${
                  hour === '10:00' || hour === '12:00'
                    ? 'bg-emerald-500/30 border border-emerald-500/70'
                    : 'bg-slate-900 border border-slate-800'
                }`}
              />

              {/* VIERNES */}
              <div
                className={`h-4 rounded-sm ${
                  hour === '11:00'
                    ? 'bg-emerald-500/30 border border-emerald-500/70'
                    : 'bg-slate-900 border border-slate-800'
                }`}
              />

              {/* SÁBADO */}
              <div className="h-4 rounded-sm bg-slate-900 border border-slate-800" />
            </div>
          ))}
        </div>

        <p className="text-[9px] text-slate-500 mt-2">
          Bloques en verde: turnos confirmados. Los espacios vacíos son
          horarios libres para nuevos turnos.
        </p>
      </div>
    </div>
  );
}

function PublicPreview({ primaryColor }: { primaryColor: string }) {
  return (
    <div className="space-y-3 text-[11px]">
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg shadow-black/40"
          style={{ backgroundColor: primaryColor, color: '#020617' }}
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

      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-2">
        <p className="text-[11px] font-semibold">
          Reservar un turno
        </p>
        <p className="text-[10px] text-slate-400">
          Elegís servicio, fecha y horario. Después completás tus datos.
        </p>

        <div className="space-y-1.5">
          <label className="text-[10px] text-slate-300">
            Servicio
          </label>
          <div className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 flex items-center justify-between">
            <span className="text-[10px] text-slate-300">
              Corte clásico · 30 min
            </span>
            <span className="text-[10px] text-slate-500">$</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] text-slate-300">
            Fecha
          </label>
          <div className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-400">
            2026-01-12
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] text-slate-300">
            Horario
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {['10:00', '10:30', '11:00'].map((t, idx) => (
              <button
                key={t}
                className={`rounded-full py-1 border text-center ${
                  idx === 0
                    ? 'border-slate-100 bg-slate-100 text-slate-900'
                    : 'border-slate-700 bg-slate-950 text-slate-100'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-1">
          <button
            className="w-full rounded-full py-1.5 text-[11px] font-medium shadow-md shadow-black/40"
            style={{ backgroundColor: primaryColor, color: '#020617' }}
          >
            Pedir turno
          </button>
        </div>
      </div>
    </div>
  );
}
