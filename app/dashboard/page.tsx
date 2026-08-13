// app/dashboard/page.tsx
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';
import { BrandConfig, DEFAULT_BRAND } from './types';
import { getCurrentBusiness } from '@/lib/currentBusiness';
// IMPORTA tu modelo / helper de settings
import { BusinessSettings } from '@/lib/models/BusinessSettings';
// o el nombre real que uses

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  let business;
  try {
    business = await getCurrentBusiness();
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') redirect('/login');
    throw err;
  }

  if (!business) {
    redirect('/login');
  }

  // Traer settings por businessId
  const settingsDoc = await BusinessSettings.findOne({
    businessId: business._id,
  }).lean();

  const brand: BrandConfig = {
    primary: settingsDoc?.primaryColor || DEFAULT_BRAND.primary,
    secondary: settingsDoc?.secondaryColor || settingsDoc?.gradientTo || DEFAULT_BRAND.secondary,
    textOnPrimary: settingsDoc?.textColor || DEFAULT_BRAND.textOnPrimary,
    background: settingsDoc?.backgroundColor || DEFAULT_BRAND.background,
  };

  const businessName = settingsDoc?.publicName || business.name;
  const avatarUrl = settingsDoc?.logoUrl || business.avatarUrl || null;

  return (
    <DashboardClient
      businessName={businessName}
      avatarUrl={avatarUrl}
      brand={brand}
    />
  );
}
