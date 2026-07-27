import bcrypt from 'bcrypt';
import { createHash, randomInt } from 'crypto';
import { env } from '@config/env';

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, env.BCRYPT_SALT_ROUNDS);
}

export function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function hashOtp(otp: string): Promise<string> {
  return bcrypt.hash(otp, env.BCRYPT_SALT_ROUNDS);
}

export function compareOtp(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** SHA-256 for high-entropy opaque tokens (refresh tokens) — fast O(1) lookup by hash. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generateNumericOtp(length: number): string {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  return randomInt(min, max + 1).toString().padStart(length, '0');
}
