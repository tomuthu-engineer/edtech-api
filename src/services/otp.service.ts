import { OtpPurpose } from '@prisma/client';
import { otpRepository } from '@repositories/otp.repository';
import { generateNumericOtp, hashOtp, compareOtp } from '@utils/hash';
import { env } from '@config/env';
import { ValidationError } from '@utils/errors';
import { enqueueEmail } from '@queues/producers/email.producer';
import { otpEmailTemplate } from '@emails/templates/otp.template';

const PURPOSE_LABELS: Record<OtpPurpose, string> = {
  EMAIL_VERIFICATION: 'Verify your email',
  PASSWORD_RESET: 'Reset your password',
  LOGIN_MFA: 'Login verification',
  PHONE_VERIFICATION: 'Verify your phone number',
};

class OtpService {
  async generateAndSend(userId: string, email: string, purpose: OtpPurpose): Promise<void> {
    await otpRepository.invalidateActiveForPurpose(userId, purpose);

    const code = generateNumericOtp(env.OTP_LENGTH);
    const codeHash = await hashOtp(code);
    const expiresAt = new Date(Date.now() + env.OTP_EXPIRES_IN_MINUTES * 60 * 1000);

    await otpRepository.create({ userId, codeHash, purpose, expiresAt });

    const { subject, html } = otpEmailTemplate(code, PURPOSE_LABELS[purpose]);
    await enqueueEmail({ to: email, subject, html });
  }

  /** Verifies without consuming — used when a follow-up step (reset password) still needs the OTP. */
  async verify(userId: string, purpose: OtpPurpose, code: string, consume = true): Promise<void> {
    const otp = await otpRepository.findLatestActive(userId, purpose);
    if (!otp) {
      throw new ValidationError('OTP is invalid or has expired');
    }

    if (otp.attempts >= env.OTP_MAX_ATTEMPTS) {
      throw new ValidationError('Maximum verification attempts exceeded. Please request a new code.');
    }

    const isValid = await compareOtp(code, otp.codeHash);
    if (!isValid) {
      await otpRepository.incrementAttempts(otp.id);
      throw new ValidationError('Invalid OTP code');
    }

    if (consume) {
      await otpRepository.markUsed(otp.id);
    }
  }
}

export const otpService = new OtpService();
