import { useEffect, useState } from 'react';
import { AdminService, PINK } from './types';

export default function ServicesTab() {
  const [services, setServices] = useState<AdminService[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [errorServices, setErrorServices] = useState<string | null>(null);

  const [editingServiceId, setEditingServiceId] = useState<string | null>(
    null
  );
  const [serviceName, setServiceName] = useState('');
  const [serviceDuration, setServiceDuration] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [serviceColor, setServiceColor] = useState(PINK);
  const [serviceActive, setServiceActive] = useState(true);
  const [savingService, setSavingService] = useState(false);

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    setLoadingServices(true);
    setErrorServices(null);

    try {
      const res = await fetch('/api/admin/services');
      const json = await res.json();

      if (!res.ok) {
        setErrorServices(json.error || 'Error cargando servicios');
        setServices([]);
      } else {
        setServices(json.services || []);
      }
    } catch (e) {
      console.error(e);
      setErrorServices('Error cargando servicios');
      setServices([]);
    } finally {
      setLoadingServices(false);
    }
  }

  function resetServiceForm() {
    setEditingServiceId(null);
    setServiceName('');
    setServiceDuration('');
    setServicePrice('');
    setServiceColor(PINK);
    setServiceActive(true);
  }

  function startEditService(service: AdminService) {
    setEditingServiceId(service.id);
    setServiceName(service.name);
    setServiceDuration(String(service.durationMinutes || ''));
    setServicePrice(
      service.price !== undefined && service.price !== null
        ? String(service.price)
        : ''
    );
    setServiceColor(service.color || PINK);
    setServiceActive(service.active);
  }

  async function saveService(e: React.FormEvent) {
    e.preventDefault();
    setErrorServices(null);
    setSavingService(true);

    try {
      const payload = {
        name: serviceName,
        durationMinutes: Number(serviceDuration),
        price: servicePrice ? Number(servicePrice) : 0,
        color: serviceColor || PINK,
        active: serviceActive,
      };

      if (!payload.name || !payload.durationMinutes) {
        setErrorServices('Nombre y duración son obligatorios');
        setSavingService(false);
        return;
      }

      if (editingServiceId) {
        const res = await fetch(
          `/api/admin/services/${editingServiceId}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }
        );
        const json = await res.json();
        if (!res.ok) {
          setErrorServices(json.error || 'Error al guardar servicio');
        } else {
          setServices((prev) =>
            prev.map((s) =>
              s.id === editingServiceId
                ? { ...s, ...payload }
                : s
            )
          );
          resetServiceForm();
        }
      } else {
        const res = await fetch('/api/admin/services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok) {
          setErrorServices(json.error || 'Error al crear servicio');
        } else {
          setServices((prev) => [
            ...prev,
            {
              id: json.id,
              name: json.name,
              durationMinutes: json.durationMinutes,
              price: json.price,
              color: json.color,
              active: json.active,
            },
          ]);
          resetServiceForm();
        }
      }
    } catch (e) {
      console.error(e);
      setErrorServices('Error guardando servicio');
    } finally {
      setSavingService(false);
    }
  }

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Servicios</h2>
          <p className="text-[11px] text-slate-400">
            Agregá o modificá los servicios que se muestran a las
            clientas.
          </p>
        </div>
        <button
          onClick={resetServiceForm}
          className="text-[11px] px-3 py-1 rounded-full border border-slate-600 hover:bg-slate-800"
        >
          Nuevo servicio
        </button>
      </div>

      {/* Form */}
      <form
        onSubmit={saveService}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950 rounded-lg border border-slate-800 p-3"
      >
        <div className="sm:col-span-2">
          <label className="block text-xs mb-1 text-slate-200">
            Nombre
          </label>
          <input
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-pink-400"
            value={serviceName}
            onChange={(e) => setServiceName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-xs mb-1 text-slate-200">
            Duración (minutos)
          </label>
          <input
            type="number"
            min={10}
            step={5}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-pink-400"
            value={serviceDuration}
            onChange={(e) => setServiceDuration(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-xs mb-1 text-slate-200">
            Precio (opcional)
          </label>
          <input
            type="number"
            min={0}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-pink-400"
            value={servicePrice}
            onChange={(e) => setServicePrice(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs mb-1 text-slate-200">
            Color (opcional)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              className="w-10 h-8 rounded border border-slate-700 bg-slate-950 p-1"
              value={serviceColor}
              onChange={(e) => setServiceColor(e.target.value)}
            />
            <input
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-pink-400"
              value={serviceColor}
              onChange={(e) => setServiceColor(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="service-active"
            type="checkbox"
            checked={serviceActive}
            onChange={(e) => setServiceActive(e.target.checked)}
            className="w-4 h-4 rounded border-slate-700 bg-slate-950"
          />
          <label
            htmlFor="service-active"
            className="text-xs text-slate-200"
          >
            Activo (se muestra a las clientas)
          </label>
        </div>

        <div className="sm:col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={savingService}
            className="px-4 py-2 text-xs rounded-full font-medium shadow-md shadow-black/40 disabled:opacity-60"
            style={{ backgroundColor: PINK, color: '#020617' }}
          >
            {savingService
              ? 'Guardando...'
              : editingServiceId
              ? 'Guardar cambios'
              : 'Crear servicio'}
          </button>
        </div>

        {errorServices && (
          <p className="sm:col-span-2 text-xs text-red-400">
            {errorServices}
          </p>
        )}
      </form>

      {/* Lista */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold">
            Servicios actuales
          </h3>
          {loadingServices && (
            <span className="text-[11px] text-slate-400">
              Cargando...
            </span>
          )}
        </div>

        {services.length === 0 && !loadingServices && (
          <p className="text-xs text-slate-400">
            Todavía no hay servicios cargados.
          </p>
        )}

        <div className="space-y-2">
          {services.map((s) => (
            <div
              key={s.id}
              className="bg-slate-950 rounded-lg border border-slate-800 px-3 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full border border-slate-700"
                  style={{ backgroundColor: s.color || PINK }}
                />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">
                      {s.name}
                    </span>
                    {s.active ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                        Activo
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-200">
                        Oculto
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {s.durationMinutes} min
                    {s.price ? ` · $${s.price}` : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => startEditService(s)}
                  className="text-[11px] px-3 py-1 rounded-full border border-slate-600 hover:bg-slate-800"
                >
                  Editar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
