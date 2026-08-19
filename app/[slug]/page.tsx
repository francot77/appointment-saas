/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import dbConnect from '@/lib/db';
import { getBusinessBySlug } from '@/lib/getBusinessBySlug';
import { BusinessSettings } from '@/lib/models/BusinessSettings';
import { escapeJsonLd, getSeoBaseUrl, toSafeAbsoluteUrl } from '@/lib/seo';
import BusinessLandingClient from './BusinessLandingClient';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  await dbConnect();
  const business: any = await getBusinessBySlug(slug);
  if (!business) {
    return { title: 'Página no encontrada', robots: { index: false, follow: false } };
  }

  const currentSlug = business.slug || slug;
  const settings: any = await BusinessSettings.findOne({ businessId: business._id }).lean() || {};
  const name = String(settings.publicName || business.name || 'Negocio').trim();
  const description = String(settings.heroSubtitle || business.tagline || `Solicitá un turno en ${name}.`).trim();
  const baseUrl = getSeoBaseUrl();
  const image = toSafeAbsoluteUrl(settings.logoUrl, baseUrl);

  return {
    title: `${name} | Turnos online`,
    description,
    alternates: { canonical: `/${currentSlug}` },
    openGraph: {
      title: `${name} | Turnos online`,
      description,
      url: `/${currentSlug}`,
      type: 'website',
      images: image ? [{ url: image, alt: name }] : undefined,
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title: `${name} | Turnos online`,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function PublicBusinessHome(props: Props) {
  const params = await props.params;
  const { slug } = params;

  await dbConnect();

  const business: any = await getBusinessBySlug(slug);
  if (!business) notFound();
  if (business.slug && business.slug !== slug) redirect(`/${business.slug}`);

  const settingsDoc: any =
    (await BusinessSettings.findOne({ businessId: business._id }).lean()) ||
    {};

  const uiSettings = {
    primaryColor: settingsDoc.primaryColor || '#6366F1',
    accentColor: settingsDoc.secondaryColor || '#E06B52',
    backgroundImageUrl: settingsDoc.backgroundImageUrl || null,
    backgroundType: settingsDoc.backgroundType || 'gradient',
    backgroundColor: settingsDoc.backgroundColor || null,
    gradientFrom: settingsDoc.gradientFrom || null,
    gradientTo: settingsDoc.gradientTo || null,
    logoUrl: settingsDoc.logoUrl || null,
    displayName: settingsDoc.publicName || business.name,
    tagline:
      settingsDoc.heroSubtitle ||
      business.tagline ||
      'Reservá tus turnos online',
    heroTitle: settingsDoc.heroTitle || null,
    ctaLabel: settingsDoc.ctaLabel || 'Reservar turno',
    aboutTitle: settingsDoc.aboutEnabled ? settingsDoc.aboutTitle || null : null,
    aboutText: settingsDoc.aboutEnabled ? settingsDoc.aboutText || null : null,
    whatsappNumber: settingsDoc.whatsappNumber || null,
    instagramHandle: settingsDoc.instagramHandle || null,
    address: settingsDoc.address || business.address || null,
    phone: business.phone || null,
  };

  const baseUrl = getSeoBaseUrl();
  const pageUrl = `${baseUrl}/${encodeURIComponent(String(business.slug || slug))}`;
  const logo = toSafeAbsoluteUrl(settingsDoc.logoUrl, baseUrl);
  const instagramHandle = String(settingsDoc.instagramHandle || '').replace(/^@/, '');
  const sameAs = /^[A-Za-z0-9._]+$/.test(instagramHandle)
    ? [`https://instagram.com/${instagramHandle}`]
    : undefined;
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: uiSettings.displayName,
    url: pageUrl,
    ...(uiSettings.tagline ? { description: uiSettings.tagline } : {}),
    ...(uiSettings.phone ? { telephone: uiSettings.phone } : {}),
    ...(uiSettings.address ? { address: { '@type': 'PostalAddress', streetAddress: uiSettings.address } } : {}),
    ...(sameAs ? { sameAs } : {}),
    ...(logo ? { logo } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: escapeJsonLd(structuredData) }} />
      <BusinessLandingClient slug={slug} settings={uiSettings} />
    </>
  );
}
