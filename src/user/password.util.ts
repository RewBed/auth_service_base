import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEY_LENGTH = 64;

export function hashPassword(rawValue: string): string {
  const salt = randomBytes(16);
  const derivedKey = scryptSync(rawValue, salt, SCRYPT_KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });

  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString('hex')}$${derivedKey.toString('hex')}`;
}

export function verifyPassword(
  rawValue: string,
  passwordHash: string,
): boolean {
  if (!passwordHash.startsWith('scrypt$')) {
    return safeEqual(rawValue, passwordHash);
  }

  try {
    const parts = passwordHash.split('$');
    if (parts.length !== 6) {
      return false;
    }

    const n = Number(parts[1]);
    const r = Number(parts[2]);
    const p = Number(parts[3]);
    const salt = Buffer.from(parts[4], 'hex');
    const expectedHash = Buffer.from(parts[5], 'hex');

    if (
      !Number.isFinite(n) ||
      !Number.isFinite(r) ||
      !Number.isFinite(p) ||
      expectedHash.length === 0
    ) {
      return false;
    }

    const derivedHash = scryptSync(rawValue, salt, expectedHash.length, {
      N: n,
      r,
      p,
    });
    return timingSafeEqual(derivedHash, expectedHash);
  } catch {
    return false;
  }
}

function safeEqual(raw: string, stored: string): boolean {
  const rawBuffer = Buffer.from(raw, 'utf8');
  const storedBuffer = Buffer.from(stored, 'utf8');

  if (rawBuffer.length !== storedBuffer.length) {
    return false;
  }

  return timingSafeEqual(rawBuffer, storedBuffer);
}
