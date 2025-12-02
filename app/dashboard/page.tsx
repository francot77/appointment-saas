/* eslint-disable @typescript-eslint/no-explicit-any */
// app/dashboard/page.tsx
import dbConnect from '@/lib/db';
import { getCurrentBusiness } from '@/lib/currentBusiness';
import DashboardClient from './DashboardClient';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  await dbConnect();

  const business: any = await getCurrentBusiness();

  if (!business) {
    redirect('/register'); // o onboarding si lo hacés después
  }

  const today = new Date();

  const hasAccess =
    (business.status === 'trial' || business.status === 'active') &&
    business.paidUntil &&
    new Date(business.paidUntil) >= today;

  if (!hasAccess) {
    redirect('/billing');
  }

  return <DashboardClient businessName={business.name} />;
}
