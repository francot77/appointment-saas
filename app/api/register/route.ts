import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User } from '@/lib/models/User';
import { Business } from '@/lib/models/Business';
import { hash } from 'bcryptjs';

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export async function POST(req: NextRequest) {
  await dbConnect();
  const { name, email, password, businessName, phone, address } = await req.json();

  if (!email || !password || !businessName) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
  }

  const exists = await User.findOne({ email });
  if (exists) {
    return NextResponse.json({ error: 'Email ya registrado' }, { status: 400 });
  }

  const passwordHash = await hash(password, 10);
  const user = await User.create({ email, name, passwordHash });

  const slugBase = slugify(businessName);
  let slug = slugBase;
  let i = 1;
  while (await Business.findOne({ slug })) {
    slug = `${slugBase}-${i++}`;
  }

  const now = new Date();
const trialDays = 14;
const paidUntil = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

await Business.create({
  ownerUserId: user._id,
  name: businessName,
  phone,
  address,
  slug,
  plan: 'basic',
  status: 'trial',
  paidUntil,
});


  return NextResponse.json({ ok: true }, { status: 201 });
}
