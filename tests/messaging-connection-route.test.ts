import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  business: vi.fn(),
  findOne: vi.fn(),
  findOneAndUpdate: vi.fn(),
  dbConnect: vi.fn(),
}));

vi.mock('@/lib/currentBusiness', () => ({ getCurrentBusiness: mocks.business }));
vi.mock('@/lib/db', () => ({ default: mocks.dbConnect }));
vi.mock('@/lib/models/MessagingConnection', () => ({ MessagingConnection: { findOne: mocks.findOne, findOneAndUpdate: mocks.findOneAndUpdate } }));
vi.mock('@/lib/messaging/crypto', () => ({
  getMessagingKeyring: () => ({ currentKeyId: 'test', keys: { test: Buffer.alloc(32, 1).toString('base64') } }),
  encryptSecret: (value: string) => ({ version: 'v1', algorithm: 'aes-256-gcm', keyId: 'test', iv: 'iv', authTag: 'tag', ciphertext: value }),
}));

import { GET, PUT } from '@/app/api/admin/messaging/connection/route';

describe('messaging connection tenant boundary', () => {
  it('requires the authenticated entitled tenant for reads', async () => {
    mocks.business.mockRejectedValueOnce(new Error('UNAUTHORIZED'));

    const response = await GET();

    expect(response.status).toBe(401);
    expect(mocks.findOne).not.toHaveBeenCalled();
  });

  it('queries and writes only the entitled business id and never returns the access token', async () => {
    mocks.business.mockResolvedValue({ _id: 'tenant-a' });
    mocks.findOne.mockReturnValue({ lean: () => Promise.resolve({
      _id: 'connection-a', businessId: 'tenant-a', provider: 'meta_whatsapp_cloud', phoneNumberId: 'phone-a', wabaId: 'waba-a',
      enabled: true, accessTokenEnvelope: { ciphertext: 'secret' }, templates: [], leadTimeMinutes: 60,
    }) });
    mocks.findOneAndUpdate.mockReturnValue({ lean: () => Promise.resolve({
      _id: 'connection-a', businessId: 'tenant-a', provider: 'meta_whatsapp_cloud', phoneNumberId: 'phone-a', wabaId: 'waba-a',
      enabled: true, accessTokenEnvelope: { ciphertext: 'secret' }, templates: [], leadTimeMinutes: 60,
    }) });

    const getResponse = await GET();
    const getJson = await getResponse.json();
    expect(mocks.findOne).toHaveBeenCalledWith({ businessId: 'tenant-a' });
    expect(getJson.connection).toMatchObject({ businessId: 'tenant-a', hasAccessToken: true });
    expect(JSON.stringify(getJson)).not.toContain('secret');

    const putResponse = await PUT(new Request('http://localhost/api/admin/messaging/connection', {
      method: 'PUT', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phoneNumberId: 'phone-a', wabaId: 'waba-a', accessToken: 'secret', enabled: true }),
    }) as never);
    expect(putResponse.status).toBe(200);
    expect(mocks.findOneAndUpdate).toHaveBeenCalledWith(
      { businessId: 'tenant-a' }, expect.anything(), expect.objectContaining({ upsert: true }),
    );
  });
});
