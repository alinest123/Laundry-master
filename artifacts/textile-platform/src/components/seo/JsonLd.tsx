/**
 * JSON-LD structured data components.
 * Each renders a <script type="application/ld+json"> block via Helmet.
 * Multiple schemas on one page compose naturally — just render several.
 */
import { Helmet } from "react-helmet-async";

const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined) ?? "https://laundrymaster.com";

// ── Helpers ───────────────────────────────────────────────────────────────────
function ld(schema: unknown) {
  return JSON.stringify(schema);
}

// ── Organization ──────────────────────────────────────────────────────────────
export interface OrganizationSchemaProps {
  name?: string;
  url?: string;
  logoUrl?: string;
  description?: string;
  email?: string;
  sameAs?: string[];
}
export function OrganizationSchema({
  name = "Laundry Master",
  url = SITE_URL,
  logoUrl,
  description = "The Science of Professional Textile Care — evidence-based knowledge for laundry, dry cleaning, and fabric science professionals.",
  email,
  sameAs = [],
}: OrganizationSchemaProps) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url,
    description,
    ...(logoUrl && { logo: { "@type": "ImageObject", url: logoUrl } }),
    ...(email && { email }),
    ...(sameAs.length && { sameAs }),
  };
  return (
    <Helmet>
      <script type="application/ld+json">{ld(schema)}</script>
    </Helmet>
  );
}

// ── WebSite + SearchAction ────────────────────────────────────────────────────
export function WebSiteSchema({ name = "Laundry Master", url = SITE_URL }: { name?: string; url?: string }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${url}/search?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
  return (
    <Helmet>
      <script type="application/ld+json">{ld(schema)}</script>
    </Helmet>
  );
}

// ── BreadcrumbList ────────────────────────────────────────────────────────────
export interface BreadcrumbItem { name: string; url?: string }
export function BreadcrumbSchema({ items }: { items: BreadcrumbItem[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      ...(item.url && { item: item.url }),
    })),
  };
  return (
    <Helmet>
      <script type="application/ld+json">{ld(schema)}</script>
    </Helmet>
  );
}

// ── Article ───────────────────────────────────────────────────────────────────
export interface ArticleSchemaProps {
  headline: string;
  description?: string;
  url: string;
  imageUrl?: string;
  imageAlt?: string;
  datePublished?: string;
  dateModified?: string;
  authorName?: string;
  authorUrl?: string;
  publisherName?: string;
  publisherLogoUrl?: string;
  keywords?: string;
  articleSection?: string;
  articleType?: "Article" | "TechArticle" | "NewsArticle" | "BlogPosting";
  wordCount?: number;
}
export function ArticleSchema({
  headline,
  description,
  url,
  imageUrl,
  imageAlt,
  datePublished,
  dateModified,
  authorName,
  authorUrl,
  publisherName = "Laundry Master",
  publisherLogoUrl,
  keywords,
  articleSection,
  articleType = "TechArticle",
  wordCount,
}: ArticleSchemaProps) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": articleType,
    headline,
    ...(description && { description }),
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    ...(imageUrl && {
      image: {
        "@type": "ImageObject",
        url: imageUrl,
        ...(imageAlt && { caption: imageAlt }),
      },
    }),
    ...(datePublished && { datePublished }),
    ...(dateModified && { dateModified }),
    ...(authorName && {
      author: {
        "@type": "Person",
        name: authorName,
        ...(authorUrl && { url: authorUrl }),
      },
    }),
    publisher: {
      "@type": "Organization",
      name: publisherName,
      ...(publisherLogoUrl && {
        logo: { "@type": "ImageObject", url: publisherLogoUrl },
      }),
    },
    ...(keywords && { keywords }),
    ...(articleSection && { articleSection }),
    ...(wordCount && { wordCount }),
  };
  return (
    <Helmet>
      <script type="application/ld+json">{ld(schema)}</script>
    </Helmet>
  );
}

// ── Person (Author) ───────────────────────────────────────────────────────────
export interface PersonSchemaProps {
  name: string;
  url?: string;
  imageUrl?: string;
  jobTitle?: string;
  description?: string;
  sameAs?: string[];
}
export function PersonSchema({ name, url, imageUrl, jobTitle, description, sameAs = [] }: PersonSchemaProps) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    ...(url && { url }),
    ...(imageUrl && { image: imageUrl }),
    ...(jobTitle && { jobTitle }),
    ...(description && { description }),
    ...(sameAs.length && { sameAs }),
  };
  return (
    <Helmet>
      <script type="application/ld+json">{ld(schema)}</script>
    </Helmet>
  );
}

// ── FAQPage ───────────────────────────────────────────────────────────────────
export interface FaqItem { question: string; answer: string }
export function FAQSchema({ items }: { items: FaqItem[] }) {
  if (!items.length) return null;
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
  return (
    <Helmet>
      <script type="application/ld+json">{ld(schema)}</script>
    </Helmet>
  );
}

// ── CollectionPage (article lists, category pages) ────────────────────────────
export function CollectionPageSchema({
  name,
  description,
  url,
}: {
  name: string;
  description?: string;
  url: string;
}) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    ...(description && { description }),
    url,
  };
  return (
    <Helmet>
      <script type="application/ld+json">{ld(schema)}</script>
    </Helmet>
  );
}

// ── SearchResultsPage ─────────────────────────────────────────────────────────
export function SearchResultsPageSchema({ url, query }: { url: string; query?: string }) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "SearchResultsPage",
    url,
    ...(query && { name: `Search results for "${query}"` }),
  };
  return (
    <Helmet>
      <script type="application/ld+json">{ld(schema)}</script>
    </Helmet>
  );
}
