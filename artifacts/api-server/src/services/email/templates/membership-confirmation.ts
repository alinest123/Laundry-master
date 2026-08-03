import { baseTemplate, SITE_URL } from "./_base";

interface MembershipDetails {
  name: string;
  plan: string;
  validUntil?: Date | null;
}

export function membershipConfirmationTemplate(data: MembershipDetails): string {
  const expiryLine = data.validUntil
    ? `<tr>
        <td style="padding:4px 16px 4px 0;font-weight:bold;color:#333;white-space:nowrap;">Valid Until</td>
        <td style="padding:4px 0;">${data.validUntil.toLocaleDateString("en-GB", { dateStyle: "long" })}</td>
       </tr>`
    : "";

  const body = `
    <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:24px;font-weight:bold;color:#1a2e1a;">
      Membership Confirmed
    </h1>
    <p style="margin:0 0 24px;font-family:Arial,sans-serif;font-size:15px;color:#555;line-height:1.7;">
      Hello ${data.name}, your Laundry Master membership is now active.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="background:#f9f9f7;border:1px solid #e8e8e4;border-radius:4px;margin:0 0 28px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 12px;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#1a2e1a;text-transform:uppercase;letter-spacing:0.8px;">
            Membership details
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;font-size:14px;color:#555;">
            <tr>
              <td style="padding:4px 16px 4px 0;font-weight:bold;color:#333;white-space:nowrap;">Plan</td>
              <td style="padding:4px 0;">${data.plan}</td>
            </tr>
            ${expiryLine}
          </table>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 20px;font-family:Arial,sans-serif;font-size:14px;color:#555;line-height:1.7;">
      You now have full access to all professional content, expert articles, and
      consultation booking. Visit your
      <a href="${SITE_URL}/dashboard" style="color:#4a7c59;">dashboard</a> to get started.
    </p>
    <p style="margin:0;font-family:Georgia,serif;font-size:14px;color:#888;font-style:italic;">
      — The Laundry Master Team
    </p>`;

  return baseTemplate(body);
}
