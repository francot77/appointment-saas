import { beforeEach, describe, expect, it, vi } from 'vitest';

const { dbConnect } = vi.hoisted(() => ({ dbConnect: vi.fn() }));

vi.mock('@/lib/db', () => ({ default: dbConnect }));

import { GET } from '@/app/api/health/route';

describe('GET /api/health', () => {
  beforeEach(() => {
    dbConnect.mockReset();
  });

  it('returns readiness without exposing connection details when the database is ready', async () => {
    dbConnect.mockResolvedValue({ connection: { readyState: 1 } });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: 'ok',
      checks: { database: 'ok' },
    });
  });

  it('returns a safe error response when database connectivity fails', async () => {
    dbConnect.mockRejectedValue(new Error('mongodb://secret.example.test'));

    const response = await GET();

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      status: 'unavailable',
      checks: { database: 'unavailable' },
    });
  });
});
