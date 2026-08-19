'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import SavedAppointments from './SavedAppointments';

type UiSettings = {
  primaryColor: string;
  accentColor: string;
  backgroundImageUrl: string | null;
  backgroundType: string;
  backgroundColor: string | null;
  gradientFrom: string | null;
  gradientTo: string | null;
  logoUrl: string | null;
  displayName: string;
  tagline: string;
  heroTitle: string | null;
  ctaLabel: string;
  aboutTitle: string | null;
  aboutText: string | null;
  whatsappNumber: string | null;
  instagramHandle: string | null;
  address: string | null;
  phone: string | null;
};

type Props = { slug: string; settings: UiSettings };

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

function validHex(value: string | null, fallback: string) {
  return value && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)
    ? value
    : fallback;
}

function contrastRatio(first: string, second: string) {
  const channel = (value: number) => {
    const normalized = value / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  const luminance = (color: string) => {
    const hex = color.replace('#', '');
    const normalized = hex.length === 3 ? hex.split('').map((part) => part + part).join('') : hex;
    const [red, green, blue] = [0, 2, 4].map((index) => parseInt(normalized.slice(index, index + 2), 16));
    return 0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue);
  };
  const lighter = Math.max(luminance(first), luminance(second));
  const darker = Math.min(luminance(first), luminance(second));
  return (lighter + 0.05) / (darker + 0.05);
}

function readableText(color: string) {
  const tenantOptions = ['#ffffff', '#18212b'];
  const tenantOption = tenantOptions.find((textColor) => contrastRatio(color, textColor) >= 4.5);
  if (tenantOption) return tenantOption;

  return contrastRatio(color, '#000000') >= contrastRatio(color, '#ffffff')
    ? '#000000'
    : '#ffffff';
}

function readableAccent(color: string) {
  return contrastRatio(color, '#fbf8f1') >= 4.5 ? color : '#18212b';
}

function normalizeOptional(value: string | null | undefined) {
  return value?.trim() || '';
}

