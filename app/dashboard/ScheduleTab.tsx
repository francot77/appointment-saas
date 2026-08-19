import { useEffect, useState } from 'react';
import { ScheduleDayType, BrandConfig, DEFAULT_BRAND, ScheduleBlock } from './types';

type EditableBlock = ScheduleBlock & { enabled?: boolean };

const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function weekdayLabel(weekday: number) {
  return WEEKDAYS[weekday] || `Día ${weekday}`;
}

function blockMinutes(value: string) {
  if (!/^\d{2}:\d{2}$/.test(value)) return null;
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function dayValidation(day: ScheduleDayType) {
  const blocks = day.blocks as EditableBlock[];
  const active = blocks.filter((block) => block.enabled !== false);

  for (const block of blocks) {
    if (!block.start || !block.end) return 'Completá las dos horas de cada bloque o eliminá el bloque vacío.';
    const start = blockMinutes(block.start);
    const end = blockMinutes(block.end);
    if (start === null || end === null) return 'Usá horarios válidos entre 00:00 y 23:59.';
    if (start >= end) return 'La hora de inicio debe ser anterior a la hora de fin.';
  }

  const sorted = [...active].sort((a, b) => (blockMinutes(a.start) || 0) - (blockMinutes(b.start) || 0));
  for (let index = 1; index < sorted.length; index += 1) {
    if ((blockMinutes(sorted[index].start) || 0) < (blockMinutes(sorted[index - 1].end) || 0)) {
      return 'Los bloques activos no pueden superponerse. Usá bloques separados para marcar una pausa.';
    }
  }
  return null;
}

function cloneBlocks(blocks: ScheduleBlock[]) {
  return blocks.map((block) => ({ ...block, enabled: (block as EditableBlock).enabled !== false }));
}

export default function ScheduleTab({ brand }: { brand?: BrandConfig }) {
  const theme = brand ?? DEFAULT_BRAND;
  const [scheduleDays, setScheduleDays] = useState<ScheduleDayType[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [errorSchedule, setErrorSchedule] = useState<string | null>(null);
  const [savingWeekdays, setSavingWeekdays] = useState<Set<number>>(new Set());
  const [savedWeekday, setSavedWeekday] = useState<number | null>(null);
  const [copySource, setCopySource] = useState<number | null>(null);
  const [copyTargets, setCopyTargets] = useState<number[]>([]);
  const [copyConfirmation, setCopyConfirmation] = useState<{ source: number; targets: number[] } | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  useEffect(() => {
    void loadSchedule();
  }, []);

  async function loadSchedule() {
    setLoadingSchedule(true);
    setErrorSchedule(null);
    try {
      const response = await fetch('/api/admin/schedule');
      const json = await response.json();
      if (!response.ok) {
        console.error('GET /api/admin/schedule failed', { status: response.status, code: json.code, error: json.error });
        setErrorSchedule('No pudimos cargar tus horarios. Revisá la conexión e intentá de nuevo.');
        setScheduleDays([]);
      } else {
        setScheduleDays(json.days || []);
      }
    } catch (error) {
      console.error(error);
      setErrorSchedule('No pudimos cargar tus horarios. Revisá la conexión e intentá de nuevo.');
      setScheduleDays([]);
    } finally {
      setLoadingSchedule(false);
    }
  }

  function updateBlockField(weekday: number, index: number, field: 'start' | 'end', value: string) {
    setSavedWeekday(null);
    setScheduleDays((current) => current.map((day) => day.weekday !== weekday ? day : {
      ...day,
      blocks: day.blocks.map((block, blockIndex) => blockIndex === index ? { ...block, [field]: value } : block),
    }));
  }

  function toggleBlock(weekday: number, index: number) {
    setSavedWeekday(null);
    setScheduleDays((current) => current.map((day) => day.weekday !== weekday ? day : {
      ...day,
      blocks: day.blocks.map((block, blockIndex) => blockIndex === index ? { ...block, enabled: (block as EditableBlock).enabled === false } : block),
    }));
  }

  function addBlock(weekday: number) {
    setSavedWeekday(null);
    setScheduleDays((current) => current.map((day) => day.weekday === weekday ? {
      ...day,
      blocks: [...day.blocks, { start: '', end: '', enabled: true }],
    } : day));
  }

  function deleteBlock(weekday: number, index: number) {
    setSavedWeekday(null);
    setScheduleDays((current) => current.map((day) => day.weekday === weekday ? {
      ...day,
      blocks: day.blocks.filter((_, blockIndex) => blockIndex !== index),
    } : day));
  }

  async function saveDay(day: ScheduleDayType) {
    const validationError = dayValidation(day);
    if (validationError) {
      setErrorSchedule(`${weekdayLabel(day.weekday)}: ${validationError}`);
      return;
    }
    setSavingWeekdays((current) => new Set(current).add(day.weekday));
    setSavedWeekday(null);
    setErrorSchedule(null);
    try {
      const response = await fetch('/api/admin/schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekday: day.weekday, blocks: day.blocks }),
      });
      const data = await response.json();
      if (!response.ok) {
        console.error('PUT /api/admin/schedule failed', { status: response.status, code: data.code, error: data.error });
        setErrorSchedule('No pudimos guardar este día. Revisá los horarios e intentá de nuevo.');
        return;
      }
      setScheduleDays((current) => current.map((item) => item.weekday === day.weekday ? data : item));
      setSavedWeekday(day.weekday);
    } catch (error) {
      console.error(error);
      setErrorSchedule('No pudimos guardar este día. Revisá la conexión e intentá de nuevo.');
    } finally {
      setSavingWeekdays((current) => {
        const next = new Set(current);
        next.delete(day.weekday);
        return next;
      });
    }
  }

  function startCopy(day: ScheduleDayType) {
    setCopySource(day.weekday);
    setCopyTargets([]);
    setCopyConfirmation(null);
    setCopyMessage(null);
  }

  function requestCopy() {
    if (copySource === null || copyTargets.length === 0) return;
    const occupiedTargets = copyTargets.filter((weekday) => (scheduleDays.find((day) => day.weekday === weekday)?.blocks.length || 0) > 0);
    if (occupiedTargets.length > 0) {
      setCopyConfirmation({ source: copySource, targets: copyTargets });
      return;
    }
    applyCopy(copySource, copyTargets);
  }

  function applyCopy(source: number, targets: number[]) {
    if (savingWeekdays.has(source) || targets.some((weekday) => savingWeekdays.has(weekday))) return;
    const sourceDay = scheduleDays.find((day) => day.weekday === source);
    if (!sourceDay) return;
    setScheduleDays((current) => current.map((day) => targets.includes(day.weekday) ? { ...day, blocks: cloneBlocks(sourceDay.blocks) } : day));
    setSavedWeekday(null);
    setCopySource(null);
    setCopyConfirmation(null);
    setCopyMessage(`Horarios copiados a ${targets.map(weekdayLabel).join(', ')}. Guardá cada día para publicarlos.`);
  }

  if (loadingSchedule) {
    return <section className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm" aria-live="polite">Cargando tu semana...</section>;
  }

  if (errorSchedule && scheduleDays.length === 0) {
    return <section className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm" role="alert"><p className="text-base font-semibold text-slate-950">No pudimos mostrar tus horarios</p><p className="mt-1 text-sm text-red-700">{errorSchedule}</p><button type="button" onClick={() => void loadSchedule()} className="mt-4 min-h-11 rounded-full border border-slate-300 px-4 text-sm font-semibold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">Reintentar</button></section>;
  }

  return (
    <section className="space-y-5" aria-labelledby="schedule-title">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div><p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Disponibilidad</p><h2 id="schedule-title" className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Organizá tu semana</h2><p className="mt-2 max-w-2xl text-[15px] leading-6 text-slate-600">Definí cuándo atendés. Un bloque es un período de trabajo; para una pausa o almuerzo, separá la mañana y la tarde en dos bloques.</p></div>
          <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600 sm:max-w-xs"><p className="font-semibold text-slate-900">Cómo se generan los turnos</p><p className="mt-1">FezTime busca espacios dentro de tus bloques según la duración de cada servicio. Los bloques desactivados no generan disponibilidad.</p></div>
        </div>
      </header>

      {errorSchedule && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{errorSchedule}</p>}
      {copyMessage && <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800" role="status">{copyMessage}</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        {scheduleDays.map((day) => {
          const blocks = day.blocks as EditableBlock[];
          const activeBlocks = blocks.filter((block) => block.enabled !== false);
          const validationError = dayValidation(day);
          const isSaving = savingWeekdays.has(day.weekday);
          const isCopying = copySource === day.weekday;
          return <article key={day.weekday} aria-busy={isSaving} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-start justify-between gap-3"><div><h3 className="text-lg font-semibold text-slate-950">{weekdayLabel(day.weekday)}</h3><p className="mt-1 text-sm text-slate-500">{activeBlocks.length ? `${activeBlocks.length} período${activeBlocks.length === 1 ? '' : 's'} de atención` : 'Sin atención programada'}</p></div><span className={`rounded-full px-3 py-1 text-sm font-semibold ${activeBlocks.length ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{activeBlocks.length ? 'Abierto' : 'Cerrado'}</span></div>
            <div className="mt-4 space-y-3">
              {blocks.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-[15px] text-slate-600">Día cerrado. Agregá un período si vas a atender.</p>}
              {blocks.map((block, index) => <div key={`${day.weekday}-${index}`} className={`rounded-xl border p-3 ${block.enabled === false ? 'border-slate-200 bg-slate-50 opacity-75' : 'border-slate-200 bg-white'}`}>
                <div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-slate-700">{block.enabled === false ? 'Período desactivado' : `Período ${index + 1}`}</p><button type="button" onClick={() => deleteBlock(day.weekday, index)} disabled={isSaving} aria-label={`Eliminar período ${index + 1} de ${weekdayLabel(day.weekday)}`} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-2xl leading-none text-slate-500 hover:bg-red-50 hover:text-red-700 disabled:cursor-wait disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">×</button></div>
                <div className="mt-2 grid gap-3 sm:grid-cols-2"><label className="text-sm font-semibold text-slate-700">Desde<input type="time" value={block.start} onChange={(event) => updateBlockField(day.weekday, index, 'start', event.target.value)} disabled={isSaving} aria-label={`Inicio del período ${index + 1} de ${weekdayLabel(day.weekday)}`} className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" /></label><label className="text-sm font-semibold text-slate-700">Hasta<input type="time" value={block.end} onChange={(event) => updateBlockField(day.weekday, index, 'end', event.target.value)} disabled={isSaving} aria-label={`Fin del período ${index + 1} de ${weekdayLabel(day.weekday)}`} className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" /></label></div>
                <button type="button" onClick={() => toggleBlock(day.weekday, index)} disabled={isSaving} className="mt-3 min-h-11 text-sm font-semibold text-slate-600 underline decoration-slate-300 underline-offset-4 disabled:cursor-wait disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">{block.enabled === false ? 'Activar período' : 'Desactivar período'}</button>
              </div>)}
            </div>
            {validationError && <p className="mt-3 text-sm text-red-700" role="status">{validationError}</p>}
            <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => addBlock(day.weekday)} disabled={isSaving} className="min-h-11 rounded-full border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:border-slate-400 disabled:cursor-wait disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">Agregar período</button><button type="button" onClick={() => startCopy(day)} disabled={isSaving} className="min-h-11 rounded-full border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:border-slate-400 disabled:cursor-wait disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">Copiar este día</button><button type="button" onClick={() => void saveDay(day)} disabled={isSaving} style={{ backgroundColor: theme.primary, color: theme.textOnPrimary }} className="min-h-11 rounded-full px-4 text-sm font-semibold shadow-sm disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">{isSaving ? 'Guardando...' : savedWeekday === day.weekday ? 'Guardado' : 'Guardar día'}</button></div>
            {isCopying && <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50 p-4"><p className="text-sm font-semibold text-slate-900">Elegí los días destino</p><div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">{scheduleDays.filter((target) => target.weekday !== day.weekday).map((target) => <label key={target.weekday} className="flex min-h-11 items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={copyTargets.includes(target.weekday)} disabled={isSaving || savingWeekdays.has(target.weekday)} onChange={() => setCopyTargets((current) => current.includes(target.weekday) ? current.filter((item) => item !== target.weekday) : [...current, target.weekday])} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />{weekdayLabel(target.weekday)}</label>)}</div><p className="mt-2 text-sm text-slate-600">Esto solo prepara los días en pantalla. Después guardá cada uno.</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={requestCopy} disabled={isSaving || !copyTargets.length || copyTargets.some((weekday) => savingWeekdays.has(weekday))} className="min-h-11 rounded-full bg-slate-950 px-4 text-sm font-semibold text-white disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">Copiar horarios</button><button type="button" onClick={() => setCopySource(null)} disabled={isSaving} className="min-h-11 rounded-full px-3 text-sm font-semibold text-slate-600 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">Cancelar</button></div>{copyConfirmation?.source === day.weekday && <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-slate-900" role="alert"><p>Algunos días ya tienen horarios. ¿Querés reemplazarlos?</p><button type="button" onClick={() => applyCopy(day.weekday, copyConfirmation.targets)} disabled={isSaving || copyConfirmation.targets.some((weekday) => savingWeekdays.has(weekday))} className="mt-2 min-h-11 rounded-full bg-amber-700 px-4 font-semibold text-white disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700">Confirmar reemplazo</button></div>}</div>}
          </article>;
        })}
      </div>
       <p className="text-sm text-slate-500">Todavía no podés definir feriados ni cierres para fechas puntuales. Por ahora, la disponibilidad se configura por día de la semana.</p>
    </section>
  );
}
