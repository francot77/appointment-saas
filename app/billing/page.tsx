/* eslint-disable @typescript-eslint/no-explicit-any */
// app/billing/page.tsx
import dbConnect from '@/lib/db';
import { getCurrentBusiness } from '@/lib/currentBusiness';
import BillingClient from './BillingClient';

export default async function BillingPage() {
  await dbConnect();

  const business: any = await getCurrentBusiness();

  const today = new Date();
  const paidUntil = business.paidUntil ? new Date(business.paidUntil) : null;

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-xl shadow p-6 space-y-4">
        <h1 className="text-lg font-semibold">Facturación</h1>
        <p className="text-sm text-slate-600">
          Plan actual: <span className="font-medium">Básico</span>
        </p>
        <p className="text-sm text-slate-600">
          Estado:{' '}
          <span className="font-medium">
            {business.status}
          </span>
        </p>
        <p className="text-sm text-slate-600">
          Pagado hasta:{' '}
          <span className="font-medium">
            {paidUntil ? paidUntil.toLocaleDateString('es-AR') : 'Sin pagos registrados'}
          </span>
        </p>

        <BillingClient />
      </div>
    </main>
  );
}
