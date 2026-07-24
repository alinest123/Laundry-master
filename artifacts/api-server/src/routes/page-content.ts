import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { pageContentTable } from "@workspace/db";

const router = Router();

/** Default content — returned as fallback so the site never goes blank */
export const PAGE_DEFAULTS: Record<string, Record<string, string>> = {
  home: {
    hero_tag: "Science-first textile care knowledge",
    hero_headline: "The Science Behind Professional Textile Care",
    hero_subheadline:
      "Evidence-based research, fiber science, and professional standards for laundry, dry cleaning, and textile care professionals — built on chemistry and testing, not guesswork.",
    hero_cta_primary: "Explore the Knowledge Hub",
    hero_cta_secondary: "Book a Consultation",
    caption_box: "Science & support for your textile care operations",
    expertise_label: "Our expertise",
    expertise_heading: "Built on Fiber Science and Wet Processing Chemistry",
    expertise_body:
      'Every resource on this platform starts with the underlying chemistry and material science — not marketing claims about what "works."',
    expertise_item1_title: "Fabric & fiber science",
    expertise_item1_body:
      "How fiber structure, weave, and construction determine care requirements — the foundation for every recommendation on this site.",
    expertise_item2_title: "Wet processing & chemistry",
    expertise_item2_body:
      "Detergent chemistry, solvent behavior, water hardness, and the mechanics of soil removal, explained at a level professionals can apply.",
    knowledge_heading: "Your knowledge goals are our priority",
    knowledge_body:
      "From fiber science fundamentals to advanced plant operations — resources built for textile care professionals who want to understand the why, not just follow a checklist.",
  },
  about: {
    hero_badge: "INDEPENDENT AUTHORITY",
    hero_headline: "Advancing the Science of Textile Care",
    hero_subheadline:
      "We are an independent, science-first institution dedicated to standardizing and elevating the global practices of commercial laundry, dry cleaning, and fabric science.",
    mission_heading: "Our Mission",
    mission_body1:
      "For too long, the professional textile care industry has relied on anecdotal knowledge passed down through generations. Our mission is to replace guesswork with empirical science.",
    mission_body2:
      "By aggregating rigorous research, standardizing operational procedures, and providing direct access to leading experts, we empower facilities worldwide to improve quality, efficiency, and sustainability.",
    stat1_value: "500+",
    stat1_label: "Research Papers",
    stat2_value: "25",
    stat2_label: "Global Experts",
    stat3_value: "40",
    stat3_label: "Countries Reached",
    editorial_heading: "Our Editorial Standards",
    editorial_body:
      "Every piece of content published on our platform undergoes rigorous peer review by active industry professionals and scientists. We do not accept sponsored content, native advertising, or paid endorsements of chemical products or machinery. Our allegiance is strictly to the science and to our readers.",
    editorial_card1_title: "Empirical Focus",
    editorial_card1_body:
      "We prioritize data, chemical analysis, and measured outcomes over anecdotal claims.",
    editorial_card2_title: "Independence",
    editorial_card2_body:
      "We operate independently of any chemical manufacturer or equipment brand.",
    editorial_card3_title: "Practicality",
    editorial_card3_body:
      "Our scientific insights must translate into actionable procedures for plant operations.",
  },
  contact: {
    heading: "Contact Us",
    subheading:
      "Whether you are looking to contribute research, inquire about corporate access, or need support with an existing consultation.",
    general_email: "info@textilescience.org",
    editorial_email: "editorial@textilescience.org",
    address: "100 Science Parkway, Suite 400\nBoston, MA 02110\nUnited States",
    form_heading: "Send a Message",
  },
  consultations: {
    hero_headline: "Expert Consultations",
    hero_subheadline:
      "Access the world's leading minds in textile science, commercial laundry operations, and fabric care. Direct 1-on-1 guidance for your most complex challenges.",
    hero_cta: "Book a Session",
    services_heading: "Consultation Services",
    services_subheading:
      "Targeted advisory sessions tailored to specific operational and scientific needs.",
  },
  knowledge: {
    hero_headline: "The Knowledge Hub",
    hero_subheadline:
      "The central repository for all professional guides, research papers, and structured learning resources.",
  },
  footer: {
    tagline:
      "The global authority in professional textile care — science-first knowledge for laundry, dry cleaning, and fabric science professionals.",
    newsletter_label: "Newsletter Sign-up",
    copyright: "© 2026 TextilePro. Textile care knowledge for professionals.",
  },
};

/** GET /page-content/:page — public, merges defaults with saved DB values */
router.get("/page-content/:page", async (req, res): Promise<void> => {
  try {
    const { page } = req.params;
    const defaults = PAGE_DEFAULTS[page] ?? {};
    const rows = await db
      .select()
      .from(pageContentTable)
      .where(eq(pageContentTable.page, page));
    const saved: Record<string, string> = {};
    for (const row of rows) saved[row.fieldKey] = row.value;
    res.json({ ...defaults, ...saved });
  } catch {
    // On error return defaults so the site never goes blank
    res.json(PAGE_DEFAULTS[req.params.page] ?? {});
  }
});

export default router;
