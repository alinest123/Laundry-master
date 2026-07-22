import { Request } from "express";
import { db } from "@workspace/db";
import { auditLogsTable } from "@workspace/db";

export async function logAudit(
  req: Request,
  action: string,
  resource: string,
  resourceId?: string | number | null,
  diff?: unknown,
): Promise<void> {
  try {
    await db.insert(auditLogsTable).values({
      userId: req.user?.id ?? null,
      userEmail: req.user?.email ?? null,
      action,
      resource,
      resourceId: resourceId != null ? String(resourceId) : null,
      diff: diff != null ? JSON.stringify(diff) : null,
      ipAddress: req.ip ?? null,
    });
  } catch { /* non-blocking */ }
}
