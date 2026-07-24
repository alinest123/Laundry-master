import { Router } from "express";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { eq, and, gt } from "drizzle-orm";
import { db } from "@workspace/db";
import { usersTable, securityLogsTable } from "@workspace/db";
import { logAudit } from "../lib/audit";
import { generateCaptcha, verifyCaptcha } from "../lib/captcha";
import { sendVerificationEmail, sendPasswordResetEmail } from "../lib/email";

const router = Router();

// GET /api/auth/captcha — returns a signed math question for login
router.get("/auth/captcha", (_req, res): void => {
  res.json(generateCaptcha());
});

// POST /api/auth/register
router.post("/auth/register", async (req, res): Promise<void> => {
  const { name, email, password } = req.body ?? {};
  if (!name || !email || !password) {
    res.status(400).json({ error: "Name, email and password are required" });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }
  try {
    const existing = await db.select({ id: usersTable.id })
      .from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
    if (existing[0]) {
      res.status(409).json({ error: "An account with that email already exists" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const token = randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 h

    await db.insert(usersTable).values({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: "user",
      isActive: true,
      emailVerified: false,
      emailVerificationToken: token,
      verificationTokenExpiry: expiry,
    });

    await sendVerificationEmail(email.toLowerCase().trim(), token).catch(err =>
      console.error("[register] email send failed:", err),
    );

    res.status(201).json({ ok: true, message: "Account created. Check your email to verify." });
  } catch (err) {
    console.error("[register]", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// POST /api/auth/verify-email
router.post("/auth/verify-email", async (req, res): Promise<void> => {
  const { token } = req.body ?? {};
  if (!token) { res.status(400).json({ error: "Token required" }); return; }
  try {
    const rows = await db.select()
      .from(usersTable)
      .where(
        and(
          eq(usersTable.emailVerificationToken, token),
          gt(usersTable.verificationTokenExpiry, new Date()),
        ),
      ).limit(1);

    if (!rows[0]) {
      res.status(400).json({ error: "Invalid or expired verification link" });
      return;
    }

    await db.update(usersTable)
      .set({ emailVerified: true, emailVerificationToken: null, verificationTokenExpiry: null })
      .where(eq(usersTable.id, rows[0].id));

    res.json({ ok: true, message: "Email verified. You can now sign in." });
  } catch (err) {
    console.error("[verify-email]", err);
    res.status(500).json({ error: "Verification failed" });
  }
});

// POST /api/auth/forgot-password
router.post("/auth/forgot-password", async (req, res): Promise<void> => {
  const { email } = req.body ?? {};
  if (!email) { res.status(400).json({ error: "Email required" }); return; }
  // Always return success to avoid leaking account existence
  res.json({ ok: true, message: "If that email exists you'll receive a reset link shortly." });
  try {
    const rows = await db.select({ id: usersTable.id, email: usersTable.email })
      .from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
    if (!rows[0]) return;

    const token = randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 h

    await db.update(usersTable)
      .set({ passwordResetToken: token, resetTokenExpiry: expiry })
      .where(eq(usersTable.id, rows[0].id));

    await sendPasswordResetEmail(rows[0].email, token).catch(err =>
      console.error("[forgot-password] email send failed:", err),
    );
  } catch (err) {
    console.error("[forgot-password]", err);
  }
});

// POST /api/auth/reset-password
router.post("/auth/reset-password", async (req, res): Promise<void> => {
  const { token, newPassword } = req.body ?? {};
  if (!token || !newPassword) {
    res.status(400).json({ error: "Token and newPassword required" });
    return;
  }
  if (newPassword.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }
  try {
    const rows = await db.select()
      .from(usersTable)
      .where(
        and(
          eq(usersTable.passwordResetToken, token),
          gt(usersTable.resetTokenExpiry, new Date()),
        ),
      ).limit(1);

    if (!rows[0]) {
      res.status(400).json({ error: "Invalid or expired reset link" });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db.update(usersTable)
      .set({ passwordHash, passwordResetToken: null, resetTokenExpiry: null })
      .where(eq(usersTable.id, rows[0].id));

    res.json({ ok: true, message: "Password updated. You can now sign in." });
  } catch (err) {
    console.error("[reset-password]", err);
    res.status(500).json({ error: "Password reset failed" });
  }
});

// POST /api/auth/login — public user login; captcha is ALWAYS required
router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password, captchaToken, captchaAnswer } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ error: "Email and password required" });
    return;
  }

  // Captcha is mandatory — reject immediately if missing or wrong
  if (!captchaToken || !captchaAnswer || !verifyCaptcha(captchaToken, String(captchaAnswer))) {
    res.status(400).json({ error: "Security check required. Please complete the captcha." });
    return;
  }

  try {
    const rows = await db.select().from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase())).limit(1);
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

    // Require email verification for user-role accounts
    if (!user.emailVerified) {
      res.status(403).json({
        error: "Please verify your email before signing in.",
        code: "EMAIL_NOT_VERIFIED",
      });
      return;
    }

    req.session.userId = user.id;
    await logAudit(
      { ...req, user: { id: user.id, email: user.email, name: user.name, role: user.role } } as any,
      "login", "auth", user.id,
    );
    res.json({
      id: user.id, name: user.name, email: user.email, role: user.role,
      avatarUrl: user.avatarUrl,
    });
  } catch (err) {
    console.error("[login]", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// POST /api/admin/auth/login — admin-only login; no captcha, role enforced server-side
router.post("/admin/auth/login", async (req, res): Promise<void> => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ error: "Email and password required" });
    return;
  }

  try {
    const rows = await db.select().from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase())).limit(1);
    const user = rows[0];

    if (!user || !user.isActive || !(await bcrypt.compare(password, user.passwordHash))) {
      await db.insert(securityLogsTable).values({
        event: "login_failed",
        userId: user?.id ?? null,
        ipAddress: req.ip ?? null,
        userAgent: req.headers["user-agent"] ?? null,
        path: "/api/admin/auth/login",
        detail: `Failed admin login attempt for ${email}`,
      }).catch(() => {});
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    // Only super_admin and administrator accounts may use this endpoint
    const adminRoles: string[] = ["super_admin", "administrator"];
    if (!adminRoles.includes(user.role)) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    req.session.userId = user.id;
    await logAudit(
      { ...req, user: { id: user.id, email: user.email, name: user.name, role: user.role } } as any,
      "login", "auth", user.id,
    );
    res.json({
      id: user.id, name: user.name, email: user.email, role: user.role,
      avatarUrl: user.avatarUrl,
    });
  } catch (err) {
    console.error("[admin/login]", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// POST /api/auth/logout
router.post("/auth/logout", async (req, res): Promise<void> => {
  if (req.session?.userId) {
    await logAudit(req, "logout", "auth", req.session.userId).catch(() => {});
  }
  req.session.destroy(() => { res.json({ ok: true }); });
});

// GET /api/auth/me
router.get("/auth/me", async (req, res): Promise<void> => {
  const userId = req.session?.userId;
  if (!userId) { res.status(401).json({ error: "Unauthenticated" }); return; }
  try {
    const rows = await db.select({
      id: usersTable.id, name: usersTable.name, email: usersTable.email,
      role: usersTable.role, avatarUrl: usersTable.avatarUrl,
    }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!rows[0]) { res.status(401).json({ error: "Unauthenticated" }); return; }
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: "Failed" });
  }
});

export default router;
