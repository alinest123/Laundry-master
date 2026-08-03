import { baseTemplate, SITE_URL } from "./_base";

interface SupportTicketDetails {
  name: string;
  subject: string;
  ticketRef: string;
  message: string;
}

export function supportTicketTemplate(data: SupportTicketDetails): string {
  const body = `
    <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:24px;font-weight:bold;color:#1a2e1a;">
      Support Request Received
    </h1>
    <p style="margin:0 0 24px;font-family:Arial,sans-serif;font-size:15px;color:#555;line-height:1.7;">
      Hello ${data.name}, we have received your support request and will respond within 1–2 business days.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="background:#f9f9f7;border:1px solid #e8e8e4;border-radius:4px;margin:0 0 28px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 12px;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#1a2e1a;text-transform:uppercase;letter-spacing:0.8px;">
            Your ticket
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;font-size:14px;color:#555;width:100%;">
            <tr>
              <td style="padding:4px 16px 4px 0;font-weight:bold;color:#333;white-space:nowrap;vertical-align:top;">Reference</td>
              <td style="padding:4px 0;font-family:monospace;font-size:13px;color:#4a7c59;">${data.ticketRef}</td>
            </tr>
            <tr>
              <td style="padding:4px 16px 4px 0;font-weight:bold;color:#333;white-space:nowrap;vertical-align:top;">Subject</td>
              <td style="padding:4px 0;">${data.subject}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px 4px 0;font-weight:bold;color:#333;white-space:nowrap;vertical-align:top;">Message</td>
              <td style="padding:12px 0 4px;color:#666;line-height:1.6;border-top:1px solid #e8e8e4;">${data.message.replace(/\n/g, "<br/>")}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:14px;color:#555;line-height:1.7;">
      You can view the status of your request in your
      <a href="${SITE_URL}/dashboard" style="color:#4a7c59;">dashboard</a>.
      If you need to add information, please reply to this email quoting your reference number.
    </p>
    <p style="margin:0;font-family:Georgia,serif;font-size:14px;color:#888;font-style:italic;">
      — The Laundry Master Support Team
    </p>`;

  return baseTemplate(body);
}
