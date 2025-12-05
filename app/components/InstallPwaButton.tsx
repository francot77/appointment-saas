'use client';

import { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export function InstallPwaButton() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    function handler(e: Event) {
      e.preventDefault();
      const ev = e as BeforeInstallPromptEvent;
      setDeferredPrompt(ev);
      setAvailable(true);
    }

    // solo en client, obvio
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function handleClick() {
    if (!deferredPrompt) return;

    // dispara el prompt nativo del navegador
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    // Si aceptó, podrías esconder el botón
    if (choice.outcome === 'accepted') {
      setAvailable(false);
      setDeferredPrompt(null);
    }
  }

  if (!available) return null;

  return (
    <button
      type="button"
      onClick={handleClick}
      className="block w-full rounded-2xl px-4 py-3 text-sm font-medium text-center border border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
    >
      Instalar la app
    </button>
  );
}
