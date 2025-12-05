import './globals.css';
import type { Metadata } from 'next';
import ServiceWorkerRegister from './ServiceWorkerRegister';
import { Analytics } from '@vercel/analytics/next';

const siteUrl = 'https://atomicanails.vercel.app'; // TODO: cambiá por tu dominio real

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'TurnosYa – Agenda de turnos online',
    template: '%s | TurnosYa',
  }, manifest: '/manifest.webmanifest',
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
    title: 'TurnosYa – Agenda de turnos online',
    description:
      'Pedí tu turno de uñas de forma simple: seleccioná servicio, fecha y horario desde tu celular.',
    url: '/',
    siteName: 'TurnosYa',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TurnosYa – Agenda de turnos online',
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
        <Analytics />
        <ServiceWorkerRegister />
      </head>
      <body>{children}</body>
    </html>
);
}
