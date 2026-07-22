import { Router } from "express";
import bcrypt from "bcryptjs";
import { eq, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { requirePermission } from "../../middleware/requirePermission";
import { logAudit } from "../../lib/audit";

const router = Router();

router.get("/users", requirePermission("users", "view"), async (req, res): Promise<void> => {
  try {
    const rows = await db.select({
      id: usersTable.id, name: usersTable.name, email: usersTable.email,
      role: usersTable.role, isActive: usersTable.isActive,
      createdAt: usersTable.createdAt,
    }).from(usersTable).orderBy(desc(usersTable.createdAt));
    res.json(rows);
  } catch { res.status(500).json({ error: "Failed to list users" }); }
});

router.get("/users/:id", requirePermission("users", "view"), async (req, res): Promise<void> => {
  try {
    const rows = await db.select({
      id: usersTable.id, name: usersTable.name, email: usersTable.email,
      role: usersTable.role, isActive: usersTable.isActive, createdAt: usersTable.createdAt,
    }).from(usersTable).where(eq(usersTable.id, parseInt(req.params.id as string))).limit(1);
    if (!rows[0]) { res.status(404).json({ error: "Not found" }); return; }
    res.json(rows[0]);
  } catch { res.status(500).json({ error: "Failed" }); }
});

router.post("/users", requirePermission("users", "create"), async (req, res): Promise<void> => {
  try {
    const { name, email, password, role, isActive } = req.body;
    if (!password) { res.status(400).json({ error: "Password required" }); return; }
    const passwordHash = await bcrypt.hash(password, 12);
    const [user] = await db.insert(usersTable).values({
      name, email: email.toLowerCase(), passwordHash, role: role ?? "user", isActive: isActive ?? true,
    }).returning({ id: usersTable.id, name: usersTable.name, email: usersTable.email, role: usersTable.role, isActive: usersTable.isActive });
    await logAudit(req, "create", "users", user.id);
    res.status(201).json(user);
  } catch (err: any) {
    if (err?.code === "23505") res.status(409).json({ error: "Email already exists" });
    else res.status(500).json({ error: "Failed to create user" });
  }
});

router.put("/users/:id", requirePermission("users", "edit"), async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    const { name, email, password, role, isActive } = req.body;
    const upd: Record<string, unknown> = {};
    if (name !== undefined) upd.name = name;
    if (email !== undefined) upd.email = email.toLowerCase();
    if (role !== undefined) upd.role = role;
    if (isActive !== undefined) upd.isActive = isActive;
    if (password) upd.passwordHash = await bcrypt.hash(password, 12);
    await db.update(usersTable).set(upd).where(eq(usersTable.id, id));
    await logAudit(req, "update", "users", id);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Failed to update user" }); }
});

router.delete("/users/:id", requirePermission("users", "delete"), async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    await db.delete(usersTable).where(eq(usersTable.id, id));
    await logAudit(req, "delete", "users", id);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Failed to delete user" }); }
});

export default router;
