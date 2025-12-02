'use client';

import { useEffect, useState } from 'react';

type Settings = {
  id: string;
  businessId: string;
  publicName: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  backgroundType: 'solid' | 'gradient' | 'image';
  backgroundColor: string;
  gradientFrom: string;
  gradientTo: string;
  backgroundImageUrl: string;
  logoUrl: string;
  heroTitle: string;
  heroSubtitle: string;
  ctaLabel: string;
  aboutEnabled: boolean;
  aboutTitle: string;
  aboutText: string;
  whatsappNumber: string;
  instagramHandle: string;
  address: string;
};

export default function SettingsTab() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/settings');
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Error cargando configuración');
        setSettings(null);
      } else {
        setSettings(json.settings);
      }
    } catch (e) {
      console.error(e);
      setError('Error cargando configuración');
      setSettings(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    setError(null);
    setSavedMsg(null);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Error guardando configuración');
        return;
      }
      setSettings(json.settings);
      setSavedMsg('Configuración guardada.');
    } catch (e) {
      console.error(e);
      setError('Error guardando configuración');
    } finally {
      setSaving(false);
    }
  }

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  if (loading && !settings) {
    return (
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-3">
        <p className="text-xs text-slate-400">Cargando configuración...</p>
      </section>
    );
  }

  if (!settings) {
    return (
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-3">
        {error ? (
          <p className="text-xs text-red-400">{error}</p>
        ) : (
          <p className="text-xs text-slate-400">
            No se pudo cargar la configuración.
          </p>
        )}
      </section>
    );
  }

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Configuración del negocio</h2>
          <p className="text-[11px] text-slate-400">
            Acá definís el nombre, colores y textos que se ven en tu página de turnos.
          </p>
        </div>
        {loading && (
          <span className="text-[11px] text-slate-400">Actualizando...</span>
        )}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
      {savedMsg && (
        <p className="text-xs text-emerald-400">{savedMsg}</p>
      )}

      <form onSubmit={handleSave} className="space-y-4 text-xs">
        {/* Nombre y hero */}
        <div className="grid md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <h3 className="text-[11px] font-semibold text-slate-200">
              Información básica
            </h3>
            <div className="space-y-1">
              <label className="block text-[11px] text-slate-400">
                Nombre público del negocio
              </label>
              <input
                value={settings.publicName}
                onChange={(e) => update('publicName', e.target.value)}
                className=" bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] text-slate-400">
                Título principal (landing de turnos)
              </label>
              <input
                value={settings.heroTitle}
                onChange={(e) => update('heroTitle', e.target.value)}
                className=" bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] text-slate-400">
                Subtítulo
              </label>
              <textarea
                value={settings.heroSubtitle}
                onChange={(e) => update('heroSubtitle', e.target.value)}
                className=" bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs min-h-[60px]"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] text-slate-400">
                Texto del botón principal
              </label>
              <input
                value={settings.ctaLabel}
                onChange={(e) => update('ctaLabel', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs"
              />
            </div>
          </div>

          {/* Branding / colores */}
          <div className="space-y-2">
            <h3 className="text-[11px] font-semibold text-slate-200">
              Colores y branding
            </h3>

            <div className="grid grid-cols-[auto,1fr] items-center gap-2">
              <span className="text-[11px] text-slate-400">
                Color primario
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.primaryColor}
                  onChange={(e) =>
                    update('primaryColor', e.target.value)
                  }
                  className="h-7 w-10 rounded border border-slate-700 bg-slate-950"
                />
                <input
                  value={settings.primaryColor}
                  onChange={(e) =>
                    update('primaryColor', e.target.value)
                  }
                  className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[11px]"
                />
              </div>

              <span className="text-[11px] text-slate-400">
                Color secundario
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.secondaryColor}
                  onChange={(e) =>
                    update('secondaryColor', e.target.value)
                  }
                  className="h-7 w-10 rounded border border-slate-700 bg-slate-950"
                />
                <input
                  value={settings.secondaryColor}
                  onChange={(e) =>
                    update('secondaryColor', e.target.value)
                  }
                  className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[11px]"
                />
              </div>

              <span className="text-[11px] text-slate-400">
                Color de texto
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.textColor}
                  onChange={(e) =>
                    update('textColor', e.target.value)
                  }
                  className="h-7 w-10 rounded border border-slate-700 bg-slate-950"
                />
                <input
                  value={settings.textColor}
                  onChange={(e) =>
                    update('textColor', e.target.value)
                  }
                  className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[11px]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] text-slate-400">
                Tipo de fondo
              </label>
              <div className="inline-flex rounded-md border border-slate-700 overflow-hidden">
                {(['solid', 'gradient', 'image'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => update('backgroundType', t)}
                    className={`px-3 py-1 text-[11px] ${
                      settings.backgroundType === t
                        ? 'bg-slate-100 text-slate-900'
                        : 'bg-slate-900 text-slate-300'
                    }`}
                  >
                    {t === 'solid'
                      ? 'Color sólido'
                      : t === 'gradient'
                      ? 'Degradado'
                      : 'Imagen'}
                  </button>
                ))}
              </div>
            </div>

            {settings.backgroundType === 'solid' && (
              <div className="space-y-1">
                <label className="block text-[11px] text-slate-400">
                  Color de fondo
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.backgroundColor}
                    onChange={(e) =>
                      update('backgroundColor', e.target.value)
                    }
                    className="h-7 w-10 rounded border border-slate-700 bg-slate-950"
                  />
                  <input
                    value={settings.backgroundColor}
                    onChange={(e) =>
                      update('backgroundColor', e.target.value)
                    }
                    className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[11px]"
                  />
                </div>
              </div>
            )}

            {settings.backgroundType === 'gradient' && (
              <div className="space-y-1">
                <label className="block text-[11px] text-slate-400">
                  Degradado (de / a)
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 flex-1">
                    <input
                      type="color"
                      value={settings.gradientFrom}
                      onChange={(e) =>
                        update('gradientFrom', e.target.value)
                      }
                      className="h-7 w-10 rounded border border-slate-700 bg-slate-950"
                    />
                    <input
                      value={settings.gradientFrom}
                      onChange={(e) =>
                        update('gradientFrom', e.target.value)
                      }
                      className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[11px]"
                    />
                  </div>
                  <div className="flex items-center gap-1 flex-1">
                    <input
                      type="color"
                      value={settings.gradientTo}
                      onChange={(e) =>
                        update('gradientTo', e.target.value)
                      }
                      className="h-7 w-10 rounded border border-slate-700 bg-slate-950"
                    />
                    <input
                      value={settings.gradientTo}
                      onChange={(e) =>
                        update('gradientTo', e.target.value)
                      }
                      className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[11px]"
                    />
                  </div>
                </div>
              </div>
            )}

            {settings.backgroundType === 'image' && (
              <div className="space-y-1">
                <label className="block text-[11px] text-slate-400">
                  URL de imagen de fondo
                </label>
                <input
                  value={settings.backgroundImageUrl}
                  onChange={(e) =>
                    update('backgroundImageUrl', e.target.value)
                  }
                  placeholder="https://..."
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[11px]"
                />
                <p className="text-[10px] text-slate-500">
                  Más adelante podés integrar tu propio uploader (tipo Uploadthings).
                </p>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-[11px] text-slate-400">
                URL de logo
              </label>
              <input
                value={settings.logoUrl}
                onChange={(e) => update('logoUrl', e.target.value)}
                placeholder="https://..."
                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[11px]"
              />
            </div>
          </div>
        </div>

        {/* Sobre / redes */}
        <div className="grid md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <h3 className="text-[11px] font-semibold text-slate-200">
              Sección “Sobre mí / nosotros”
            </h3>
            <label className="inline-flex items-center gap-2 text-[11px] text-slate-300">
              <input
                type="checkbox"
                checked={settings.aboutEnabled}
                onChange={(e) =>
                  update('aboutEnabled', e.target.checked)
                }
                className="h-3 w-3 rounded border-slate-600 bg-slate-950"
              />
              Mostrar sección en la página de turnos
            </label>

            {settings.aboutEnabled && (
              <>
                <div className="space-y-1">
                  <label className="block text-[11px] text-slate-400">
                    Título
                  </label>
                  <input
                    value={settings.aboutTitle}
                    onChange={(e) =>
                      update('aboutTitle', e.target.value)
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[11px]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] text-slate-400">
                    Texto
                  </label>
                  <textarea
                    value={settings.aboutText}
                    onChange={(e) =>
                      update('aboutText', e.target.value)
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[11px] min-h-[80px]"
                  />
                </div>
              </>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-[11px] font-semibold text-slate-200">
              Redes y contacto
            </h3>
            <div className="space-y-1">
              <label className="block text-[11px] text-slate-400">
                WhatsApp (para mostrar / armar links)
              </label>
              <input
                value={settings.whatsappNumber}
                onChange={(e) =>
                  update('whatsappNumber', e.target.value)
                }
                placeholder="Ej: 5491123456789"
                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[11px]"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] text-slate-400">
                Instagram (@usuario)
              </label>
              <input
                value={settings.instagramHandle}
                onChange={(e) =>
                  update('instagramHandle', e.target.value)
                }
                placeholder="@mitrabajo"
                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[11px]"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] text-slate-400">
                Dirección (opcional)
              </label>
              <input
                value={settings.address}
                onChange={(e) => update('address', e.target.value)}
                placeholder="Calle 123, Ciudad"
                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[11px]"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-900 disabled:opacity-60"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </section>
  );
}
