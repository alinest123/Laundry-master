import { Helmet } from "react-helmet-async";
import { useSiteStatus } from "@/lib/useSiteStatus";

const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined) ?? "";

interface PageSeoProps {
  /** Page-specific title — the site name will be appended automatically. */
  title?: string;
  description?: string;
  /** Full canonical URL. Defaults to VITE_SITE_URL + current pathname. */
  canonical?: string;
  noindex?: boolean;
  nofollow?: boolean;
  ogType?: "website" | "article";
  ogImage?: string;
  ogImageAlt?: string;
  /** ISO 8601 date strings — only used when ogType="article" */
  articlePublishedTime?: string;
  articleModifiedTime?: string;
  articleAuthor?: string;
  articleSection?: string;
  articleTags?: string[];
  /** Optional extra keywords for <meta name="keywords"> */
  keywords?: string;
}

export function PageSeo({
  title,
  description,
  canonical,
  noindex = false,
  nofollow = false,
  ogType = "website",
  ogImage,
  ogImageAlt,
  articlePublishedTime,
  articleModifiedTime,
  articleAuthor,
  articleSection,
  articleTags,
  keywords,
}: PageSeoProps) {
  const { data: siteStatus } = useSiteStatus();
  const siteName = siteStatus?.siteName ?? "Laundry Master";

  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  const robots = [
    noindex ? "noindex" : "index",
    nofollow ? "nofollow" : "follow",
  ].join(", ");

  // Canonical: explicit > SITE_URL + current path
  const canonicalUrl =
    canonical ||
    (SITE_URL
      ? `${SITE_URL}${typeof window !== "undefined" ? window.location.pathname : ""}`
      : "");

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content={robots} />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* ── Open Graph ─────────────────────────────────────────────────── */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:site_name" content={siteName} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      {description && <meta property="og:description" content={description} />}
      {ogImage && <meta property="og:image" content={ogImage} />}
      {ogImage && <meta property="og:image:width" content="1200" />}
      {ogImage && <meta property="og:image:height" content="630" />}
      {ogImage && ogImageAlt && (
        <meta property="og:image:alt" content={ogImageAlt} />
      )}

      {/* ── Article namespace ──────────────────────────────────────────── */}
      {articlePublishedTime && (
        <meta property="article:published_time" content={articlePublishedTime} />
      )}
      {articleModifiedTime && (
        <meta property="article:modified_time" content={articleModifiedTime} />
      )}
      {articleAuthor && (
        <meta property="article:author" content={articleAuthor} />
      )}
      {articleSection && (
        <meta property="article:section" content={articleSection} />
      )}
      {articleTags?.map((tag) => (
        <meta key={tag} property="article:tag" content={tag} />
      ))}

      {/* ── Twitter / X Cards ──────────────────────────────────────────── */}
      <meta
        name="twitter:card"
        content={ogImage ? "summary_large_image" : "summary"}
      />
      <meta name="twitter:title" content={fullTitle} />
      {description && (
        <meta name="twitter:description" content={description} />
      )}
      {ogImage && <meta name="twitter:image" content={ogImage} />}
      {ogImage && ogImageAlt && (
        <meta name="twitter:image:alt" content={ogImageAlt} />
      )}
    </Helmet>
  );
}
