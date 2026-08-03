/**
 * Shared HTML shell for all Laundry Master branded emails.
 * Wraps body content with a consistent header, footer, and styles.
 */

const SITE_URL = (process.env.SITE_URL ?? "").replace(/\/$/, "") || "https://laundry-master.com";

export function baseTemplate(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Laundry Master</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f0;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f0;padding:32px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0"
               style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e0e0da;border-radius:4px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:#1a2e1a;padding:28px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-family:Georgia,serif;font-size:22px;font-weight:bold;color:#ffffff;letter-spacing:0.5px;">
                      Laundry Master
                    </span>
                    <p style="margin:4px 0 0;font-family:Arial,sans-serif;font-size:11px;color:#a8c4a8;letter-spacing:1.5px;text-transform:uppercase;">
                      The Science of Professional Textile Care
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9f9f7;border-top:1px solid #e8e8e4;padding:20px 40px;">
              <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:#999;line-height:1.6;">
                © ${new Date().getFullYear()} Laundry Master · Professional Textile Care Knowledge
                &nbsp;·&nbsp;
                <a href="${SITE_URL}" style="color:#4a7c59;text-decoration:none;">Visit Website</a>
              </p>
              <p style="margin:6px 0 0;font-family:Arial,sans-serif;font-size:11px;color:#bbb;">
                This is an automated message. Please do not reply directly to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export { SITE_URL };