export default function BusinessLandingClient({ slug, settings }: Props) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const primaryColor = validHex(settings.primaryColor, '#334e68');
  const accentColor = validHex(settings.accentColor, '#b94735');
  const displayName = settings.displayName.trim() || 'Negocio';
  const businessInitial = displayName.charAt(0).toUpperCase();
  const bookingLabel = settings.ctaLabel.trim() || 'Reservar turno';
  const heroTitle = normalizeOptional(settings.heroTitle);
  const tagline = settings.tagline.trim();
  const heroHeading = heroTitle || tagline || 'Reservá tu turno';
  const aboutTitle = normalizeOptional(settings.aboutTitle);
  const aboutText = normalizeOptional(settings.aboutText);
  const shareUrl = typeof window === 'undefined' ? `/${slug}` : window.location.href;

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const backgroundStyle = useMemo(() => {
    if (settings.backgroundType === 'image' && settings.backgroundImageUrl) {
      return {
        backgroundImage: `linear-gradient(rgba(20, 28, 36, .48), rgba(20, 28, 36, .48)), url(${settings.backgroundImageUrl})`,
        backgroundPosition: 'center',
        backgroundSize: 'cover',
      };
    }
    if (settings.backgroundType === 'solid') {
      return { backgroundColor: validHex(settings.backgroundColor, '#e9e3d7') };
    }
    return {
      backgroundImage: `linear-gradient(135deg, ${validHex(settings.gradientFrom, '#f4efe7')}, ${validHex(settings.gradientTo, '#e4edf0')})`,
    };
  }, [settings]);

  async function handleInstall() {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setShareStatus('La app quedó disponible en tu pantalla de inicio.');
        setDeferredPrompt(null);
      } else {
        setDeferredPrompt(null);
        setShareStatus('Instalación cancelada. Podés iniciarla más tarde desde el menú del navegador.');
      }
    } catch {
      setDeferredPrompt(null);
      setShareStatus('No se pudo iniciar la instalación. Podés iniciarla más tarde desde el menú del navegador.');
    } finally {
      setInstalling(false);
    }
  }

  async function handleShare() {
    setSharing(true);
    try {
      if (navigator.share) {
        await navigator.share({ title: displayName, text: tagline, url: shareUrl });
        setShareStatus('Página compartida.');
        return;
      }
      if (!navigator.clipboard?.writeText) {
        setShareStatus('No se pudo copiar el enlace en este navegador.');
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
      setShareStatus('Enlace copiado. Ya podés compartirlo.');
    } catch (error) {
      setShareStatus(error instanceof DOMException && error.name === 'AbortError'
        ? 'Compartir cancelado.'
        : 'No se pudo compartir el enlace.');
    } finally {
      setSharing(false);
    }
  }

  const address = normalizeOptional(settings.address);
  const phone = normalizeOptional(settings.phone);
  const whatsappNumber = normalizeOptional(settings.whatsappNumber);
  const instagramHandle = normalizeOptional(settings.instagramHandle);
  const contactItems = [
    address && { label: 'Ubicación', value: address },
    phone && { label: 'Teléfono', value: phone, href: `tel:${phone}` },
    whatsappNumber && { label: 'WhatsApp', value: whatsappNumber, href: `https://wa.me/${whatsappNumber.replace(/\D/g, '')}` },
    instagramHandle && { label: 'Instagram', value: instagramHandle, href: `https://instagram.com/${instagramHandle.replace(/^@/, '')}` },
  ].filter(Boolean) as Array<{ label: string; value: string; href?: string }>;

  return (
    <main className="min-h-screen px-4 py-5 text-[#18212b] sm:px-6 sm:py-10" style={backgroundStyle}>
      <div className="mx-auto flex w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-black/10 bg-[#fbf8f1]/95 shadow-[0_24px_80px_rgba(34,45,55,.18)] lg:grid lg:grid-cols-[1.1fr_.9fr]">
        <section className="flex flex-col justify-between gap-12 p-6 sm:p-10 lg:p-14">
          <header className="flex items-center gap-3">
            {settings.logoUrl ? (
              <div className="h-12 w-12 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={settings.logoUrl} alt="" className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-semibold shadow-sm" style={{ backgroundColor: primaryColor, color: readableText(primaryColor) }}>
                {businessInitial}
              </div>
            )}
            <p className="text-sm font-semibold tracking-[.08em] text-[#53606b]">{displayName}</p>
          </header>

          <div className="max-w-xl">
            <p className="mb-4 text-xs font-bold uppercase tracking-[.2em]" style={{ color: readableAccent(accentColor) }}>Agenda online</p>
            <h1 className="max-w-2xl text-4xl font-semibold leading-[.98] tracking-[-.045em] sm:text-6xl">
              {heroHeading}
            </h1>
            {heroTitle && tagline && <p className="mt-5 max-w-lg text-base leading-7 text-[#53606b]">{tagline}</p>}
            <Link href={`/${slug}/turnos`} className="mt-8 inline-flex min-h-14 w-full items-center justify-center rounded-2xl px-6 text-base font-bold shadow-lg transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#18212b]/25 sm:w-auto" style={{ backgroundColor: primaryColor, color: readableText(primaryColor) }}>
              {bookingLabel}
              <span aria-hidden="true" className="ml-3 text-xl">→</span>
            </Link>
            <p className="mt-3 text-xs text-[#687580]">Elegí un servicio, un horario y dejá tus datos.</p>
          </div>

          {aboutText && (
            <div className="max-w-lg border-l-2 pl-4" style={{ borderColor: accentColor }}>
              <p className="text-sm font-bold">{aboutTitle || 'Sobre este espacio'}</p>
              <p className="mt-2 text-sm leading-6 text-[#53606b]">{aboutText}</p>
            </div>
          )}
        </section>

        <aside className="border-t border-black/10 bg-white/65 p-6 sm:p-10 lg:border-l lg:border-t-0 lg:p-14">
          <div className="flex h-full flex-col justify-between gap-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.18em] text-[#687580]">Información</p>
              {contactItems.length > 0 ? (
                <dl className="mt-6 divide-y divide-black/10">
                  {contactItems.map((item) => (
                    <div key={item.label} className="py-4 first:pt-0">
                      <dt className="text-xs font-semibold uppercase tracking-[.12em] text-[#687580]">{item.label}</dt>
                      <dd className="mt-1 text-sm font-medium">
                        {item.href ? <a href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel={item.href.startsWith('http') ? 'noreferrer' : undefined} className="underline decoration-black/20 underline-offset-4 hover:decoration-black focus:outline-none focus-visible:ring-2 focus-visible:ring-[#18212b]">{item.value}</a> : item.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : <p className="mt-6 text-sm leading-6 text-[#687580]">Consultá la agenda para conocer los servicios y horarios disponibles.</p>}
            </div>

            <div className="rounded-2xl border border-black/10 bg-[#f4efe7] p-4">
              <p className="text-sm font-bold">Compartí esta página</p>
              <p className="mt-1 text-xs leading-5 text-[#687580]">Guardá el enlace para volver cuando quieras.</p>
              <button type="button" onClick={handleShare} disabled={sharing} className="mt-4 min-h-11 w-full rounded-xl border border-black/15 bg-white px-4 text-sm font-semibold transition hover:bg-[#fbf8f1] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#18212b]/20 disabled:cursor-wait disabled:opacity-60">
                {sharing ? 'Compartiendo...' : 'Compartir enlace'}
              </button>
              {deferredPrompt && <button type="button" onClick={handleInstall} disabled={installing} className="mt-2 min-h-11 w-full rounded-xl px-4 text-sm font-semibold transition hover:opacity-85 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#18212b]/20 disabled:cursor-wait disabled:opacity-60" style={{ backgroundColor: accentColor, color: readableText(accentColor) }}>{installing ? 'Preparando instalación...' : 'Instalar en el dispositivo'}</button>}
              {shareStatus && <p role="status" className="mt-3 text-xs font-medium text-[#53606b]">{shareStatus}</p>}
            </div>
          </div>
        </aside>
      </div>
      <SavedAppointments key={slug} slug={slug} />
    </main>
  );
}
