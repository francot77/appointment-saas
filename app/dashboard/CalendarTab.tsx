'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminAppointment, PINK } from './types';

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

export default function CalendarTab() {
    const [baseDate, setBaseDate] = useState('');
    const [week, setWeek] = useState<WeekRange | null>(null);
    const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        setBaseDate(`${yyyy}-${mm}-${dd}`);
    }, []);

    useEffect(() => {
        if (!baseDate) return;
        const w = getWeekRange(baseDate);
        setWeek(w);
        loadWeekAppointments(w);

    }, [baseDate]);

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
                setError(json.error || 'Error cargando turnos de la semana');
                setAppointments([]);
            } else {
                setAppointments(json.appointments || []);
            }
        } catch (e) {
            console.error(e);
            setError('Error cargando turnos de la semana');
            setAppointments([]);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-3">
            <section className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-400">
                        Semana a visualizar
                    </label>
                    <input
                        type="date"
                        value={baseDate}
                        onChange={(e) => setBaseDate(e.target.value)}
                        className="bg-slate-950 border border-slate-700 text-sm rounded-md px-2 py-1"
                    />
                    {week && (
                        <span className="text-[10px] text-slate-500">
                            Semana del {week.from} al {week.to} (lun a vie)
                        </span>
                    )}
                </div>

                {loading && (
                    <span className="text-xs text-slate-400">
                        Cargando turnos...
                    </span>
                )}

                {error && (
                    <span className="text-xs text-red-400">
                        {error}
                    </span>
                )}
            </section>

            {week && (
                <WeekCalendar week={week} appointments={appointments} />
            )}
        </div>
    );
}

/* ---------- VISTA SEMANAL ---------- */

type WeekCalendarProps = {
    week: WeekRange;
    appointments: AdminAppointment[];
};

function timeToMinutes(t: string) {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
}

function WeekCalendar({ week, appointments }: WeekCalendarProps) {
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
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-3">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Agenda semanal</h2>
                <span className="text-[11px] text-slate-400">
                    Vista tipo calendario (solo confirmados)
                </span>
            </div>

            {/* grilla 2 filas: encabezados + agenda */}
            <div
                className="grid h-[520px] sm:h-[620px] relative"
                style={{
                    gridTemplateColumns: '40px repeat(5, 1fr)',
                    gridTemplateRows: 'auto 1fr',
                }}
            >
                {/* COLUMNA HORAS (las dos filas) */}
                <div
                    className="relative text-[10px] text-slate-400 border-r border-slate-800"
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
                                    // un poco por debajo de la línea
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

                {/* FILA 1: encabezados de días */}
                {week.days.map((day, idx) => (
                    <div
                        key={day.date}
                        className="flex items-center justify-center border-b border-slate-800 bg-slate-900/95 text-center"
                        style={{ gridRow: 1, gridColumn: idx + 2 }}
                    >
                        <span className="text-[10px] text-slate-200 font-medium">
                            {day.label}
                        </span>
                    </div>
                ))}

                {/* FILA 2: agenda por día */}
                {week.days.map((day, idx) => {
                    const dayAppointments = confirmed.filter(
                        (a) => a.date === day.date
                    );

                    return (
                        <div
                            key={day.date + '-body'}
                            className="relative border-l border-slate-900/40"
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
                                            className="absolute left-0 right-0 border-t border-slate-800/70"
                                            style={{ top: `${topPct}%` }}
                                        />
                                    );
                                })}

                                {/* bloques de turnos */}
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

                                        return (
                                            <div
                                                key={a.id}
                                                onClick={() =>
                                                    router.push(`/dashboard/appointments/${a.id}`)
                                                }
                                                className="absolute left-[8%] right-[8%] rounded-md shadow-md cursor-pointer px-1.5 py-1 text-[10px] overflow-hidden"
                                                style={{
                                                    top: `${top}%`,
                                                    height: `${height}%`,
                                                    minHeight: '30px', // 👈 un poquito más alto para que quepan 2 líneas
                                                    backgroundColor: `${a.serviceColor || PINK}33`,
                                                    borderLeft: `3px solid ${a.serviceColor || PINK}`,
                                                }}
                                            >
                                                {/* 1ª línea: hora + nombre */}
                                                <div className="font-semibold leading-tight truncate">
                                                    {a.startTime}
                                                </div>
                                                <div className="font-semibold leading-tight truncate">
                                                    {a.clientName}
                                                </div>
                                                {/* 2ª línea: servicio (primer renglón) */}
                                                <div className="text-[9px] leading-tight text-slate-100/80 truncate">
                                                    {a.serviceName}
                                                </div>
                                            </div>
                                        );
                                        ;
                                    })}
                            </div>
                        </div>
                    );
                })}

                {!hasAppointments && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <p className="text-xs text-slate-500">
                            No hay turnos confirmados en esta semana.
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}
