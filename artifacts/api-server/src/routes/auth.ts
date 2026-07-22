import { Router } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { usersTable, securityLogsTable } from "@workspace/db";
import { logAudit } from "../lib/audit";

const router = Router();

// POST /api/auth/login
router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ error: "Email and password required" });
    return;
  }
  try {
    const rows = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
    const user = rows[0];

    if (!user || !user.isActive || !(await bcrypt.compare(password, user.passwordHash))) {
      await db.insert(securityLogsTable).values({
        event: "login_failed",
        userId: user?.id ?? null,
        ipAddress: req.ip ?? null,
        userAgent: req.headers["user-agent"] ?? null,
        path: "/api/auth/login",
        detail: `Failed login attempt for ${email}`,
      }).catch(() => {});
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    req.session.userId = user.id;
    await logAudit(
      { ...req, user: { id: user.id, email: user.email, name: user.name, role: user.role } } as any,
      "login", "auth", user.id,
    );
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

// POST /api/auth/logout
router.post("/auth/logout", async (req, res): Promise<void> => {
  if (req.session?.userId) {
    await logAudit(req, "logout", "auth", req.session.userId).catch(() => {});
  }
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

// GET /api/auth/me
router.get("/auth/me", async (req, res): Promise<void> => {
  const userId = req.session?.userId;
  if (!userId) { res.status(401).json({ error: "Unauthenticated" }); return; }
  try {
    const rows = await db.select({
      id: usersTable.id, name: usersTable.name, email: usersTable.email, role: usersTable.role,
    }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!rows[0]) { res.status(401).json({ error: "Unauthenticated" }); return; }
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: "Failed" });
  }
});

export default router;
