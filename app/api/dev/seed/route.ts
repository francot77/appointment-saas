import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User } from '@/lib/models/User';
import { Business } from '@/lib/models/Business';
import { BusinessSettings } from '@/lib/models/BusinessSettings';
import { Service } from '@/lib/models/Service';
import { ScheduleDay } from '@/lib/models/ScheduleDay';
import { Appointment } from '@/lib/models/Appointment';
import { Payment } from '@/lib/models/Payments';
import { hash } from 'bcryptjs';

export const runtime = 'nodejs';

function toDateStr(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function mondayOfWeek(d: Date) {
  const day = d.getDay();
  const diffToMonday = (day + 6) % 7;
  const monday = new Date(d);
  monday.setDate(d.getDate() - diffToMonday);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function addDays(d: Date, delta: number) {
  const next = new Date(d);
  next.setDate(d.getDate() + delta);
  return next;
}

function minutesToTime(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

type SeedRequest = {
  reset?: boolean;
  email?: string;
  password?: string;
  businessName?: string;
  slug?: string;
  counts?: {
    historical?: number;
    week?: number;
    busyDay?: number;
  };
};

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'NOT_ALLOWED' }, { status: 403 });
  }
  const body = (await req.json().catch(() => ({}))) as SeedRequest;

  try {
    await dbConnect();

    const reset = body.reset === true;
    const email = body.email ?? 'seed-admin@feztime.local';
    const password = body.password ?? 'seed-password';
    const businessName = body.businessName ?? 'FezTime Seed Business';
    const slug = body.slug ?? 'feztime-seed';

    const historicalCount = body.counts?.historical ?? 50;
    const weekCount = body.counts?.week ?? 20;
    const busyDayCount = body.counts?.busyDay ?? 10;

    let user = await User.findOne({ email });
    if (!user) {
      const passwordHash = await hash(password, 10);
      user = await User.create({ email, name: 'Seed Admin', passwordHash });
    }

    let business = await Business.findOne({ slug });
    if (!business) {
      const now = new Date();
      const trialDays = 14;
      const paidUntil = new Date(
        now.getTime() + trialDays * 24 * 60 * 60 * 1000
      );
      business = await Business.create({
        ownerUserId: user._id,
        name: businessName,
        slug,
        plan: 'basic',
        status: 'trial',
        paidUntil,
      });
    } else if (String(business.ownerUserId) !== String(user._id)) {
      await Business.updateOne(
        { _id: business._id },
        { $set: { ownerUserId: user._id } }
      );
      business = await Business.findById(business._id);
    }

    if (!business) {
      return NextResponse.json(
        { error: 'BUSINESS_CREATE_FAILED' },
        { status: 500 }
      );
    }

    if (reset) {
      await Promise.all([
        Appointment.deleteMany({ businessId: business._id }),
        ScheduleDay.deleteMany({ businessId: business._id }),
        Service.deleteMany({ businessId: business._id }),
        BusinessSettings.deleteMany({ businessId: business._id }),
        Payment.deleteMany({ businessId: business._id }),
      ]);
    }

    let settings = await BusinessSettings.findOne({ businessId: business._id });
    if (!settings) {
      settings = await BusinessSettings.create({
        businessId: business._id,
        publicName: business.name,
        heroTitle: business.name,
        heroSubtitle: 'Reservá tus turnos online',
        ctaLabel: 'Reservar turno',
      });
    }

    const existingServices = await Service.find({
      businessId: business._id,
    }).lean();
    if (existingServices.length === 0) {
      await Service.insertMany([
        {
          businessId: business._id,
          name: 'Corte (15 min)',
          durationMinutes: 15,
          price: 5000,
          color: '#38bdf8',
          active: true,
        },
        {
          businessId: business._id,
          name: 'Corte + Barba (30 min)',
          durationMinutes: 30,
          price: 8000,
          color: '#a78bfa',
          active: true,
        },
        {
          businessId: business._id,
          name: 'Color (60 min)',
          durationMinutes: 60,
          price: 15000,
          color: '#fb7185',
          active: true,
        },
      ]);
    }

    const services = await Service.find({
      businessId: business._id,
      active: true,
    })
      .sort({ durationMinutes: 1 })
      .lean();

    const serviceShort = services[0];
    const serviceMedium = services.find((s) => s.durationMinutes === 30) ?? services[0];

    const existingDays = await ScheduleDay.find({
      businessId: business._id,
    }).lean();
    if (existingDays.length === 0) {
      const weekdays = [1, 2, 3, 4, 5];
      await ScheduleDay.insertMany(
        weekdays.map((weekday) => ({
          businessId: business._id,
          weekday,
          blocks: [
            { start: '09:00', end: '12:00', enabled: true },
            { start: '14:00', end: '19:00', enabled: true },
          ],
        }))
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekStart = mondayOfWeek(today);
    const busyDay = addDays(weekStart, 2);

    const existingAppts = await Appointment.countDocuments({
      businessId: business._id,
    });
    if (existingAppts === 0) {
      const historicalBase = addDays(weekStart, -90);
      const appts = [];

      for (let i = 0; i < historicalCount; i++) {
        const d = addDays(historicalBase, i % 60);
        const date = toDateStr(d);
        const startMins = 9 * 60 + (i % 12) * 30;
        const duration = 30;
        appts.push({
          businessId: business._id,
          clientName: `Hist ${i + 1}`,
          clientPhone: `+54911${String(10000000 + i).slice(0, 8)}`,
          serviceId: serviceMedium?._id ?? services[0]?._id,
          date,
          startTime: minutesToTime(startMins),
          endTime: minutesToTime(startMins + duration),
          status: i % 10 === 0 ? 'cancelled' : 'confirmed',
          notes: '',
        });
      }

      for (let i = 0; i < weekCount; i++) {
        const d = addDays(weekStart, i % 7);
        const date = toDateStr(d);
        const startMins = 14 * 60 + (i % 8) * 30;
        const duration = 30;
        appts.push({
          businessId: business._id,
          clientName: `Week ${i + 1}`,
          clientPhone: `+54911${String(20000000 + i).slice(0, 8)}`,
          serviceId: serviceMedium?._id ?? services[0]?._id,
          date,
          startTime: minutesToTime(startMins),
          endTime: minutesToTime(startMins + duration),
          status: i % 5 === 0 ? 'request' : 'confirmed',
          notes: '',
        });
      }

      for (let i = 0; i < busyDayCount; i++) {
        const date = toDateStr(busyDay);
        const startMins = 9 * 60 + i * 30;
        const duration = 30;
        appts.push({
          businessId: business._id,
          clientName: `Busy ${i + 1}`,
          clientPhone: `+54911${String(30000000 + i).slice(0, 8)}`,
          serviceId: serviceShort?._id ?? services[0]?._id,
          date,
          startTime: minutesToTime(startMins),
          endTime: minutesToTime(startMins + duration),
          status: 'confirmed',
          notes: '',
        });
      }

      await Appointment.insertMany(appts);
    }

    return NextResponse.json(
      {
        ok: true,
        credentials: { email, password },
        business: {
          id: String(business._id),
          name: business.name,
          slug: business.slug,
        },
        settingsId: String(settings._id),
        services: services.map((s) => ({
          id: String(s._id),
          name: s.name,
          durationMinutes: s.durationMinutes,
          active: s.active,
        })),
        scheduleDays: await ScheduleDay.countDocuments({ businessId: business._id }),
        appointments: await Appointment.countDocuments({ businessId: business._id }),
        examples: {
          publicLanding: `http://localhost:3000/${business.slug}`,
          publicTurnos: `http://localhost:3000/${business.slug}/turnos`,
          availabilityQuery: `http://localhost:3000/api/public/${business.slug}/availability?date=${toDateStr(busyDay)}&serviceId=${String(serviceShort?._id ?? services[0]?._id)}`,
        },
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'UNKNOWN';
    if (message.includes('MONGODB_URI')) {
      return NextResponse.json(
        { error: 'MONGODB_URI_MISSING', message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'SEED_ERROR', message },
      { status: 500 }
    );
  }
}
