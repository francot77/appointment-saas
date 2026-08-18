import './globals.css';
import type { Metadata } from 'next';
import ServiceWorkerRegister from './ServiceWorkerRegister';

const siteUrl = 'https://feztime.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'FezTime – Agenda online',
    template: '%s | FezTime',
  },
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' }
    ]
  },
  description:
    'Reservá turnos desde tu celular. Elegí servicio, fecha y horario y recibí la confirmación por WhatsApp.',
  openGraph: {
    title: 'FezTime – Agenda online',
    description:
      'Reservá turnos de forma simple: seleccioná servicio, fecha y horario desde tu celular.',
    url: '/',
    siteName: 'FezTime',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FezTime – Agenda online',
    description:
      'Reservá turnos desde tu celular con confirmación por WhatsApp.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <ServiceWorkerRegister />
      </head>
      <body>{children}</body>
    </html>
);
}
