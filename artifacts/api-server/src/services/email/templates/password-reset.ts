import { baseTemplate, SITE_URL } from "./_base";

export function passwordResetTemplate(token: string): string {
  const link = `${SITE_URL}/reset-password?token=${encodeURIComponent(token)}`;
  const body = `
    <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:24px;font-weight:bold;color:#1a2e1a;">
      Reset your password
    </h1>
    <p style="margin:0 0 24px;font-family:Arial,sans-serif;font-size:15px;color:#555;line-height:1.7;">
      We received a request to reset the password for your Laundry Master account.
      Click the button below to choose a new password. This link expires in <strong>1 hour</strong>.
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
      <tr>
        <td style="border-radius:4px;background:#1a2e1a;">
          <a href="${link}"
             style="display:inline-block;padding:14px 32px;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">
            Reset Password
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:13px;color:#888;line-height:1.6;">
      Or copy and paste this link into your browser:
    </p>
    <p style="margin:0 0 24px;font-family:monospace;font-size:12px;color:#4a7c59;word-break:break-all;">
      <a href="${link}" style="color:#4a7c59;">${link}</a>
    </p>

    <div style="background:#fff8f0;border:1px solid #f0d8b0;border-radius:4px;padding:16px 20px;margin:0 0 16px;">
      <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:#8a6020;line-height:1.6;">
        <strong>Security notice:</strong> If you did not request a password reset, please ignore
        this email. Your password will not change unless you click the link above.
        For security, this link is single-use and expires in 1 hour.
      </p>
    </div>`;

  return baseTemplate(body);
}
