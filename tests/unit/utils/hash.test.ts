import { hashPassword, comparePassword, hashToken, generateNumericOtp } from '@utils/hash';

describe('hash utils', () => {
  describe('hashPassword / comparePassword', () => {
    it('hashes a password and verifies the correct plaintext matches', async () => {
      const hash = await hashPassword('S3cur3P@ss');
      expect(hash).not.toBe('S3cur3P@ss');
      await expect(comparePassword('S3cur3P@ss', hash)).resolves.toBe(true);
    });

    it('rejects an incorrect plaintext', async () => {
      const hash = await hashPassword('S3cur3P@ss');
      await expect(comparePassword('wrong-password', hash)).resolves.toBe(false);
    });
  });

  describe('hashToken', () => {
    it('is deterministic for the same input', () => {
      const token = 'some-refresh-token-value';
      expect(hashToken(token)).toBe(hashToken(token));
    });

    it('produces different hashes for different inputs', () => {
      expect(hashToken('token-a')).not.toBe(hashToken('token-b'));
    });
  });

  describe('generateNumericOtp', () => {
    it('generates an OTP of the requested length', () => {
      const otp = generateNumericOtp(6);
      expect(otp).toHaveLength(6);
      expect(/^\d+$/.test(otp)).toBe(true);
    });

    it('zero-pads short random values to the requested length', () => {
      for (let i = 0; i < 20; i++) {
        const otp = generateNumericOtp(4);
        expect(otp).toHaveLength(4);
      }
    });
  });
});
