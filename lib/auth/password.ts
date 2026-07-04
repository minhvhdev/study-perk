import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const SALT_BYTES = 16;
const KEY_LENGTH = 64;

export async function hashPassword(password: string) {
  const salt = randomBytes(SALT_BYTES).toString('hex');
  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  return `${salt}:${derivedKey.toString('hex')}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [salt, hash] = storedHash.split(':');

  if (!salt || !hash) {
    return false;
  }

  const expected = Buffer.from(hash, 'hex');
  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;

  if (expected.length !== derivedKey.length) {
    return false;
  }

  return timingSafeEqual(expected, derivedKey);
}
