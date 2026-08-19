import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

export type EncryptionKeyring = {
  currentKeyId: string;
  keys: Record<string, string>;
};

export type SecretEnvelope = {
  version: 'v1';
  algorithm: 'aes-256-gcm';
  keyId: string;
  iv: string;
  authTag: string;
  ciphertext: string;
};

function keyBytes(keyring: EncryptionKeyring, keyId: string) {
  const encoded = keyring.keys[keyId];
  if (!encoded) throw new Error(`Unknown encryption key: ${keyId}`);
  const key = Buffer.from(encoded, 'base64');
  if (key.length !== 32) throw new Error('Encryption key must be 32 bytes');
  return key;
}

export function encryptSecret(value: string, keyring: EncryptionKeyring): SecretEnvelope {
  const keyId = keyring.currentKeyId;
  const key = keyBytes(keyring, keyId);
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return {
    version: 'v1',
    algorithm: 'aes-256-gcm',
    keyId,
    iv: iv.toString('base64url'),
    authTag: cipher.getAuthTag().toString('base64url'),
    ciphertext: ciphertext.toString('base64url'),
  };
}

export function decryptSecret(envelope: SecretEnvelope, keyring: EncryptionKeyring): string {
  try {
    if (envelope.version !== 'v1' || envelope.algorithm !== 'aes-256-gcm') throw new Error('unsupported');
    const decipher = createDecipheriv('aes-256-gcm', keyBytes(keyring, envelope.keyId), Buffer.from(envelope.iv, 'base64url'));
    decipher.setAuthTag(Buffer.from(envelope.authTag, 'base64url'));
    return Buffer.concat([decipher.update(Buffer.from(envelope.ciphertext, 'base64url')), decipher.final()]).toString('utf8');
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Unknown encryption key')) throw error;
    throw new Error('Invalid encrypted secret');
  }
}

export function getMessagingKeyring(env: NodeJS.ProcessEnv = process.env): EncryptionKeyring {
  const raw = env.MESSAGING_ENCRYPTION_KEYRING;
  if (!raw) throw new Error('Messaging encryption keyring is not configured');
  const keys = JSON.parse(raw) as Record<string, string>;
  const currentKeyId = env.MESSAGING_ENCRYPTION_KEY_ID;
  if (!currentKeyId) throw new Error('Messaging encryption key id is not configured');
  keyBytes({ currentKeyId, keys }, currentKeyId);
  return { currentKeyId, keys };
}
