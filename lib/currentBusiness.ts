/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/currentBusiness.ts
import dbConnect from '@/lib/db';
import { Business } from '@/lib/models/Business';
import { auth } from '@/lib/auth';


export async function getCurrentBusiness() {
  const session = await auth();
  if (!session?.user) {
    throw new Error('UNAUTHORIZED');
  }

  await dbConnect();

  const userId = (session.user as any).id;
  const business = await Business.findOne({ ownerUserId: userId }).lean();

  if (!business) {
    throw new Error('NO_BUSINESS');
  }

  return business;
}
