import type { MetadataRoute } from 'next';
import { Business } from '@/lib/models/Business';
import dbConnect from '@/lib/db';
import { validateSlug } from '@/lib/slug';
import { getSeoBaseUrl } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSeoBaseUrl();
  await dbConnect();

  const businesses = await Business.find({ status: { $in: ['trial', 'active'] } })
    .select({ slug: 1, updatedAt: 1 })
    .lean();

  const businessUrls = businesses.flatMap((business) => {
    const validation = validateSlug(business.slug);
    if (!validation.ok || validation.slug !== business.slug) return [];

    return [{
      url: `${baseUrl}/${encodeURIComponent(business.slug)}`,
      lastModified: business.updatedAt,
    }];
  });

  return [{ url: `${baseUrl}/` }, ...businessUrls];
}
