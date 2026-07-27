import { emailLayout } from '@emails/layout';
import { env } from '@config/env';

export function otpEmailTemplate(otp: string, purposeLabel: string): { subject: string; html: string } {
  const subject = `Your ${purposeLabel} code`;
  const html = emailLayout(
    purposeLabel,
    `
      <p>Use the code below to ${purposeLabel.toLowerCase()}. It expires in ${env.OTP_EXPIRES_IN_MINUTES} minutes.</p>
      <p style="font-size:32px;font-weight:bold;letter-spacing:6px;text-align:center;margin:24px 0;">${otp}</p>
      <p style="color:#6b7280;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
    `,
  );
  return { subject, html };
}
