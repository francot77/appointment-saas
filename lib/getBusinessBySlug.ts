import dbConnect from '@/lib/db';
import { Business } from '@/lib/models/Business';

export async function getBusinessBySlug(slug: string) {
  await dbConnect();
  const business = await Business.findOne({ slug }).lean();
  return business;
}
