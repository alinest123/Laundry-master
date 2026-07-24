import img1 from "@assets/generated_images/article_1.jpg";
import img2 from "@assets/generated_images/article_2.jpg";
import img3 from "@assets/generated_images/article_3.jpg";
import img4 from "@assets/generated_images/article_4.jpg";
import catFabric from "@assets/generated_images/category_fabric.jpg";
import catLaundry from "@assets/generated_images/category_laundry.jpg";
import catDryCleaning from "@assets/generated_images/category_drycleaning.jpg";
import catStains from "@assets/generated_images/category_stains.jpg";
import catSustainability from "@assets/generated_images/category_sustainability.jpg";

/** Cycle of article placeholder images (used when no featuredImage URL is set). */
export const articlePlaceholders = [img1, img2, img3, img4];

/** Category images keyed by slug fragment. */
export const categoryImages: Record<string, string> = {
  fabric: catFabric,
  laundry: catLaundry,
  "dry-cleaning": catDryCleaning,
  stains: catStains,
  sustainability: catSustainability,
};

/**
 * Returns a deterministic placeholder image for an article based on its ID.
 * Falls back gracefully if the featuredImage field is empty.
 */
export function getArticleImage(articleId: number): string {
  return articlePlaceholders[(articleId - 1) % articlePlaceholders.length];
}
