import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { articlesTable, topicsTable } from "@workspace/db";

const router = Router();

const BASE = process.env.SITE_URL ?? "https://laundrymaster.com";

function escXml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

router.get("/sitemap.xml", async (_req, res): Promise<void> => {
  try {
    const [articles, topics] = await Promise.all([
      db
        .select({
          slug: articlesTable.slug,
          title: articlesTable.title,
          updatedAt: articlesTable.updatedAt,
          featuredImage: articlesTable.featuredImage,
          featuredImageAlt: articlesTable.featuredImageAlt,
          excerpt: articlesTable.excerpt,
        })
        .from(articlesTable)
        .where(eq(articlesTable.status, "published")),
      db.select({ slug: topicsTable.slug }).from(topicsTable),
    ]);

    const staticRoutes = [
      { url: "/",              priority: "1.0", changefreq: "weekly" },
      { url: "/articles",      priority: "0.9", changefreq: "daily" },
      { url: "/knowledge",     priority: "0.9", changefreq: "weekly" },
      { url: "/consultations", priority: "0.8", changefreq: "monthly" },
      { url: "/about",         priority: "0.6", changefreq: "monthly" },
      { url: "/contact",       priority: "0.6", changefreq: "monthly" },
    ];

    const today = new Date().toISOString().split("T")[0];

    const urls = [
      ...staticRoutes.map(
        (r) => `
  <url>
    <loc>${BASE}${r.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
      ),
      ...articles.map((a) => {
        const imageBlock =
          a.featuredImage
            ? `
    <image:image>
      <image:loc>${escXml(a.featuredImage)}</image:loc>
      <image:title>${escXml(a.title)}</image:title>
      ${a.featuredImageAlt ? `<image:caption>${escXml(a.featuredImageAlt)}</image:caption>` : ""}
    </image:image>`
            : "";
        return `
  <url>
    <loc>${BASE}/articles/${a.slug}</loc>
    <lastmod>${(a.updatedAt ?? new Date()).toISOString().split("T")[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>${imageBlock}
  </url>`;
      }),
      ...topics.map(
        (t) => `
  <url>
    <loc>${BASE}/knowledge/${t.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`
      ),
    ];

    res.setHeader("Content-Type", "application/xml");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join("")}
</urlset>`);
  } catch {
    res.status(500).send("<?xml version='1.0'?><urlset/>");
  }
});

export default router;
