import nodemailer, { Transporter } from 'nodemailer';
import { env, isTest } from '@config/env';
import { createChildLogger } from '@config/logger';

const logger = createChildLogger('mailer');

function createTransporter(): Transporter {
  // Falls back to a no-op JSON transport (logs instead of sending) whenever
  // SMTP isn't fully configured — not just when SMTP_HOST is empty. A host
  // with no credentials (e.g. the placeholder in .env.example) would
  // otherwise attempt a real, doomed SMTP connection on every email job.
  const isFullyConfigured = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);

  if (isTest || !isFullyConfigured) {
    return nodemailer.createTransport({ jsonTransport: true });
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
}

export const mailer = createTransporter();

export interface SendMailInput {
  to: string;
  subject: string;
  html: string;
}

export async function sendMail(input: SendMailInput): Promise<void> {
  const info = await mailer.sendMail({
    from: `"${env.SMTP_FROM_NAME}" <${env.SMTP_FROM_EMAIL}>`,
    to: input.to,
    subject: input.subject,
    html: input.html,
  });

  logger.info({ to: input.to, subject: input.subject, messageId: info.messageId }, 'Email dispatched');
}
