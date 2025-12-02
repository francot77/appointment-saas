// app/r/[token]/page.tsx
import MagicLinkClient from './MagicLinkClient';

type Props = {
  params: Promise<{ token: string }>;
};

export default async function MagicLinkPage(props: Props) {
  const params = await props.params;
  const { token } = params;

  return <MagicLinkClient token={token} />;
}
