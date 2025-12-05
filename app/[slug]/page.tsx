/* eslint-disable @typescript-eslint/no-explicit-any */
// app/[slug]/page.tsx
import { notFound } from 'next/navigation';
import dbConnect from '@/lib/db';
import { Business } from '@/lib/models/Business';
import { BusinessSettings } from '@/lib/models/BusinessSettings';
import BusinessLandingClient from './BusinessLandingClient';

type Props = { params: Promise<{ slug: string }> };

export default async function PublicBusinessHome(props: Props) {
  const params = await props.params;
  const { slug } = params;

  await dbConnect();

  const business: any = await Business.findOne({ slug }).lean();
  if (!business) notFound();

  const settingsDoc: any =
    (await BusinessSettings.findOne({ businessId: business._id }).lean()) ||
    {};

  const uiSettings = {
    primaryColor: settingsDoc.primaryColor || '#6366F1',
    accentColor: settingsDoc.accentColor || '#22C55E',
    backgroundImageUrl: settingsDoc.backgroundImageUrl || null,
    logoUrl: settingsDoc.logoUrl || null,
    displayName: settingsDoc.publicName || business.name,
    tagline:
      settingsDoc.tagline ||
      business.tagline ||
      'Reservá tus turnos online',
  };

  return (
    <BusinessLandingClient
      slug={slug}
      settings={uiSettings}
    />
  );
}
