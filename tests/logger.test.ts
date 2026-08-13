import { afterEach, describe, expect, it, vi } from 'vitest';
import { logger } from '@/lib/logger';

describe('structured logger', () => {
  afterEach(() => vi.restoreAllMocks());

  it('emits allowlisted context without unsafe fields', () => {
    const output = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    logger.info('booking.created', { businessId: 'business-1', status: 'request', clientPhone: '+5491112345678', body: 'sensitive' });
    const entry = JSON.parse(output.mock.calls[0][0] as string);
    expect(entry).toMatchObject({ level: 'info', event: 'booking.created', context: { businessId: 'business-1', status: 'request' } });
    expect(entry.context).not.toHaveProperty('clientPhone');
    expect(entry.context).not.toHaveProperty('body');
  });
});
