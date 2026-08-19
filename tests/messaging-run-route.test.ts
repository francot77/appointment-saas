/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from 'vitest';

const { runMongoMessageWorker, timingSafeSecretEquals, createConfiguredMessageSender, configuredSender } = vi.hoisted(() => ({
  runMongoMessageWorker: vi.fn(async (send: (job: unknown) => Promise<unknown>) => {
    await send({ businessId: 'tenant-a' });
    return { processed: 20 };
  }),
  timingSafeSecretEquals: vi.fn((actual: string, expected: string) => actual === expected),
  configuredSender: vi.fn(async () => ({ providerMessageId: 'wamid.1' })),
  createConfiguredMessageSender: vi.fn(async () => configuredSender),
}));

vi.mock('@/lib/messaging/worker', () => ({ runMongoMessageWorker, timingSafeSecretEquals }));
vi.mock('@/lib/messaging/connection', () => ({ createConfiguredMessageSender }));

import { GET } from '@/app/api/internal/messaging/run/route';

describe('internal messaging scheduler route', () => {
  it('rejects missing or invalid bearer secrets', async () => {
    vi.stubEnv('INTERNAL_MESSAGING_RUN_SECRET', 'scheduler-secret');
    const response = await GET(new Request('http://localhost/api/internal/messaging/run') as any);
    expect(response.status).toBe(401);
    expect(runMongoMessageWorker).not.toHaveBeenCalled();
  });

  it('runs the bounded worker only with the configured bearer secret', async () => {
    vi.stubEnv('INTERNAL_MESSAGING_RUN_SECRET', 'scheduler-secret');
    const response = await GET(new Request('http://localhost/api/internal/messaging/run', {
      headers: { authorization: 'Bearer scheduler-secret' },
    }) as any);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ processed: 20 });
    expect(runMongoMessageWorker).toHaveBeenCalledTimes(1);
    expect(createConfiguredMessageSender).toHaveBeenCalledTimes(1);
    expect(configuredSender).toHaveBeenCalledWith({ businessId: 'tenant-a' });
  });
});
