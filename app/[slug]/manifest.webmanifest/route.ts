import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getBusinessBySlug } from '@/lib/getBusinessBySlug';
import { BusinessSettings } from '@/lib/models/BusinessSettings';
import { getSeoBaseUrl, toSafeAbsoluteUrl } from '@/lib/seo';

type Params = { params: Promise<{ slug: string }> };

function color(value: unknown, fallback: string) {
  return typeof value === 'string' && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim()) ? value.trim() : fallback;
}

export async function GET(_request: Request, props: Params) {
  const { slug } = await props.params;
  await dbConnect();
  const business = await getBusinessBySlug(slug);
  if (!business) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const settings = await BusinessSettings.findOne({ businessId: business._id }).lean() || {};
  const currentSlug = String(business.slug || slug);
  const name = String(settings.publicName || business.name || 'Negocio').trim();
  const baseUrl = new URL(getSeoBaseUrl());
  const logo = toSafeAbsoluteUrl(settings.logoUrl, baseUrl.origin);
  const primaryColor = color(settings.primaryColor, '#334e68');
  const backgroundColor = color(settings.backgroundColor, '#fbf8f1');
  const icon = logo || new URL('/web-app-manifest-192x192.png', baseUrl).toString();
  const largeIcon = logo || new URL('/web-app-manifest-512x512.png', baseUrl).toString();

  return NextResponse.json({
    id: `/${currentSlug}/`,
    name,
    short_name: name.slice(0, 30),
    start_url: `/${currentSlug}/turnos`,
    scope: `/${currentSlug}/`,
    display: 'standalone',
    theme_color: primaryColor,
    background_color: backgroundColor,
    icons: [
      { src: icon, sizes: '192x192', type: logo ? 'image/*' : 'image/png', purpose: 'any maskable' },
      { src: largeIcon, sizes: '512x512', type: logo ? 'image/*' : 'image/png', purpose: 'any maskable' },
    ],
  }, { headers: { 'Cache-Control': 'no-store' } });
}
