/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  AdminAppointment,
  BrandConfig,
  DEFAULT_BRAND,
  ScheduleDayType,
} from './types';

type WeekRange = {
  from: string; // lunes
  to: string;   // viernes
  days: { date: string; label: string }[];
};

function getWeekRange(baseDate: string): WeekRange {
  const d = new Date(baseDate + 'T00:00:00');
  const day = d.getDay(); // 0 dom, 1 lun, ...
  const diffToMonday = (day + 6) % 7;

  const monday = new Date(d);
  monday.setDate(d.getDate() - diffToMonday);

  const days: { date: string; label: string }[] = [];
  const names = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];

  for (let i = 0; i < 5; i++) {
    const dt = new Date(monday);
    dt.setDate(monday.getDate() + i);
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    days.push({
      date: dateStr,
      label: `${names[i]} ${dd}/${mm}`,
    });
  }

  return {
    from: days[0].date,
    to: days[4].date,
    days,
  };
}

type CalendarMode = 'admin' | 'share';

type CalendarTabProps = {
  brand?: BrandConfig;
};

export default function CalendarTab({ brand }: CalendarTabProps) {
  const theme = brand ?? DEFAULT_BRAND;

  const [baseDate, setBaseDate] = useState('');
  const [week, setWeek] = useState<WeekRange | null>(null);
  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [scheduleDays, setScheduleDays] = useState<ScheduleDayType[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [mode, setMode] = useState<CalendarMode>('admin');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Fecha base = hoy
  useEffect(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setBaseDate(`${yyyy}-${mm}-${dd}`);
  }, []);

  // Cargar semana y turnos cuando cambia baseDate
  useEffect(() => {
    if (!baseDate) return;
    const w = getWeekRange(baseDate);
    setWeek(w);
    loadWeekAppointments(w);
  }, [baseDate]);

  // Cargar configuración de horarios (bloques) una vez
  useEffect(() => {
    loadSchedule();
  }, []);

  async function loadWeekAppointments(w: WeekRange) {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        status: 'confirmed',
        from: w.from,
        to: w.to,
      });

      const res = await fetch(`/api/admin/appointments?${params.toString()}`);
      const json = await res.json();

      if (!res.ok) {
        console.error('Failed to load week appointments', { status: res.status, error: json.error });
        setError('No pudimos cargar los turnos de la semana. Revisá la conexión e intentá de nuevo.');
        setAppointments([]);
      } else {
        setAppointments(json.appointments || []);
      }
    } catch (e) {
      console.error(e);
      setError('No pudimos cargar los turnos de la semana. Revisá la conexión e intentá de nuevo.');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadSchedule() {
    setLoadingSchedule(true);
    setScheduleError(null);
    try {
      const res = await fetch('/api/admin/schedule');
      const json = await res.json();
      if (!res.ok) {
        console.error('Failed to load schedule', { status: res.status, error: json.error });
        setScheduleError('No pudimos cargar tus horarios. Revisá la conexión e intentá de nuevo.');
        setScheduleDays([]);
      } else {
        setScheduleDays(json.days || []);
      }
    } catch (e) {
      console.error(e);
      setScheduleError('No pudimos cargar tus horarios. Revisá la conexión e intentá de nuevo.');
      setScheduleDays([]);
    } finally {
      setLoadingSchedule(false);
    }
  }

 

  return (
    <div className="space-y-6 text-slate-900">
      {/* Filtros / controles */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-slate-700">
            Semana a visualizar
          </label>
          <input
            type="date"
            value={baseDate}
            onChange={(e) => setBaseDate(e.target.value)}
            className="mt-1 min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-normal focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
          {week && (
            <span className="text-sm text-slate-500">
              Semana del {week.from} al {week.to} (lunes a viernes)
            </span>
          )}
          {loadingSchedule && (
            <span className="text-sm text-slate-500">
              Cargando horarios del negocio...
            </span>
          )}
          {scheduleError && (
            <span className="text-sm text-rose-700" role="alert">
              {scheduleError}
              <button type="button" className="ml-2 font-semibold underline" onClick={() => void loadSchedule()}>
                Reintentar
              </button>
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="inline-flex rounded-xl border border-slate-300 bg-white p-1 self-start">
            <button
              type="button"
              onClick={() => setMode('admin')}
                aria-pressed={mode === 'admin'}
                className={`min-h-10 rounded-lg px-3 text-sm font-semibold ${
                mode === 'admin'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Vista de gestión
            </button>
            <button
              type="button"
              onClick={() => setMode('share')}
                aria-pressed={mode === 'share'}
                className={`min-h-10 rounded-lg px-3 text-sm font-semibold ${
                mode === 'share'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Vista para compartir
            </button>
          </div>

          

          {loading && (
            <span className="text-xs text-slate-400">
              Cargando agenda...
            </span>
          )}

          {error && (
            <span className="text-sm text-rose-700" role="alert">
              {error}
              <button type="button" className="ml-2 font-semibold underline" onClick={() => week && void loadWeekAppointments(week)}>Reintentar</button>
            </span>
          )}
        </div>
      </section>

      {week && mode === 'admin' && (
        <WeekCalendar
          week={week}
          appointments={appointments}
          theme={theme}
        />
      )}

      {week && mode === 'share' && !scheduleError && (
        <ShareWeekCalendar
          week={week}
          appointments={appointments}
          scheduleDays={scheduleDays}
          theme={theme}
          onFeedback={setFeedback}
        />
      )}
      {feedback && <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">{feedback}</p>}
    </div>
  );
}

/* ---------- UTILIDADES ---------- */

function timeToMinutes(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/* ---------- VISTA SEMANAL ADMIN (como ahora, pero con theme) ---------- */

type WeekCalendarProps = {
  week: WeekRange;
  appointments: AdminAppointment[];
  theme: BrandConfig;
};

function WeekCalendar({ week, appointments, theme }: WeekCalendarProps) {
  const router = useRouter();

  const HARD_MIN = 8;
  const HARD_MAX = 21;
  const PAD_TOP = 8;
  const PAD_BOTTOM = 14;

  const confirmed = appointments.filter(
    (a) => a.status === 'confirmed'
  );

  let displayStart = HARD_MIN;
  let displayEnd = HARD_MAX;

  if (confirmed.length > 0) {
    const starts = confirmed.map((a) => timeToMinutes(a.startTime));
    const ends = confirmed.map((a) =>
      a.endTime ? timeToMinutes(a.endTime) : timeToMinutes(a.startTime) + 30
    );

    const minH = Math.floor(Math.min(...starts) / 60);
    const maxH = Math.ceil(Math.max(...ends) / 60);

    displayStart = Math.max(HARD_MIN, minH - 1);
    displayEnd = Math.min(HARD_MAX, maxH + 1);
  }

  const TOTAL_MINUTES = (displayEnd - displayStart) * 60;
  const hours = Array.from(
    { length: displayEnd - displayStart + 1 },
    (_, i) => displayStart + i
  );
  const hasAppointments = confirmed.length > 0;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-[-0.02em] text-slate-950">Agenda semanal</h2>
        <span className="text-sm text-slate-500">
          Turnos confirmados · seleccioná uno para ver el detalle
        </span>
      </div>

      <div
        className="grid h-[520px] sm:h-[620px] relative"
        style={{
          gridTemplateColumns: '40px repeat(5, 1fr)',
          gridTemplateRows: 'auto 1fr',
        }}
      >
        {/* Columna horas */}
        <div
          className="relative text-xs text-slate-500 border-r border-slate-200"
          style={{ gridRow: '1 / span 2' }}
        >
          <div
            className="relative w-full h-full"
            style={{ paddingTop: PAD_TOP, paddingBottom: PAD_BOTTOM }}
          >
            {hours.map((h) => {
              const topPct =
                ((h * 60 - displayStart * 60) / TOTAL_MINUTES) * 100;
              return (
                <div
                  key={h}
                  className="absolute left-0 right-0"
                  style={{ top: `calc(${topPct}% + 3px)` }}
                >
                  <span className="block pr-0.5 text-right">
                    {String(h).padStart(2, '0')}:00
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cabeceras días */}
        {week.days.map((day, idx) => (
          <div
            key={day.date}
            className="flex items-center justify-center border-b border-slate-200 bg-white text-center"
            style={{ gridRow: 1, gridColumn: idx + 2 }}
          >
            <span className="text-sm text-slate-700 font-semibold">
              {day.label}
            </span>
          </div>
        ))}

        {/* Agenda por día */}
        {week.days.map((day, idx) => {
          const dayAppointments = confirmed.filter(
            (a) => a.date === day.date
          );

          return (
            <div
              key={day.date + '-body'}
              className="relative border-l border-slate-100"
              style={{ gridRow: 2, gridColumn: idx + 2 }}
            >
              <div
                className="relative w-full h-full"
                style={{ paddingTop: PAD_TOP, paddingBottom: PAD_BOTTOM }}
              >
                {/* líneas por hora */}
                {hours.map((h) => {
                  const topPct =
                    ((h * 60 - displayStart * 60) / TOTAL_MINUTES) * 100;
                  return (
                    <div
                      key={h}
                      className="absolute left-0 right-0 border-t border-slate-200"
                      style={{ top: `${topPct}%` }}
                    />
                  );
                })}

                {/* bloques */}
                {dayAppointments
                  .sort((a, b) =>
                    a.startTime.localeCompare(b.startTime)
                  )
                  .map((a) => {
                    const startMin = timeToMinutes(a.startTime);
                    const endMin = a.endTime
                      ? timeToMinutes(a.endTime)
                      : startMin + 30;

                    const top =
                      ((startMin - displayStart * 60) /
                        TOTAL_MINUTES) *
                      100;
                    const height =
                      ((Math.max(endMin - startMin, 30)) /
                        TOTAL_MINUTES) *
                      100;

                    const color = a.serviceColor || theme.primary;

                    return (
                      <button
                        type="button"
                        key={a.id}
                        onClick={() => router.push(`/dashboard/appointments/${a.id}`)}
                        aria-label={`Ver turno de ${a.clientName}, ${a.startTime}, ${a.serviceName}`}
                        className="absolute left-[8%] right-[8%] min-h-[42px] rounded-lg text-left shadow-sm cursor-pointer px-2 py-1.5 text-xs overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                        style={{
                          top: `${top}%`,
                          height: `${height}%`,
                          minHeight: '30px',
                          backgroundColor: `${color}18`,
                          borderLeft: `3px solid ${color}`,
                        }}
                      >
                        <div className="font-bold leading-tight truncate text-slate-900">
                          {a.startTime}
                        </div>
                        <div className="font-semibold leading-tight truncate text-slate-800">
                          {a.clientName}
                        </div>
                        <div className="text-xs leading-tight text-slate-600 truncate">
                          {a.serviceName}
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          );
        })}

        {!hasAppointments && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-sm text-slate-500">
              No hay turnos confirmados en esta semana.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------- VISTA COMPARTIBLE (sin nombres, con libres/ocupados) ---------- */

type ShareWeekCalendarProps = {
  week: WeekRange;
  appointments: AdminAppointment[];
  scheduleDays: ScheduleDayType[];
  theme: BrandConfig;
  onFeedback: (message: string) => void;
};

type SlotStatus = 'closed' | 'free' | 'busy';

function ShareWeekCalendar({
  week,
  appointments,
  scheduleDays,
  theme,
  onFeedback,
}: ShareWeekCalendarProps) {
  const SLOT_MINUTES = 30;

  const confirmed = appointments.filter(
    (a) => a.status === 'confirmed'
  );

  const weekdayScheduleMap = new Map<number, ScheduleDayType>();
  scheduleDays.forEach((d) => {
    weekdayScheduleMap.set(d.weekday, d);
  });

  let minMinutes: number | null = null;
  let maxMinutes: number | null = null;

  week.days.forEach((day) => {
    const weekday = new Date(day.date + 'T00:00:00').getDay();
    const daySchedule = weekdayScheduleMap.get(weekday);
    if (!daySchedule || daySchedule.blocks.length === 0) return;

    daySchedule.blocks.forEach((b) => {
      if (!b.start || !b.end) return;
      const start = timeToMinutes(b.start);
      const end = timeToMinutes(b.end);
      if (minMinutes === null || start < minMinutes) minMinutes = start;
      if (maxMinutes === null || end > maxMinutes) maxMinutes = end;
    });
  });

  if (minMinutes === null || maxMinutes === null) {
    minMinutes = 8 * 60;
    maxMinutes = 20 * 60;
  }

  const rows: string[] = [];
  for (let m = minMinutes; m < maxMinutes; m += SLOT_MINUTES) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    rows.push(`${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`);
  }

  function getSlotStatus(date: string, time: string): SlotStatus {
    const weekday = new Date(date + 'T00:00:00').getDay();
    const daySchedule = weekdayScheduleMap.get(weekday);

    const slotStart = timeToMinutes(time);
    const slotEnd = slotStart + SLOT_MINUTES;

    if (!daySchedule || daySchedule.blocks.length === 0) {
      return 'closed';
    }

    const inOpenBlock = daySchedule.blocks.some((b) => {
      if (!b.start || !b.end) return false;
      const bStart = timeToMinutes(b.start);
      const bEnd = timeToMinutes(b.end);
      return slotStart >= bStart && slotEnd <= bEnd;
    });

    if (!inOpenBlock) return 'closed';

    const hasAppt = confirmed.some((a) => {
      if (a.date !== date) return false;
      const aStart = timeToMinutes(a.startTime);
      const aEnd = a.endTime
        ? timeToMinutes(a.endTime)
        : aStart + 30;
      return slotStart < aEnd && slotEnd > aStart;
    });

    return hasAppt ? 'busy' : 'free';
  }

  // helper: crea el canvas con la agenda, lo usan export y share
  function createAgendaCanvas(): HTMLCanvasElement {
    const width = 1080;
    const height = 1350;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo crear el contexto 2D');

    // colores del theme
    const primary = theme.primary || '#3b82f6';
    const secondary = theme.secondary || '#22c55e';
    

    // fondo
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, width, height);

    const marginX = 80;
    const marginTop = 130;
    const headerHeight = 80;
    const footerHeight = 80;

    const gridTop = marginTop + headerHeight;
    const gridBottom = height - footerHeight;
    const gridHeight = gridBottom - gridTop;

    const colCount = 5;
    const colWidth = (width - marginX * 2) / (colCount + 0.5);
    const timeColWidth = colWidth * 0.5;

    const rowCount = rows.length;
    const rowHeight = gridHeight / rowCount;

    // título
    ctx.fillStyle = '#e5e7eb';
    ctx.font = 'bold 40px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Agenda semanal', width / 2, 60);

    ctx.font = '24px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#9ca3af';
    const rangeLabel = `${week.days[0].label} - ${
      week.days[week.days.length - 1].label
    }`;
    ctx.fillText(rangeLabel, width / 2, 100);

    // leyenda
    const legendY = marginTop + 20;
    ctx.textAlign = 'left';
    ctx.font = '20px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

    // ocupado (primary)
    ctx.fillStyle = primary;
    ctx.fillRect(marginX, legendY - 14, 24, 24);
    ctx.fillStyle = '#e5e7eb';
    ctx.fillText('Ocupado', marginX + 34, legendY + 4);

    // disponible (secondary)
    const legend2X = marginX + 220;
    ctx.strokeStyle = secondary;
    ctx.lineWidth = 2;
    ctx.strokeRect(legend2X, legendY - 14, 24, 24);
    ctx.fillStyle = '#e5e7eb';
    ctx.fillText('Disponible', legend2X + 34, legendY + 4);

    // cerrado
    const legend3X = marginX + 440;
    ctx.fillStyle = '#020617';
    ctx.fillRect(legend3X, legendY - 14, 24, 24);
    ctx.strokeStyle = '#4b5563';
    ctx.strokeRect(legend3X, legendY - 14, 24, 24);
    ctx.fillStyle = '#e5e7eb';
    ctx.fillText('Cerrado', legend3X + 34, legendY + 4);

    // cabecera días
    ctx.textAlign = 'center';
    ctx.font = '22px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

    week.days.forEach((day, index) => {
      const x =
        marginX +
        timeColWidth +
        colWidth * index +
        colWidth / 2;
      ctx.fillStyle = '#e5e7eb';
      ctx.fillText(day.label, x, gridTop - 20);
    });

    // horas
    ctx.textAlign = 'right';
    ctx.font = '18px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    rows.forEach((time, rowIndex) => {
      const y = gridTop + rowHeight * rowIndex + rowHeight * 0.65;
      ctx.fillStyle = '#9ca3af';
      ctx.fillText(
        time,
        marginX + timeColWidth - 10,
        y
      );
    });

    // líneas grilla
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#1f2933';

    rows.forEach((_, rowIndex) => {
      const y = gridTop + rowHeight * rowIndex;
      ctx.beginPath();
      ctx.moveTo(marginX + timeColWidth, y);
      ctx.lineTo(
        marginX + timeColWidth + colWidth * colCount,
        y
      );
      ctx.stroke();
    });

    for (let c = 0; c <= colCount; c++) {
      const x = marginX + timeColWidth + colWidth * c;
      ctx.beginPath();
      ctx.moveTo(x, gridTop);
      ctx.lineTo(x, gridBottom);
      ctx.stroke();
    }

    // celdas
    rows.forEach((time, rowIndex) => {
      const y = gridTop + rowHeight * rowIndex;

      week.days.forEach((day, colIndex) => {
        const status = getSlotStatus(day.date, time);
        const x = marginX + timeColWidth + colWidth * colIndex;

        if (status === 'closed') {
          // nada, queda el fondo
        } else if (status === 'free') {
          ctx.strokeStyle = secondary;
          ctx.lineWidth = 1.5;
          ctx.strokeRect(
            x + 4,
            y + 4,
            colWidth - 8,
            rowHeight - 8
          );
        } else if (status === 'busy') {
          ctx.fillStyle = primary;
          ctx.fillRect(
            x + 4,
            y + 4,
            colWidth - 8,
            rowHeight - 8
          );
        }
      });
    });

    // footer
    ctx.textAlign = 'center';
    ctx.font = '18px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#6b7280';
    ctx.fillText(
      'Agenda generada con tu sistema de turnos',
      width / 2,
      height - 35
    );

    return canvas;
  }

  async function handleExportImage() {
    try {
      const canvas = createAgendaCanvas();
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = 'agenda-semanal.png';
      a.click();
    } catch (e) {
      console.error(e);
      onFeedback('No se pudo generar la imagen.');
    }
  }

  async function handleShareImage() {
    try {
      const canvas = createAgendaCanvas();
      const dataUrl = canvas.toDataURL('image/png');

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], 'agenda-semanal.png', {
        type: 'image/png',
      });

      const navAny = navigator as any;

      if (navAny.canShare && navAny.canShare({ files: [file] })) {
        await navAny.share({
          files: [file],
          text: 'Mis horarios de esta semana ',
        });
      } else {
        // fallback: descarga
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = 'agenda-semanal.png';
        a.click();
          onFeedback('Tu navegador no permite compartir directamente la imagen. Se descargó la imagen para compartirla manualmente.');
      }
    } catch (e) {
      console.error(e);
      onFeedback('No se pudo compartir la imagen.');
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
            <h2 className="text-xl font-semibold tracking-[-0.02em] text-slate-950">
            Agenda semanal para compartir
          </h2>
          <p className="text-sm text-slate-500">
             Consultá los horarios libres y ocupados sin mostrar nombres.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleShareImage}
            className="min-h-11 rounded-full px-4 text-sm font-semibold shadow-sm"
            style={{
              backgroundColor: theme.primary,
              color: theme.textOnPrimary || '#020617',
              boxShadow: `0 0 10px ${theme.primary}40`,
            }}
          >
            Compartir
          </button>
          <button
            type="button"
            onClick={handleExportImage}
            className="min-h-11 rounded-full border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Descargar PNG
          </button>
        </div>
      </div>

      {/* Preview HTML (para que el usuario vea lo que se va a compartir) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/95 p-3">
        <div className="flex flex-wrap items-center justify-center gap-4 mb-3 text-sm text-slate-600">
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-3 rounded-[4px]"
              style={{ backgroundColor: theme.primary }}
            />
            <span>Ocupado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-3 rounded-[4px] border"
              style={{ borderColor: theme.secondary || theme.primary }}
            />
            <span>Disponible</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-[4px] bg-slate-900" />
            <span>Cerrado</span>
          </div>
        </div>

        <div className="grid text-[10px]">
          <div
            className="grid"
            style={{
              gridTemplateColumns: '40px repeat(5, minmax(0, 1fr))',
            }}
          >
            <div />
            {week.days.map((day) => (
              <div
                key={day.date}
                className="px-1 pb-1 text-center text-slate-200 font-medium"
              >
                {day.label}
              </div>
            ))}
          </div>

          <div
            className="grid"
            style={{
              gridTemplateColumns: '40px repeat(5, minmax(0, 1fr))',
            }}
          >
            {rows.map((time) => (
              <>
                <div
                  key={`h-${time}`}
                  className="py-1 pr-1 text-right text-slate-400"
                >
                  {time}
                </div>

                {week.days.map((day) => {
                  const status = getSlotStatus(day.date, time);

                  const style: React.CSSProperties = {};
                  let extra = '';

                  if (status === 'closed') {
                    style.backgroundColor = '#020617';
                    extra = 'border-slate-900';
                  } else if (status === 'free') {
                    style.borderColor = theme.secondary || theme.primary;
                    extra = 'border';
                  } else if (status === 'busy') {
                    style.backgroundColor = theme.primary;
                    style.borderColor = theme.primary;
                    extra = 'border';
                  }

                  return (
                    <div
                      key={`${day.date}-${time}`}
                      className="p-0.5"
                    >
                      <div
                        className={`h-6 rounded-[4px] flex items-center justify-center ${extra}`}
                        style={style}
                      />
                    </div>
                  );
                })}
              </>
            ))}
          </div>
        </div>

        <p className="mt-3 text-sm text-slate-500 text-center">
          Compartí este esquema en tus historias para mostrar tus horarios libres.
        </p>
      </div>
    </section>
  );
}


