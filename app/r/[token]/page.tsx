// app/r/[token]/page.tsx
import MagicLinkClient from './MagicLinkClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Acceso a turno',
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ token: string }>;
};

export default async function MagicLinkPage(props: Props) {
  const params = await props.params;
  const { token } = params;

  return <MagicLinkClient token={token} />;
}
