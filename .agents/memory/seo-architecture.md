---
name: SEO Architecture
description: How SEO meta tags and JSON-LD schemas are wired throughout the frontend; auth rate-limiter path convention
---

## React Helmet
- `react-helmet-async` installed on frontend; `<HelmetProvider>` wraps the entire app in `App.tsx`.
- `<PageSeo>` component at `artifacts/textile-platform/src/components/seo/PageSeo.tsx` — renders title, description, canonical, robots, OG tags, Twitter/X card tags.
- `JsonLd.tsx` exports: `OrganizationSchema`, `WebSiteSchema`, `BreadcrumbSchema`, `ArticleSchema`, `PersonSchema`, `FAQSchema`, `CollectionPageSchema`, `SearchResultsPageSchema`.

## Site-wide schemas
- `SiteSchemas` component in `App.tsx` renders `<OrganizationSchema>` + `<WebSiteSchema>` on every page (reads `siteName` and `logoUrl` from `useSiteStatus()`).

## Per-page PageSeo coverage
- Home.tsx, ArticleList.tsx, CategoryList.tsx, CategoryDetail.tsx, KnowledgeHub.tsx, About.tsx, Contact.tsx, SearchResults.tsx (noindex), ArticleDetail.tsx (full article meta + ArticleSchema + BreadcrumbSchema + FAQSchema + PersonSchema).

## Site URL
- All pages use `import.meta.env.VITE_SITE_URL` (set to empty string "" in dev, should be set to the production URL in production).

## Article SEO fields (6 new, added via migration 0004_seo_fields.sql)
- `primaryKeyword`, `secondaryKeywords`, `searchIntent` (informational/navigational/transactional/commercial), `targetAudience`, `featuredImageAlt`, `ogImageAlt`.
- All 6 are in: DB schema, admin POST/PUT handlers, ArticleEditor FormData/EMPTY/setForm/SEO-tab.

## Auth rate limiter path convention
**Why:** Auth routes in this app are `/api/login`, `/api/register`, `/api/forgot-password`, `/api/reset-password` — NOT `/api/auth/*`. The auth router is mounted as `app.use("/api", authRouter)`.
**How to apply:** Apply `authLimiter` with `app.use(["/api/login", "/api/register", ...], authLimiter)` BEFORE `app.use("/api", authRouter)`. Do NOT mount authRouter at `/api/auth`.
