import { baseTemplate, SITE_URL } from "./_base";

export type SecurityEvent =
  | "password_changed"
  | "password_reset_requested"
  | "failed_login_attempts"
  | "new_login";

const EVENT_TITLES: Record<SecurityEvent, string> = {
  password_changed:          "Your password was changed",
  password_reset_requested:  "Password reset requested",
  failed_login_attempts:     "Suspicious login activity detected",
  new_login:                 "New sign-in to your account",
};

const EVENT_BODY: Record<SecurityEvent, (ctx: SecurityAlertContext) => string> = {
  password_changed: (ctx) => `
    <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:15px;color:#555;line-height:1.7;">
      Hello ${ctx.name}, your Laundry Master account password was successfully changed
      ${ctx.timestamp ? `on ${ctx.timestamp}` : ""}.
    </p>
    <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:14px;color:#555;line-height:1.7;">
      If you made this change, no action is needed.
      If you did not change your password, please
      <a href="${SITE_URL}/forgot-password" style="color:#c0392b;font-weight:bold;">reset it immediately</a>
      and contact our support team.
    </p>`,

  password_reset_requested: (ctx) => `
    <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:15px;color:#555;line-height:1.7;">
      Hello ${ctx.name}, a password reset was requested for your account.
    </p>
    <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:14px;color:#555;line-height:1.7;">
      If this was you, follow the reset link sent in a separate email. That link expires in 1 hour.
      If you did not request a reset, your password has not changed and no action is needed.
    </p>`,

  failed_login_attempts: (ctx) => `
    <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:15px;color:#555;line-height:1.7;">
      Hello ${ctx.name}, we detected multiple failed sign-in attempts on your account
      ${ctx.ipAddress ? `from IP address <strong>${ctx.ipAddress}</strong>` : ""}
      ${ctx.timestamp ? `at ${ctx.timestamp}` : ""}.
    </p>
    <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:14px;color:#555;line-height:1.7;">
      If this was not you, we recommend
      <a href="${SITE_URL}/forgot-password" style="color:#c0392b;font-weight:bold;">resetting your password</a>
      immediately.
    </p>`,

  new_login: (ctx) => `
    <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:15px;color:#555;line-height:1.7;">
      Hello ${ctx.name}, a new sign-in to your account was detected
      ${ctx.timestamp ? `at ${ctx.timestamp}` : ""}
      ${ctx.ipAddress ? `from IP <strong>${ctx.ipAddress}</strong>` : ""}.
    </p>
    <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:14px;color:#555;line-height:1.7;">
      If this was you, no action is needed.
      If you do not recognise this sign-in, please
      <a href="${SITE_URL}/forgot-password" style="color:#c0392b;font-weight:bold;">change your password immediately</a>.
    </p>`,
};

interface SecurityAlertContext {
  name: string;
  ipAddress?: string | null;
  timestamp?: string | null;
}

export function securityAlertTemplate(event: SecurityEvent, ctx: SecurityAlertContext): string {
  const title = EVENT_TITLES[event];
  const bodyContent = EVENT_BODY[event]?.(ctx) ?? "";

  const body = `
    <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:24px;font-weight:bold;color:#1a2e1a;">
      ${title}
    </h1>
    ${bodyContent}
    <hr style="border:none;border-top:1px solid #e8e8e4;margin:24px 0;"/>
    <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:#aaa;line-height:1.6;">
      This is an automated security notification from Laundry Master.
      If you have concerns about your account security, contact us at
      <a href="mailto:contactus@laundry-master.com" style="color:#4a7c59;">contactus@laundry-master.com</a>.
    </p>`;

  return baseTemplate(body);
}
