import { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: { id: number; email: string; name: string; role: string };
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthenticated" });
    return;
  }
  try {
    const rows = await db.select({
      id: usersTable.id,
      email: usersTable.email,
      name: usersTable.name,
      role: usersTable.role,
      isActive: usersTable.isActive,
    }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);

    if (!rows[0] || !rows[0].isActive) {
      res.status(401).json({ error: "Unauthenticated" });
      return;
    }
    req.user = { id: rows[0].id, email: rows[0].email, name: rows[0].name, role: rows[0].role };
    next();
  } catch {
    res.status(500).json({ error: "Auth check failed" });
  }
}
