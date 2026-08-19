'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { getSavedAppointments, removeSavedAppointment, SavedAppointment } from '@/lib/clientAppointmentsStorage';

export default function SavedAppointments({ slug }: { slug: string }) {
  const [entries, setEntries] = useState<SavedAppointment[]>(() => getSavedAppointments(slug));
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setEntries(getSavedAppointments(slug));
  }, [slug]);

  useEffect(() => {
    const onStorage = () => refresh();
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [refresh]);

  const validate = useCallback(async (entry: SavedAppointment) => {
    try {
      const response = await fetch(entry.managementUrl, { cache: 'no-store' });
      if (response.status === 404 || response.status === 410) {
        removeSavedAppointment(entry.id);
        setMessage('Uno de tus turnos guardados ya no está disponible.');
        refresh();
      }
    } catch {
      // Keep the entry when offline; the management page can be opened later.
    }
  }, [refresh]);

  useEffect(() => {
    entries.forEach((entry) => void validate(entry));
  }, [entries, validate]);

  if (!entries.length && !message) return null;

  return (
    <section className="mt-5 rounded-2xl border border-[#ded9cf] bg-white/80 p-4" aria-labelledby={`saved-appointments-${slug}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id={`saved-appointments-${slug}`} className="text-[15px] font-semibold">Mis turnos guardados en este dispositivo</h2>
          <p className="mt-1 text-[13px] leading-5 text-[#617083]">Solo aparecen turnos de este negocio. El acceso se guarda como enlace local y podés quitarlo cuando quieras.</p>
        </div>
      </div>
      {message && <p className="mt-3 text-[13px] text-[#8d3328]" role="status">{message}</p>}
      <ul className="mt-3 space-y-2">
        {entries.map((entry) => (
          <li key={entry.id} className="flex items-center justify-between gap-3 rounded-xl border border-[#ebe7df] bg-[#faf8f3] p-3 text-[13px]">
            <Link href={entry.managementUrl} className="min-w-0 underline underline-offset-4">
              <span className="block font-semibold">{entry.serviceName || 'Turno'} · {entry.date}</span>
              <span className="block text-[#617083]">{entry.startTime} a {entry.endTime} · Gestionar</span>
            </Link>
            <button type="button" onClick={() => { removeSavedAppointment(entry.id); refresh(); }} className="shrink-0 text-[#8d3328] underline underline-offset-4">Quitar</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
