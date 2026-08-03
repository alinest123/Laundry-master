import { baseTemplate, SITE_URL } from "./_base";

export function welcomeTemplate(name: string): string {
  const body = `
    <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:24px;font-weight:bold;color:#1a2e1a;">
      Welcome to Laundry Master, ${name}
    </h1>
    <p style="margin:0 0 20px;font-family:Arial,sans-serif;font-size:15px;color:#555;line-height:1.7;">
      Your account is now active. You have access to our full library of professional
      textile care articles, expert-reviewed guides, and the knowledge hub.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
      <tr>
        <td style="background:#f9f9f7;border:1px solid #e8e8e4;border-radius:4px;padding:20px 24px;">
          <p style="margin:0 0 12px;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#1a2e1a;text-transform:uppercase;letter-spacing:0.8px;">
            Get started
          </p>
          <ul style="margin:0;padding-left:20px;font-family:Arial,sans-serif;font-size:14px;color:#555;line-height:2;">
            <li><a href="${SITE_URL}/articles" style="color:#4a7c59;text-decoration:none;">Browse the Knowledge Hub</a></li>
            <li><a href="${SITE_URL}/consultations" style="color:#4a7c59;text-decoration:none;">Book a professional consultation</a></li>
            <li><a href="${SITE_URL}/dashboard" style="color:#4a7c59;text-decoration:none;">View your dashboard</a></li>
          </ul>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:#555;line-height:1.7;">
      If you have any questions, reply to this email or visit our
      <a href="${SITE_URL}/contact" style="color:#4a7c59;">contact page</a>.
    </p>
    <p style="margin:16px 0 0;font-family:Georgia,serif;font-size:14px;color:#888;font-style:italic;">
      — The Laundry Master Team
    </p>`;

  return baseTemplate(body);
}
