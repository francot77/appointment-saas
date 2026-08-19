/* eslint-disable @typescript-eslint/no-explicit-any */
// app/[slug]/page.tsx
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import dbConnect from '@/lib/db';
import { getBusinessBySlug } from '@/lib/getBusinessBySlug';
import { Service } from '@/lib/models/Service';
import { BusinessSettings } from '@/lib/models/BusinessSettings';
import { getSeoBaseUrl } from '@/lib/seo';
import TurnosClient from '../TurnosClient';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  await dbConnect();
  const business: any = await getBusinessBySlug(slug);
  if (!business) return { title: 'Página no encontrada', robots: { index: false, follow: false } };
  const currentSlug = business.slug || slug;
  const name = String(business.name || 'Negocio').trim();
  return {
    title: `Reservar turno en ${name}`,
    description: `Elegí un servicio, fecha y horario para solicitar un turno en ${name}.`,
    robots: { index: false, follow: true },
    alternates: { canonical: `/${currentSlug}` },
    openGraph: { url: `${getSeoBaseUrl()}/${currentSlug}`, type: 'website' },
  };
}

export default async function PublicBusinessPage(props: Props) {
  const params = await props.params;
  const { slug } = params;

  await dbConnect();

  const business = await getBusinessBySlug(slug);
  if (!business) notFound();
  if ((business as any).slug && (business as any).slug !== slug) {
    redirect(`/${(business as any).slug}/turnos`);
  }

  // Servicios activos
  const servicesDocs = await Service.find({
    businessId: business._id,
    active: true,
  })
    .sort({ name: 1 })
    .lean();

  const services = servicesDocs.map((s: any) => ({
    id: String(s._id),
    name: s.name,
    durationMinutes: s.durationMinutes,
    price: s.price,
    color: s.color,
  }));

  // Settings del negocio (o defaults si no existen)
  let settingsDoc = await BusinessSettings.findOne({
    businessId: business._id,
  }).lean();

  if (!settingsDoc) {
    settingsDoc = await BusinessSettings.create({
      businessId: business._id,
      publicName: business.name,
      heroTitle: business.name,
      heroSubtitle: 'Reservá tus turnos online',
    }).then((doc) => doc.toJSON());
  }

  const settings = {
    id: String(settingsDoc._id),
    businessId: String(settingsDoc.businessId),
    publicName: settingsDoc.publicName ?? business.name,
    primaryColor: settingsDoc.primaryColor,
    secondaryColor: settingsDoc.secondaryColor,
    textColor: settingsDoc.textColor,
    backgroundType: settingsDoc.backgroundType,
    backgroundColor: settingsDoc.backgroundColor,
    gradientFrom: settingsDoc.gradientFrom,
    gradientTo: settingsDoc.gradientTo,
    backgroundImageUrl: settingsDoc.backgroundImageUrl,
    logoUrl: settingsDoc.logoUrl,
    heroTitle: settingsDoc.heroTitle,
    heroSubtitle: settingsDoc.heroSubtitle,
    ctaLabel: settingsDoc.ctaLabel,
    aboutEnabled: settingsDoc.aboutEnabled,
    aboutTitle: settingsDoc.aboutTitle,
    aboutText: settingsDoc.aboutText,
    whatsappNumber: settingsDoc.whatsappNumber,
    instagramHandle: settingsDoc.instagramHandle,
    address: settingsDoc.address,
  };

  return (
    <TurnosClient
      slug={slug}
      businessName={business.name}
      services={services}
      settings={settings}
    />
  );
}
