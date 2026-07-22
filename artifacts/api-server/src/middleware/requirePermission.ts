import { Request, Response, NextFunction } from "express";
import { can, type Resource, type Action, type Role } from "../lib/permissions";
import { db } from "@workspace/db";
import { securityLogsTable } from "@workspace/db";

export function requirePermission(resource: Resource, action: Action) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const role = req.user?.role as Role | undefined;
    if (!role || !can(role, resource, action)) {
      // Write security log
      try {
        await db.insert(securityLogsTable).values({
          event: "permission_denied",
          userId: req.user?.id ?? null,
          ipAddress: req.ip ?? null,
          userAgent: req.headers["user-agent"] ?? null,
          path: req.path,
          detail: `Role "${role}" denied "${action}" on "${resource}"`,
        });
      } catch { /* non-blocking */ }
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}
