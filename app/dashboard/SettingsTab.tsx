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

function settingsErrorMessage(action: 'load' | 'save') {
  return action === 'load'
    ? 'No pudimos cargar la configuración. Revisá la conexión e intentá de nuevo.'
    : 'No pudimos guardar la configuración. Revisá los datos e intentá de nuevo.';
}

function slugErrorMessage(status: number, code?: string) {
  if (code === 'CONFLICT' || status === 409) return 'Esa dirección ya está en uso. Elegí otra.';
  if (code === 'VALIDATION' || status === 400) return 'Usá una dirección con letras, números y guiones.';
  return 'No pudimos revisar esta dirección. Intentá nuevamente.';
}

export default function SettingsTab() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<'saved' | 'unsaved' | 'saving' | 'error'>('saved');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');

  const [slug, setSlug] = useState('');
  const [persistedSlug, setPersistedSlug] = useState('');
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugCheck, setSlugCheck] = useState<{
    available: boolean;
    slug?: string;
    error?: string;
    code?: string;
  } | null>(null);
  const [slugSaving, setSlugSaving] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [slugSavedMsg, setSlugSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
    loadSlug();
  }, []);

  async function loadSettings() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/settings');
      const json = await res.json();
      if (!res.ok) {
        console.error('GET /api/admin/settings failed', { status: res.status, code: json.code, error: json.error });
        setError(settingsErrorMessage('load'));
        setSettings(null);
      } else {
        setSettings(json.settings);
        setSaveState('saved');
      }
    } catch (e) {
      console.error(e);
      setError('Error cargando configuración');
      setSettings(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadSlug() {
    setSlugError(null);
    try {
      const res = await fetch('/api/admin/slug');
      const json = await res.json();
      if (!res.ok) {
        console.error('GET /api/admin/slug failed', { status: res.status, code: json.code, error: json.error });
        setSlugError('No pudimos cargar tu dirección pública. Intentá nuevamente.');
        return;
      }
      setSlug(String(json.slug || ''));
      setPersistedSlug(String(json.slug || ''));
      setSlugCheck({ available: true, slug: String(json.slug || ''), code: 'OWN' });
    } catch (e) {
      console.error(e);
      setSlugError('No pudimos cargar tu dirección pública. Intentá nuevamente.');
    }
  }

  useEffect(() => {
    let cancelled = false;
    const value = slug.trim();

    if (!value) {
      setSlugCheck(null);
      return;
    }

    if (value === persistedSlug) {
      setSlugCheck({ available: true, slug: value, code: 'OWN' });
      return;
    }

    setSlugChecking(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/slug?slug=${encodeURIComponent(value)}`);
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          console.error('GET /api/admin/slug availability failed', { status: res.status, code: json.code, error: json.error });
          setSlugCheck({ available: false, error: slugErrorMessage(res.status, json.code), code: json.code });
        } else {
          setSlugCheck(json);
        }
      } catch (e) {
        if (cancelled) return;
        console.error(e);
        setSlugCheck({ available: false, error: 'No pudimos revisar esta dirección. Intentá nuevamente.', code: 'NETWORK' });
      } finally {
        if (!cancelled) setSlugChecking(false);
      }
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [slug, persistedSlug]);

  async function handleSaveSlug() {
    setSlugSaving(true);
    setSlugError(null);
    setSlugSavedMsg(null);

    try {
      const res = await fetch('/api/admin/slug', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      });
      const json = await res.json();
      if (!res.ok) {
        console.error('PATCH /api/admin/slug failed', { status: res.status, code: json.code, error: json.error });
        setSlugError(slugErrorMessage(res.status, json.code));
        return;
      }

      const nextSlug = String(json.slug || slug);
      setSlug(nextSlug);
      setPersistedSlug(nextSlug);
      setSlugCheck({ available: true, slug: nextSlug, code: 'OWN' });
      setSlugSavedMsg('URL actualizada.');
    } catch (e) {
      console.error(e);
      setSlugError('No pudimos actualizar tu dirección pública. Intentá nuevamente.');
    } finally {
      setSlugSaving(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    setSaveState('saving');
    setError(null);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const json = await res.json();
      if (!res.ok) {
        console.error('PUT /api/admin/settings failed', { status: res.status, code: json.code, error: json.error });
        setError(settingsErrorMessage('save'));
        setSaveState('error');
        return;
      }
      setSettings(json.settings);
      setSaveState('saved');
    } catch (e) {
      console.error(e);
      setError('Error guardando configuración');
      setSaveState('error');
    } finally {
      setSaving(false);
    }
  }

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
    setSaveState('unsaved');
  }

  const publicSlug = persistedSlug;

  async function copyPublicUrl() {
    if (!publicSlug || typeof window === 'undefined') return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/${publicSlug}`);
      setCopyState('copied');
    } catch {
      setCopyState('error');
    }
  }

  const copyStatus = copyState === 'copied'
    ? 'Link copiado al portapapeles.'
    : copyState === 'error'
      ? 'No se pudo copiar el link.'
      : '';

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

  const fieldClass = 'w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500/40';
  const setupComplete = Boolean(settings.publicName.trim() && settings.heroTitle.trim() && publicSlug.trim());

  return (
    <section className="space-y-5" aria-labelledby="settings-title">
      <header className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-400">Tu página pública</p>
            <h2 id="settings-title" className="mt-1 text-xl font-semibold tracking-tight text-slate-50">Configurá cómo te encuentran tus clientes</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Personalizá el contenido y la apariencia de tu página de turnos. Los cambios se aplican cuando los guardás.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm" aria-live="polite">
            <span className={`rounded-full px-3 py-1.5 ${setupComplete ? 'bg-emerald-400/10 text-emerald-300' : 'bg-amber-400/10 text-amber-300'}`}>
              {setupComplete ? 'Página lista para compartir' : 'Falta completar algunos datos'}
            </span>
            {loading && <span className="text-slate-400">Actualizando...</span>}
          </div>
        </div>
        <div className="mt-5 grid gap-3 rounded-xl border border-slate-700/80 bg-slate-950/60 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Vista previa rápida</p>
            <p className="mt-1 truncate text-sm text-slate-200">{publicSlug ? `/${publicSlug}` : 'Todavía no tenés una URL pública'}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {publicSlug ? <a href={`/${publicSlug}`} target="_blank" rel="noreferrer" className="rounded-full border border-slate-600 px-3 py-2 text-sm text-slate-200 transition hover:border-slate-400">Abrir página</a> : <button type="button" disabled className="rounded-full border border-slate-600 px-3 py-2 text-sm text-slate-200 opacity-50">Abrir página</button>}
            <button type="button" onClick={copyPublicUrl} disabled={!publicSlug} className="rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50">{copyState === 'copied' ? 'Link copiado' : copyState === 'error' ? 'No se pudo copiar' : 'Copiar link'}</button>
            <span className="sr-only" aria-live="polite" role="status">{copyStatus}</span>
          </div>
        </div>
      </header>

      <form onSubmit={handleSave} className="space-y-5">
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6" aria-labelledby="public-page-title">
          <div className="mb-5"><h3 id="public-page-title" className="text-lg font-semibold text-slate-100">Página pública</h3><p className="mt-1 text-sm leading-6 text-slate-400">Estos son los textos que ven tus clientes cuando llegan a reservar.</p></div>
          <div className="grid gap-5 lg:grid-cols-2">
            <div><label htmlFor="publicName" className="text-sm font-medium text-slate-200">Nombre que querés mostrar</label><p className="mt-1 text-sm text-slate-500">Usalo tal como lo conocen tus clientes.</p><input id="publicName" value={settings.publicName} onChange={(e) => update('publicName', e.target.value)} className={`${fieldClass} mt-2`} /></div>
            <div><label htmlFor="heroTitle" className="text-sm font-medium text-slate-200">Mensaje principal</label><p className="mt-1 text-sm text-slate-500">La primera frase que aparece en tu página.</p><input id="heroTitle" value={settings.heroTitle} onChange={(e) => update('heroTitle', e.target.value)} className={`${fieldClass} mt-2`} /></div>
            <div><label htmlFor="heroSubtitle" className="text-sm font-medium text-slate-200">Descripción breve</label><p className="mt-1 text-sm text-slate-500">Contá qué ofrecés o cómo pueden reservar.</p><textarea id="heroSubtitle" value={settings.heroSubtitle} onChange={(e) => update('heroSubtitle', e.target.value)} className={`${fieldClass} mt-2 min-h-[100px]`} /></div>
            <div><label htmlFor="ctaLabel" className="text-sm font-medium text-slate-200">Texto del botón para reservar</label><p className="mt-1 text-sm text-slate-500">Por ejemplo: “Reservar turno” o “Elegir horario”.</p><input id="ctaLabel" value={settings.ctaLabel} onChange={(e) => update('ctaLabel', e.target.value)} className={`${fieldClass} mt-2`} /></div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6" aria-labelledby="appearance-title">
          <div className="mb-5"><h3 id="appearance-title" className="text-lg font-semibold text-slate-100">Apariencia</h3><p className="mt-1 text-sm leading-6 text-slate-400">Elegí un estilo para que tu página se sienta propia. Después podés ajustarlo con más detalle.</p></div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[['Clásico', '#2563eb', '#dbeafe', '#0f172a'], ['Cálido', '#c2410c', '#ffedd5', '#431407'], ['Natural', '#15803d', '#dcfce7', '#14532d']].map(([name, primary, secondary, text]) => (
              <button key={name} type="button" onClick={() => { update('primaryColor', primary); update('secondaryColor', secondary); update('textColor', text); }} className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-left transition hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400" aria-label={`Aplicar estilo ${name}`} aria-pressed={settings.primaryColor === primary && settings.secondaryColor === secondary && settings.textColor === text}>
                <span className="flex gap-1" aria-hidden="true"><span className="h-8 flex-1 rounded-md" style={{ backgroundColor: primary }} /><span className="h-8 w-8 rounded-md" style={{ backgroundColor: secondary }} /></span><span className="mt-2 block text-sm font-medium text-slate-200">{name}</span><span className="mt-1 block text-xs text-slate-500">Combinación recomendada</span>
              </button>
            ))}
          </div>
          <details className="mt-5 rounded-xl border border-slate-700/80 bg-slate-950/40 p-4"><summary className="cursor-pointer text-sm font-medium text-slate-200">Ajustes avanzados de apariencia</summary><p className="mt-2 text-sm text-slate-500">Si necesitás usar colores de marca específicos, podés editarlos acá.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {([['primaryColor', 'Color principal'], ['secondaryColor', 'Color de apoyo'], ['textColor', 'Color del texto']] as const).map(([key, label]) => <div key={key}><label htmlFor={key} className="text-sm text-slate-300">{label}</label><div className="mt-2 flex gap-2"><input id={`${key}-picker`} type="color" value={settings[key]} onChange={(e) => update(key, e.target.value)} className="h-10 w-12 rounded border border-slate-700 bg-slate-950" aria-label={`${label}, selector visual`} /><input id={key} value={settings[key]} onChange={(e) => update(key, e.target.value)} className={fieldClass} aria-label={`${label}, valor`} /></div></div>)}
            </div>
            <div className="mt-5"><span className="text-sm font-medium text-slate-300">Fondo de la página</span><div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Tipo de fondo">{(['solid', 'gradient', 'image'] as const).map((t) => <button key={t} type="button" onClick={() => update('backgroundType', t)} aria-pressed={settings.backgroundType === t} className={`rounded-full border px-3 py-2 text-sm ${settings.backgroundType === t ? 'border-slate-300 bg-slate-100 text-slate-900' : 'border-slate-700 text-slate-300'}`}>{t === 'solid' ? 'Color liso' : t === 'gradient' ? 'Degradado' : 'Imagen'}</button>)}</div></div>
            {settings.backgroundType === 'solid' && <div className="mt-4"><label htmlFor="backgroundColor" className="text-sm text-slate-300">Color de fondo</label><div className="mt-2 flex gap-2"><input type="color" value={settings.backgroundColor} onChange={(e) => update('backgroundColor', e.target.value)} className="h-10 w-12 rounded border border-slate-700 bg-slate-950" aria-label="Color de fondo, selector visual" /><input id="backgroundColor" value={settings.backgroundColor} onChange={(e) => update('backgroundColor', e.target.value)} className={fieldClass} /></div></div>}
            {settings.backgroundType === 'gradient' && <div className="mt-4 grid gap-4 sm:grid-cols-2"><div><label htmlFor="gradientFrom" className="text-sm text-slate-300">Inicio del degradado</label><input id="gradientFrom" value={settings.gradientFrom} onChange={(e) => update('gradientFrom', e.target.value)} className={`${fieldClass} mt-2`} /></div><div><label htmlFor="gradientTo" className="text-sm text-slate-300">Final del degradado</label><input id="gradientTo" value={settings.gradientTo} onChange={(e) => update('gradientTo', e.target.value)} className={`${fieldClass} mt-2`} /></div></div>}
            {settings.backgroundType === 'image' && <div className="mt-4"><label htmlFor="backgroundImageUrl" className="text-sm text-slate-300">Dirección de la imagen de fondo</label><input id="backgroundImageUrl" value={settings.backgroundImageUrl} onChange={(e) => update('backgroundImageUrl', e.target.value)} placeholder="https://..." className={`${fieldClass} mt-2`} /><p className="mt-1 text-sm text-slate-500">Pegá la dirección de una imagen que ya esté publicada.</p></div>}
            <div className="mt-4"><label htmlFor="logoUrl" className="text-sm text-slate-300">Dirección de tu logo (opcional)</label><input id="logoUrl" value={settings.logoUrl} onChange={(e) => update('logoUrl', e.target.value)} placeholder="https://..." className={`${fieldClass} mt-2`} /></div>
          </details>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6" aria-labelledby="about-title">
          <div className="mb-5"><h3 id="about-title" className="text-lg font-semibold text-slate-100">Sobre vos y contacto</h3><p className="mt-1 text-sm leading-6 text-slate-400">Ayudá a tus clientes a conocerte y a encontrar una forma directa de contactarte.</p></div>
          <label className="flex items-start gap-3 text-sm text-slate-200"><input type="checkbox" checked={settings.aboutEnabled} onChange={(e) => update('aboutEnabled', e.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-950" /> <span><strong className="font-medium">Mostrar una sección sobre tu negocio</strong><span className="mt-1 block text-sm text-slate-500">Aparece en tu página pública debajo de la información principal.</span></span></label>
          {settings.aboutEnabled && <div className="mt-5 grid gap-5 lg:grid-cols-2"><div><label htmlFor="aboutTitle" className="text-sm font-medium text-slate-200">Título de la presentación</label><input id="aboutTitle" value={settings.aboutTitle} onChange={(e) => update('aboutTitle', e.target.value)} className={`${fieldClass} mt-2`} /></div><div><label htmlFor="aboutText" className="text-sm font-medium text-slate-200">Tu presentación</label><textarea id="aboutText" value={settings.aboutText} onChange={(e) => update('aboutText', e.target.value)} className={`${fieldClass} mt-2 min-h-[100px]`} /></div></div>}
          <div className="mt-5 grid gap-5 md:grid-cols-3"><div><label htmlFor="whatsappNumber" className="text-sm font-medium text-slate-200">WhatsApp</label><p className="mt-1 text-sm text-slate-500">Para que puedan escribirte.</p><input id="whatsappNumber" value={settings.whatsappNumber} onChange={(e) => update('whatsappNumber', e.target.value)} placeholder="5491123456789" className={`${fieldClass} mt-2`} /></div><div><label htmlFor="instagramHandle" className="text-sm font-medium text-slate-200">Instagram</label><p className="mt-1 text-sm text-slate-500">Tu nombre de usuario.</p><input id="instagramHandle" value={settings.instagramHandle} onChange={(e) => update('instagramHandle', e.target.value)} placeholder="@mitrabajo" className={`${fieldClass} mt-2`} /></div><div><label htmlFor="address" className="text-sm font-medium text-slate-200">Dirección</label><p className="mt-1 text-sm text-slate-500">Opcional, si atendés presencialmente.</p><input id="address" value={settings.address} onChange={(e) => update('address', e.target.value)} placeholder="Calle 123, Ciudad" className={`${fieldClass} mt-2`} /></div></div>
        </section>

        <section className="rounded-2xl border border-amber-400/30 bg-amber-400/5 p-5 sm:p-6" aria-labelledby="sharing-title">
          <div className="mb-5"><h3 id="sharing-title" className="text-lg font-semibold text-slate-100">Compartir tu página</h3><p className="mt-1 text-sm leading-6 text-slate-400">Esta dirección es la que podés enviar por WhatsApp, redes o agregar a tu bio.</p></div>
          <label htmlFor="slug" className="text-sm font-medium text-slate-200">Dirección pública</label><p className="mt-1 text-sm text-slate-500">Elegí una dirección corta y fácil de recordar.</p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row"><input id="slug" value={slug} onChange={(e) => { setSlug(e.target.value); setSlugSavedMsg(null); setSlugError(null); }} className={fieldClass} placeholder="mi-negocio" aria-describedby="slug-help slug-status" /><button type="button" onClick={handleSaveSlug} disabled={slugSaving || slugChecking || !slug || (slugCheck ? !slugCheck.available : true) || slug.trim() === persistedSlug} className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 disabled:opacity-50">{slugSaving ? 'Guardando...' : 'Guardar dirección'}</button></div>
          <div id="slug-status" className="mt-2 text-sm" aria-live="polite">{slugChecking && <span className="text-slate-400">Revisando disponibilidad...</span>}{!slugChecking && slugCheck?.available && slug.trim() !== persistedSlug && <span className="text-emerald-300">Esta dirección está disponible.</span>}{!slugChecking && slugCheck && !slugCheck.available && <span className="text-red-300">{slugCheck.error || 'Esta dirección no está disponible.'}</span>}{slugError && <span className="text-red-300">{slugError}</span>}{slugSavedMsg && <span className="text-emerald-300">{slugSavedMsg}</span>}</div>
          <p id="slug-help" className="mt-3 text-sm leading-6 text-amber-100/70">Solo letras, números y guiones. Si la cambiás, los links que ya compartiste pueden dejar de funcionar. Avisales a tus clientes antes de hacerlo.</p>
        </section>

        <div className="sticky bottom-3 z-10 flex flex-col gap-3 rounded-2xl border border-slate-700 bg-slate-950/95 p-3 shadow-2xl backdrop-blur sm:flex-row sm:items-center sm:justify-between"><p className="text-sm" aria-live="polite">{saveState === 'unsaved' && <span className="text-amber-300">Tenés cambios sin guardar.</span>}{saveState === 'saving' && <span className="text-slate-300">Guardando cambios...</span>}{saveState === 'saved' && <span className="text-emerald-300">Todos los cambios están guardados.</span>}{saveState === 'error' && <span className="text-red-300">No se pudieron guardar los cambios.</span>}</p><button type="submit" disabled={saving} className="rounded-full bg-slate-100 px-5 py-2.5 text-sm font-medium text-slate-900 transition hover:bg-white disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar cambios'}</button></div>
      </form>
    </section>
  );
}
