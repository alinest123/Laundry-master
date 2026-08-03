import { baseTemplate } from "./_base";

export function contactReceivedTemplate(name: string): string {
  const body = `
    <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:24px;font-weight:bold;color:#1a2e1a;">
      We've received your enquiry
    </h1>
    <p style="margin:0 0 20px;font-family:Arial,sans-serif;font-size:15px;color:#555;line-height:1.7;">
      Hello ${name},
    </p>
    <p style="margin:0 0 20px;font-family:Arial,sans-serif;font-size:15px;color:#555;line-height:1.7;">
      Thank you for contacting Laundry Master.
    </p>
    <p style="margin:0 0 20px;font-family:Arial,sans-serif;font-size:15px;color:#555;line-height:1.7;">
      We have received your enquiry and our team will review it shortly.
    </p>
    <p style="margin:0 0 28px;font-family:Arial,sans-serif;font-size:15px;color:#555;line-height:1.7;">
      If your enquiry is urgent, please mention it in your reply.
    </p>
    <p style="margin:0;font-family:Georgia,serif;font-size:14px;color:#888;font-style:italic;">
      Regards,<br/>
      Laundry Master Team
    </p>`;

  return baseTemplate(body);
}
