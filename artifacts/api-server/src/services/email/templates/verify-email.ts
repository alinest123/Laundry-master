import { baseTemplate, SITE_URL } from "./_base";

export function verifyEmailTemplate(token: string): string {
  const link = `${SITE_URL}/verify-email?token=${encodeURIComponent(token)}`;
  const body = `
    <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:24px;font-weight:bold;color:#1a2e1a;">
      Verify your email address
    </h1>
    <p style="margin:0 0 24px;font-family:Arial,sans-serif;font-size:15px;color:#555;line-height:1.7;">
      Thank you for registering with Laundry Master. Click the button below to verify your
      email address and activate your account. This link expires in <strong>24 hours</strong>.
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
      <tr>
        <td style="border-radius:4px;background:#1a2e1a;">
          <a href="${link}"
             style="display:inline-block;padding:14px 32px;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">
            Verify Email Address
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:13px;color:#888;line-height:1.6;">
      If the button above doesn't work, copy and paste this link into your browser:
    </p>
    <p style="margin:0 0 24px;font-family:monospace;font-size:12px;color:#4a7c59;word-break:break-all;">
      <a href="${link}" style="color:#4a7c59;">${link}</a>
    </p>

    <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:#aaa;border-top:1px solid #f0f0ec;padding-top:16px;">
      If you did not create an account, you can safely ignore this email.
    </p>`;

  return baseTemplate(body);
}
