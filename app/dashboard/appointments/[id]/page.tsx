import AppointmentDetailClient from './AppointmentDetailClient';

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AppointmentDetailClient id={id} />;
}
