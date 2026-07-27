import { emailLayout } from '@emails/layout';
import { env } from '@config/env';

export function welcomeEmailTemplate(firstName: string): { subject: string; html: string } {
  const subject = `Welcome to ${env.APP_NAME}!`;
  const html = emailLayout(
    `Welcome, ${firstName}!`,
    `
      <p>Your account has been created. Verify your email to unlock enrollments and live classes.</p>
      <p>We're excited to have you on board.</p>
    `,
  );
  return { subject, html };
}

export function passwordChangedEmailTemplate(): { subject: string; html: string } {
  const subject = 'Your password was changed';
  const html = emailLayout(
    'Password changed',
    `<p>Your password was just changed. If this wasn't you, contact support immediately and reset your password.</p>`,
  );
  return { subject, html };
}
