import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { categoriesTable } from "@workspace/db";

const router = Router();

router.get("/knowledge", async (req, res): Promise<void> => {
  const allCats = await db.select().from(categoriesTable);

  const guides = [
    { title: "Professional Laundry Guides", count: 24, slug: "professional-laundry", description: "Step-by-step technical guides for commercial laundry operations" },
    { title: "Fabric Care Guides", count: 18, slug: "fabric-science", description: "Comprehensive care instructions for all fiber types" },
    { title: "Stain Removal Guides", count: 31, slug: "stain-removal", description: "Evidence-based stain treatment protocols for professionals" },
    { title: "Equipment Operation Guides", count: 15, slug: "equipment", description: "Operating manuals and maintenance guides for laundry equipment" },
  ];

  const research = [
    { title: "Textile Chemistry Research", count: 12, slug: "textile-chemistry", description: "Latest findings in textile chemistry and detergent science" },
    { title: "Sustainability Studies", count: 9, slug: "sustainability", description: "Research on eco-friendly practices and environmental impact" },
    { title: "Water Quality Research", count: 7, slug: "water-quality", description: "Studies on water treatment and quality for textile processing" },
    { title: "Innovation & Technology", count: 11, slug: "innovation", description: "Emerging technologies transforming the textile care industry" },
  ];

  const caseStudies = [
    { title: "Commercial Laundry Operations", count: 8, slug: "case-studies", description: "Real-world optimization success stories from global facilities" },
    { title: "Dry Cleaning Excellence", count: 6, slug: "dry-cleaning", description: "Best-practice case studies from leading dry cleaning operations" },
    { title: "Sustainability Transformations", count: 5, slug: "sustainability", description: "How businesses reduced water and energy consumption by 40-60%" },
    { title: "Quality Control Systems", count: 4, slug: "quality-control", description: "Implementation studies of ISO-compliant quality management" },
  ];

  const learningPaths = [
    { title: "Textile Care Professional", count: 8, slug: "training", description: "Complete pathway from fundamentals to advanced certification" },
    { title: "Fabric Science Specialist", count: 6, slug: "fabric-science", description: "Deep dive into fiber properties, chemistry, and care science" },
    { title: "Business Management", count: 5, slug: "business-management", description: "Running a profitable, efficient textile care operation" },
    { title: "Sustainability Leader", count: 4, slug: "sustainability", description: "Implementing green practices and meeting environmental standards" },
  ];

  const totalItems = guides.reduce((a, g) => a + g.count, 0) + research.reduce((a, r) => a + r.count, 0);

  res.json({ guides, research, caseStudies, learningPaths, totalItems });
});

export default router;
