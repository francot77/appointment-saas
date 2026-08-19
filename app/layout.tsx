import './globals.css';
import type { Metadata } from 'next';
import ServiceWorkerRegister from './ServiceWorkerRegister';
import { getSeoBaseUrl } from '@/lib/seo';

const siteUrl = getSeoBaseUrl();

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
    'Creá una página pública para tu negocio y recibí solicitudes de turnos online.',
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'FezTime – Agenda online',
    description:
      'Mostrá tus servicios, horarios y una forma clara de recibir solicitudes de turnos.',
    url: '/',
    siteName: 'FezTime',
    type: 'website',
    images: [{ url: '/icon-512.png', width: 512, height: 512, alt: 'FezTime' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FezTime – Agenda online',
    description: 'Una página pública y una agenda simple para negocios que trabajan con turnos.',
    images: ['/icon-512.png'],
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
