import dbConnect from '@/lib/db';
import { Business } from '@/lib/models/Business';
import { normalizeSlugInput } from '@/lib/slug';

export async function getBusinessBySlug(slug: string) {
  await dbConnect();
  const normalized = normalizeSlugInput(slug);
  const business = await Business.findOne({
    $or: [{ slug: normalized }, { previousSlugs: normalized }],
  }).lean();
  return business;
}