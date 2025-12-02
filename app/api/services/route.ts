import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Service } from '@/lib/models/Service';

export async function GET(req: NextRequest) {
  await dbConnect();

  const services = await Service.find({ active: true }).sort({ name: 1 });

  return NextResponse.json(
    services.map((s) => ({
      id: s._id.toString(),
      name: s.name,
      durationMinutes: s.durationMinutes,
      price: s.price,
      color: s.color,
    })),
    { status: 200 }
  );
}
