import { describe, expect, it } from 'vitest';
import {
  decryptSecret,
  encryptSecret,
  type EncryptionKeyring,
} from '@/lib/messaging/crypto';
import {
  redactMessagingConnection,
  type MessagingConnectionSecret,
} from '@/lib/messaging/connection';

const keyring: EncryptionKeyring = {
  currentKeyId: 'key-2026-08',
  keys: {
    'key-2026-08': Buffer.alloc(32, 7).toString('base64'),
    'key-2026-07': Buffer.alloc(32, 8).toString('base64'),
  },
};

describe('messaging connection encryption', () => {
  it('round-trips a secret and records the active key id', () => {
    const envelope = encryptSecret('EAAB-access-token', keyring);

    expect(envelope.keyId).toBe('key-2026-08');
    expect(envelope.algorithm).toBe('aes-256-gcm');
    expect(decryptSecret(envelope, keyring)).toBe('EAAB-access-token');
  });

  it('rejects tampering and can read an older rotation key', () => {
    const oldEnvelope = encryptSecret('old-token', { ...keyring, currentKeyId: 'key-2026-07' });
    const tampered = { ...oldEnvelope, ciphertext: `${oldEnvelope.ciphertext.slice(0, -1)}A` };

    expect(decryptSecret(oldEnvelope, keyring)).toBe('old-token');
    expect(() => decryptSecret(tampered, keyring)).toThrow('Invalid encrypted secret');
  });

  it('rejects unknown key ids and malformed key material', () => {
    const envelope = encryptSecret('token', keyring);

    expect(() => decryptSecret({ ...envelope, keyId: 'retired' }, keyring)).toThrow('Unknown encryption key');
    expect(() => encryptSecret('token', { currentKeyId: 'bad', keys: { bad: 'not-base64' } })).toThrow(
      'Encryption key must be 32 bytes',
    );
  });
});

describe('messaging connection public boundary', () => {
  it('redacts encrypted and provider secret fields while preserving tenant-safe metadata', () => {
    const connection: MessagingConnectionSecret = {
      _id: 'connection-1',
      businessId: 'tenant-a',
      provider: 'meta_whatsapp_cloud',
      phoneNumberId: 'phone-1',
      wabaId: 'waba-1',
      enabled: true,
      accessTokenEnvelope: encryptSecret('EAAB-secret', keyring),
      appSecretEnvelope: encryptSecret('app-secret', keyring),
      templates: [{ event: 'confirmed', name: 'appointment_confirmed', language: 'es_AR', status: 'APPROVED' }],
      leadTimeMinutes: 60,
    };

    const safe = redactMessagingConnection(connection);

    expect(safe).toEqual({
      id: 'connection-1',
      businessId: 'tenant-a',
      provider: 'meta_whatsapp_cloud',
      phoneNumberId: 'phone-1',
      wabaId: 'waba-1',
      enabled: true,
      status: 'connected',
      templates: connection.templates,
      leadTimeMinutes: 60,
      hasAccessToken: true,
      hasAppSecret: true,
    });
    expect(JSON.stringify(safe)).not.toContain('EAAB-secret');
    expect(JSON.stringify(safe)).not.toContain('app-secret');
  });
});
