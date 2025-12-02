'use client';

import { useState } from 'react';


type DemoSlide = {
  id: string;
  label: string;
  badge: string;
  primaryColor: string;
  items: {
    time: string;
    name: string;
    service: string;
  }[];
};

const SLIDES: DemoSlide[] = [
  {
    id: 'nails',
    label: 'Estudio de uñas',
    badge: 'Uñas / Estética',
    primaryColor: '#e879f9',
    items: [
      { time: '10:00', name: 'Lucía', service: 'Semipermanente manos' },
      { time: '11:30', name: 'Carla', service: 'Manos y pies' },
      { time: '15:00', name: 'Mariana', service: 'Capping + diseño' },
    ],
  },
  {
    id: 'hair',
    label: 'Peluquería',
    badge: 'Cortes / Color',
    primaryColor: '#4ade80',
    items: [
      { time: '09:30', name: 'Sofía', service: 'Corte y brushing' },
      { time: '11:00', name: 'Valentina', service: 'Color raíz' },
      { time: '17:00', name: 'Ana', service: 'Reflejos + corte' },
    ],
  },
  {
    id: 'barber',
    label: 'Barbería',
    badge: 'Barba / Fade',
    primaryColor: '#f97316',
    items: [
      { time: '10:15', name: 'Martín', service: 'Fade + barba' },
      { time: '13:00', name: 'Julián', service: 'Corte clásico' },
      { time: '19:00', name: 'Bruno', service: 'Perfilado de barba' },
    ],
  },
];

export function HeroDemoCarousel() {
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];

  const prev = () =>
    setIndex((i) => (i === 0 ? SLIDES.length - 1 : i - 1));
  const next = () =>
    setIndex((i) => (i === SLIDES.length - 1 ? 0 : i + 1));

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 shadow-2xl shadow-black/50 space-y-3">
      <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">Panel de turnos</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-200">
            {slide.badge}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={prev}
            className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-900 border border-slate-700 hover:bg-slate-800"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={next}
            className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-900 border border-slate-700 hover:bg-slate-800"
          >
            ›
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400">
        <span>{slide.label}</span>
        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-200">
          Hoy
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-[10px]">
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-2 space-y-1">
          <p className="text-slate-400">Pendientes</p>
          <p
            className="text-2xl font-bold"
            style={{ color: slide.primaryColor }}
          >
            3
          </p>
          <p className="text-[10px] text-slate-500">
            Turnos para revisar y confirmar.
          </p>
        </div>
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-2 space-y-1">
          <p className="text-slate-400">Confirmados</p>
          <p className="text-2xl font-bold text-emerald-400">7</p>
          <p className="text-[10px] text-slate-500">
            Agendados y avisados por WhatsApp.
          </p>
        </div>
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-2 space-y-1">
          <p className="text-slate-400">Hoy / Mañana</p>
          <p className="text-2xl font-bold text-slate-100">10</p>
          <p className="text-[10px] text-slate-500">
            Vista rápida de los próximos turnos.
          </p>
        </div>
      </div>

      <div className="space-y-1">
        {slide.items.map((t) => (
          <div
            key={t.time + t.name}
            className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-[11px]"
          >
            <div className="flex flex-col">
              <span className="font-medium flex items-center gap-1">
                <span style={{ color: slide.primaryColor }}>{t.time}</span>·{' '}
                {t.name}
              </span>
              <span className="text-[10px] text-slate-400 truncate max-w-[180px]">
                {t.service}
              </span>
            </div>
            <button className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/40">
              Confirmar y WhatsApp
            </button>
          </div>
        ))}
      </div>

      {/* dots */}
      <div className="flex justify-center gap-1 pt-1">
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setIndex(i)}
            className={`w-1.5 h-1.5 rounded-full ${
              i === index ? 'bg-slate-100' : 'bg-slate-600'
            }`}
            aria-label={`Ver ejemplo: ${s.label}`}
          />
        ))}
      </div>
    </div>
  );
}
