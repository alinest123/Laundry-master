import { baseTemplate, SITE_URL } from "./_base";

interface ConsultationDetails {
  name: string;
  scheduledAt: Date;
  timezone: string;
  zoomLink?: string | null;
  notes?: string | null;
}

export function consultationBookedTemplate(data: ConsultationDetails): string {
  const dateStr = data.scheduledAt.toLocaleString("en-GB", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: data.timezone,
  });

  const body = `
    <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:24px;font-weight:bold;color:#1a2e1a;">
      Consultation Confirmed
    </h1>
    <p style="margin:0 0 24px;font-family:Arial,sans-serif;font-size:15px;color:#555;line-height:1.7;">
      Hello ${data.name}, your consultation has been booked successfully.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="background:#f9f9f7;border:1px solid #e8e8e4;border-radius:4px;margin:0 0 28px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 12px;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#1a2e1a;text-transform:uppercase;letter-spacing:0.8px;">
            Booking details
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;font-size:14px;color:#555;">
            <tr>
              <td style="padding:4px 16px 4px 0;font-weight:bold;color:#333;white-space:nowrap;">Date &amp; Time</td>
              <td style="padding:4px 0;">${dateStr} (${data.timezone})</td>
            </tr>
            ${data.zoomLink ? `
            <tr>
              <td style="padding:4px 16px 4px 0;font-weight:bold;color:#333;white-space:nowrap;">Join Link</td>
              <td style="padding:4px 0;">
                <a href="${data.zoomLink}" style="color:#4a7c59;word-break:break-all;">${data.zoomLink}</a>
              </td>
            </tr>` : ""}
            ${data.notes ? `
            <tr>
              <td style="padding:4px 16px 4px 0;font-weight:bold;color:#333;vertical-align:top;white-space:nowrap;">Notes</td>
              <td style="padding:4px 0;">${data.notes}</td>
            </tr>` : ""}
          </table>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:14px;color:#555;line-height:1.7;">
      To reschedule or cancel, please visit your
      <a href="${SITE_URL}/dashboard" style="color:#4a7c59;">dashboard</a>
      or reply to this email.
    </p>
    <p style="margin:0;font-family:Georgia,serif;font-size:14px;color:#888;font-style:italic;">
      — The Laundry Master Team
    </p>`;

  return baseTemplate(body);
}
