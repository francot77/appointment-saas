'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { InstallPwaButton } from '../components/InstallPwaButton';

type UiSettings = {
  primaryColor: string;
  accentColor: string;
  backgroundImageUrl: string | null;
  logoUrl: string | null;
  displayName: string;
  tagline: string;
};

type Props = {
  slug: string;
  settings: UiSettings;
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export default function BusinessLandingClient({ slug, settings }: Props) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [showManualHint, setShowManualHint] = useState(false);
    console.log('settings:', settings);
  const {
    primaryColor,
    accentColor,
    backgroundImageUrl,
    logoUrl,
    displayName,
    tagline,
  } = settings;

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
      setShowManualHint(false);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);


  const businessInitial =
    displayName.trim().charAt(0).toUpperCase() || 'B';

  return (
    <main
      className="min-h-screen text-slate-100 flex justify-center px-4 py-6"
      style={
        backgroundImageUrl
          ? {
              backgroundImage: `url(${backgroundImageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : { backgroundColor: '#020617' } // fallback dark
      }
    >
      <div className="w-full max-w-sm mx-auto flex flex-col items-center gap-6 bg-slate-950/85 border border-slate-900 rounded-3xl px-4 py-6 shadow-2xl shadow-black/70">
        {/* Avatar / logo + nombre */}
        <header className="flex flex-col items-center gap-3 mt-2">
          {logoUrl ? (
            <div className="w-16 h-16 rounded-full overflow-hidden shadow-lg shadow-black/40 border border-slate-800 bg-slate-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg shadow-black/40"
              style={{
                background: primaryColor,
                color: '#020617',
              }}
            >
              {businessInitial}
            </div>
          )}

          <div className="text-center space-y-1">
            <h1 className="text-base font-semibold tracking-wide">
              {displayName}
            </h1>
            <p className="text-[11px] text-slate-400">
              {tagline}
            </p>
          </div>
        </header>

        {/* Menú tipo linktree */}
        <section className="w-full space-y-3">
          {/* Reservar turno */}
          <Link
            href={`/${slug}/turnos`}
            className="block w-full rounded-2xl px-4 py-3 text-sm font-medium text-center shadow-md shadow-black/50 hover:shadow-lg transition-shadow"
            style={{
              backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
              color: '#020617',
            }}
          >
            Reservar turno online
          </Link>

          {/* Instalar app */}
          <InstallPwaButton/>
        </section>

        {/* Hint manual si no hay prompt */}
        {showManualHint && (
          <section className="w-full text-[11px] text-slate-400 border border-slate-800 rounded-xl px-3 py-2 bg-slate-900/60">
            <p className="font-medium text-slate-200 mb-1">
              ¿No aparece el botón de instalar?
            </p>
            <p>
              En la mayoría de los celulares podés agregar esta página a tu
              pantalla de inicio desde el menú del navegador (
              <span className="text-slate-200">“Agregar a inicio”</span> o
              similar).
            </p>
          </section>
        )}

        <footer className="mt-2 text-[10px] text-slate-500 text-center">
          Link para compartir:{' '}
          <span className="text-slate-200 font-mono">/{slug}</span>
        </footer>
      </div>
    </main>
  );
}
