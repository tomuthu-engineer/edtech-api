import { env } from '@config/env';

/** Shared HTML shell so every transactional email looks consistent. */
export function emailLayout(title: string, bodyHtml: string): string {
  return `
  <!doctype html>
  <html>
    <body style="margin:0;padding:0;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;">
        <tr>
          <td align="center">
            <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
              <tr>
                <td style="background:#111827;padding:24px;text-align:center;">
                  <span style="color:#ffffff;font-size:18px;font-weight:bold;">${env.APP_NAME}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:32px;color:#111827;">
                  <h2 style="margin-top:0;">${title}</h2>
                  ${bodyHtml}
                </td>
              </tr>
              <tr>
                <td style="padding:16px 32px;color:#9ca3af;font-size:12px;text-align:center;">
                  &copy; ${new Date().getFullYear()} ${env.APP_NAME}. All rights reserved.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;
}
