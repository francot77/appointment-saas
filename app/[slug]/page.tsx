/* eslint-disable @typescript-eslint/no-explicit-any */
// app/[slug]/page.tsx
import { notFound, redirect } from 'next/navigation';
import dbConnect from '@/lib/db';
import { getBusinessBySlug } from '@/lib/getBusinessBySlug';
import { BusinessSettings } from '@/lib/models/BusinessSettings';
import BusinessLandingClient from './BusinessLandingClient';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

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

  return (
    <BusinessLandingClient
      slug={slug}
      settings={uiSettings}
    />
  );
}
