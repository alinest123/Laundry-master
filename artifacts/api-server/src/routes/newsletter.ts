import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { newsletterSubscribersTable } from "@workspace/db";
import { SubscribeNewsletterBody } from "@workspace/api-zod";

const router = Router();

router.post("/newsletter/subscribe", async (req, res): Promise<void> => {
  const parsed = SubscribeNewsletterBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { email, name } = parsed.data;

  const existing = await db.select().from(newsletterSubscribersTable).where(eq(newsletterSubscribersTable.email, email)).limit(1);
  if (existing[0]) {
    res.json({ success: true, message: "You are already subscribed." });
    return;
  }

  await db.insert(newsletterSubscribersTable).values({ email, name });
  res.json({ success: true, message: "Successfully subscribed! Thank you for joining our community." });
});

export default router;
