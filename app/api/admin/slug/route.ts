import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getCurrentBusiness } from '@/lib/currentBusiness';
import { apiError } from '@/lib/apiError';
import { Business } from '@/lib/models/Business';
import { validateSlug } from '@/lib/slug';
import type { Types } from 'mongoose';

type CurrentBusiness = {
  _id: Types.ObjectId;
  slug: string;
  previousSlugs?: string[];
};

export async function GET(req: NextRequest) {
  try {
    const business = (await getCurrentBusiness({ requireEntitlement: true })) as unknown as CurrentBusiness;
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const candidate = searchParams.get('slug');

    if (!candidate) {
      return NextResponse.json(
        {
          slug: business.slug,
          previousSlugs: business.previousSlugs ?? [],
        },
        { status: 200 }
      );
    }

    const v = validateSlug(candidate);
    if (!v.ok) {
      return NextResponse.json(
        { available: false, error: v.error, code: v.code, slug: v.slug },
        { status: 200 }
      );
    }

    if (v.slug === business.slug) {
      return NextResponse.json(
        { available: true, slug: v.slug, code: 'OWN' },
        { status: 200 }
      );
    }

    const taken = await Business.findOne({
      _id: { $ne: business._id },
      $or: [{ slug: v.slug }, { previousSlugs: v.slug }],
    })
      .select({ _id: 1 })
      .lean();

    if (taken) {
      return NextResponse.json(
        { available: false, slug: v.slug, code: 'TAKEN', error: 'Slug no disponible' },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { available: true, slug: v.slug, code: 'AVAILABLE' },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '';
    if (message === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    if (message === 'NO_BUSINESS') return apiError('No business', 403);
    if (message === 'BILLING_REQUIRED') return apiError('Billing required', 402, 'FORBIDDEN');
    return apiError('Internal error', 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const business = (await getCurrentBusiness({ requireEntitlement: true })) as unknown as CurrentBusiness;
    await dbConnect();

    const body = (await req.json().catch(() => ({}))) as unknown;
    const candidate =
      typeof body === 'object' && body !== null
        ? (body as Record<string, unknown>).slug
        : undefined;
    const v = validateSlug(candidate);
    if (!v.ok) return apiError(v.error, 400);

    if (v.slug === business.slug) {
      return NextResponse.json(
        { ok: true, slug: business.slug, previousSlugs: business.previousSlugs ?? [] },
        { status: 200 }
      );
    }

    const taken = await Business.findOne({
      _id: { $ne: business._id },
      $or: [{ slug: v.slug }, { previousSlugs: v.slug }],
    })
      .select({ _id: 1 })
      .lean();

    if (taken) return apiError('Slug no disponible', 409);

    await Business.updateOne(
      { _id: business._id },
      {
        $set: { slug: v.slug },
        $addToSet: { previousSlugs: business.slug },
        $pull: { previousSlugs: v.slug },
      }
    );

    const updated = await Business.findById(business._id).lean();

    return NextResponse.json(
      {
        ok: true,
        slug: updated?.slug ?? v.slug,
        previousSlugs: updated?.previousSlugs ?? [],
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '';
    if (message === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    if (message === 'NO_BUSINESS') return apiError('No business', 403);
    if (message === 'BILLING_REQUIRED') return apiError('Billing required', 402, 'FORBIDDEN');

    const code =
      typeof err === 'object' && err !== null && 'code' in err
        ? (err as { code?: unknown }).code
        : undefined;
    if (code === 11000) return apiError('Slug no disponible', 409);

    return apiError('Internal error', 500);
  }
}
