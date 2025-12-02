import { useEffect, useState } from 'react';
import { PINK, ScheduleDayType } from './types';

function weekdayLabel(w: number) {
  const names = [
    'Domingo',
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
  ];
  return names[w] || `Día ${w}`;
}

export default function ScheduleTab() {
  const [scheduleDays, setScheduleDays] = useState<ScheduleDayType[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [errorSchedule, setErrorSchedule] = useState<string | null>(null);
  const [savingWeekday, setSavingWeekday] = useState<number | null>(null);

  useEffect(() => {
    loadSchedule();
  }, []);

  async function loadSchedule() {
    setLoadingSchedule(true);
    setErrorSchedule(null);

    try {
      const res = await fetch('/api/admin/schedule');
      const json = await res.json();

      if (!res.ok) {
        setErrorSchedule(json.error || 'Error cargando horarios');
        setScheduleDays([]);
      } else {
        setScheduleDays(json.days || []);
      }
    } catch (e) {
      console.error(e);
      setErrorSchedule('Error cargando horarios');
      setScheduleDays([]);
    } finally {
      setLoadingSchedule(false);
    }
  }

  function updateBlockField(
    weekday: number,
    index: number,
    field: 'start' | 'end',
    value: string
  ) {
    setScheduleDays((prev) =>
      prev.map((day) => {
        if (day.weekday !== weekday) return day;
        const blocks = day.blocks.map((b, i) =>
          i === index ? { ...b, [field]: value } : b
        );
        return { ...day, blocks };
      })
    );
  }

  function addBlock(weekday: number) {
    setScheduleDays((prev) =>
      prev.map((day) =>
        day.weekday === weekday
          ? {
              ...day,
              blocks: [...day.blocks, { start: '', end: '' }],
            }
          : day
      )
    );
  }

  function deleteBlock(weekday: number, index: number) {
    setScheduleDays((prev) =>
      prev.map((day) =>
        day.weekday === weekday
          ? {
              ...day,
              blocks: day.blocks.filter((_, i) => i !== index),
            }
          : day
      )
    );
  }

  async function saveDay(day: ScheduleDayType) {
  setSavingWeekday(day.weekday);
  setErrorSchedule(null);
  try {
    const res = await fetch('/api/admin/schedule', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        weekday: day.weekday,
        blocks: day.blocks, // [{start, end, enabled}]
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setErrorSchedule(data.error || 'Error guardando día');
      return;
    }

    // opcional: refrescás estado con lo que devuelve el server
    setScheduleDays(prev =>
      prev.map(d => (d.weekday === data.weekday ? data : d))
    );
  } catch (e) {
    console.error(e);
    setErrorSchedule('Error guardando día');
  } finally {
    setSavingWeekday(null);
  }
}


  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Horarios</h2>
          <p className="text-[11px] text-slate-400">
            Definí los bloques de atención para cada día. Los turnos se
            generan usando estos rangos y la duración del servicio.
          </p>
        </div>
        {loadingSchedule && (
          <span className="text-[11px] text-slate-400">
            Cargando...
          </span>
        )}
      </div>

      {errorSchedule && (
        <p className="text-xs text-red-400">{errorSchedule}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {scheduleDays.map((day) => (
          <div
            key={day.weekday}
            className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">
                {weekdayLabel(day.weekday)}
              </span>
              {day.blocks.length === 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  Cerrado
                </span>
              )}
            </div>

            {day.blocks.map((block, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-xs"
              >
                <div className="flex items-center gap-1 flex-1">
                  <span className="text-[11px] text-slate-400">
                    Desde
                  </span>
                  <input
                    type="time"
                    value={block.start}
                    onChange={(e) =>
                      updateBlockField(
                        day.weekday,
                        index,
                        'start',
                        e.target.value
                      )
                    }
                    className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs flex-1"
                  />
                </div>
                <div className="flex items-center gap-1 flex-1">
                  <span className="text-[11px] text-slate-400">
                    Hasta
                  </span>
                  <input
                    type="time"
                    value={block.end}
                    onChange={(e) =>
                      updateBlockField(
                        day.weekday,
                        index,
                        'end',
                        e.target.value
                      )
                    }
                    className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs flex-1"
                  />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    deleteBlock(day.weekday, index)
                  }
                  className="text-[11px] text-slate-400 hover:text-red-400"
                >
                  x
                </button>
              </div>
            ))}

            <div className="flex items-center justify-between mt-1">
              <button
                type="button"
                onClick={() => addBlock(day.weekday)}
                className="text-[11px] px-2 py-1 rounded-full border border-slate-700 hover:bg-slate-800"
              >
                Agregar bloque
              </button>
              <button
                type="button"
                onClick={() => saveDay(day)}
                disabled={savingWeekday === day.weekday}
                className="text-[11px] px-3 py-1 rounded-full"
                style={{ backgroundColor: PINK, color: '#020617' }}
              >
                {savingWeekday === day.weekday
                  ? 'Guardando...'
                  : 'Guardar día'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
