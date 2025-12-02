// app/api/admin/settings/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getCurrentBusiness } from '@/lib/currentBusiness';
import { apiError } from '@/lib/apiError';
import { BusinessSettings } from '@/lib/models/BusinessSettings';

export async function GET() {
  try {
    const business = await getCurrentBusiness();
    await dbConnect();

    let settings = await BusinessSettings.findOne({
      businessId: business._id,
    }).lean();

    if (!settings) {
      // crear con defaults, usando datos del negocio
      settings = await BusinessSettings.create({
        businessId: business._id,
        publicName: business.name, // asumiendo que Business tiene name
        heroTitle: business.name,
        heroSubtitle: 'Reservá tus turnos online',
      }).then((doc) => doc.toJSON());
    }

    return NextResponse.json(
      {
        settings: {
          id: String(settings._id),
          businessId: String(settings.businessId),
          publicName: settings.publicName ?? '',
          primaryColor: settings.primaryColor,
          secondaryColor: settings.secondaryColor,
          textColor: settings.textColor,
          backgroundType: settings.backgroundType,
          backgroundColor: settings.backgroundColor,
          gradientFrom: settings.gradientFrom,
          gradientTo: settings.gradientTo,
          backgroundImageUrl: settings.backgroundImageUrl,
          logoUrl: settings.logoUrl,
          heroTitle: settings.heroTitle,
          heroSubtitle: settings.heroSubtitle,
          ctaLabel: settings.ctaLabel,
          aboutEnabled: settings.aboutEnabled,
          aboutTitle: settings.aboutTitle,
          aboutText: settings.aboutText,
          whatsappNumber: settings.whatsappNumber,
          instagramHandle: settings.instagramHandle,
          address: settings.address,
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    if (err.message === 'NO_BUSINESS') return apiError('No business', 403);
    console.error('GET /admin/settings error', err);
    return apiError('Internal error', 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const business = await getCurrentBusiness();
    await dbConnect();

    const body = await req.json();

    const allowedFields = [
      'publicName',
      'primaryColor',
      'secondaryColor',
      'textColor',
      'backgroundType',
      'backgroundColor',
      'gradientFrom',
      'gradientTo',
      'backgroundImageUrl',
      'logoUrl',
      'heroTitle',
      'heroSubtitle',
      'ctaLabel',
      'aboutEnabled',
      'aboutTitle',
      'aboutText',
      'whatsappNumber',
      'instagramHandle',
      'address',
    ];

    const update: any = {};
    for (const key of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        update[key] = body[key];
      }
    }

    const settings = await BusinessSettings.findOneAndUpdate(
      { businessId: business._id },
      { $set: update },
      { upsert: true, new: true }
    ).lean();

    return NextResponse.json(
      {
        settings: {
          id: String(settings._id),
          businessId: String(settings.businessId),
          publicName: settings.publicName ?? '',
          primaryColor: settings.primaryColor,
          secondaryColor: settings.secondaryColor,
          textColor: settings.textColor,
          backgroundType: settings.backgroundType,
          backgroundColor: settings.backgroundColor,
          gradientFrom: settings.gradientFrom,
          gradientTo: settings.gradientTo,
          backgroundImageUrl: settings.backgroundImageUrl,
          logoUrl: settings.logoUrl,
          heroTitle: settings.heroTitle,
          heroSubtitle: settings.heroSubtitle,
          ctaLabel: settings.ctaLabel,
          aboutEnabled: settings.aboutEnabled,
          aboutTitle: settings.aboutTitle,
          aboutText: settings.aboutText,
          whatsappNumber: settings.whatsappNumber,
          instagramHandle: settings.instagramHandle,
          address: settings.address,
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    if (err.message === 'NO_BUSINESS') return apiError('No business', 403);
    console.error('PUT /admin/settings error', err);
    return apiError('Internal error', 500);
  }
}
