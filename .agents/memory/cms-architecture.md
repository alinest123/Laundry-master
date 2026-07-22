---
name: CMS Architecture
description: Knowledge Hub CMS — routes, schema, and key decisions
---

## Admin API routes
All admin CRUD lives at `/api/admin/*` in the api-server (registered before public routes in index.ts).
- Articles: GET/POST `/admin/articles`, GET/PUT/DELETE `/admin/articles/:id`, POST `/admin/articles/:id/publish|unpublish|schedule`
- Authors: CRUD at `/admin/authors`
- Categories: CRUD at `/admin/categories` (+ `/admin/categories/flat` for flat list)
- Tags: CRUD at `/admin/tags`

## Frontend admin
Routes at `/admin/*` in textile-platform (before public routes in App.tsx).
- `/admin` → Dashboard
- `/admin/articles` → ArticleList
- `/admin/articles/new` and `/admin/articles/:id/edit` → ArticleEditor (same component)
- `/admin/authors`, `/admin/categories`, `/admin/tags` → management pages
- API utility at `src/lib/adminApi.ts` — calls `/api/admin/*` relative paths

## Schema additions (lib/db)
New tables: `article_images`, `article_faqs`, `article_references`, `article_related`
New columns on `articles`: scheduled_at, meta_title, meta_description, meta_keywords, canonical_url, og_image, structured_data, noindex (boolean), nofollow (boolean), toc_enabled (boolean)
New columns on `authors`: email, twitter, linkedin, expertise

**Why:** `isFeatured` kept as `integer` (not boolean) — existing seed data uses 0/1 integers; changing to boolean would require a data migration. New boolean fields use native PG boolean.

## Article editor
Two-column layout: main content pane (left) + 72-wide sidebar (right).
Sidebar has 5 tabs: Publish | Organize | SEO | Media | Extras
- Extras tab handles FAQs, references (3 types: reference/citation/external)
- Organize tab handles author select, category checkboxes, tag pills, related article search
- All nested data (images, faqs, references, categoryIds, tagIds, relatedArticleIds) sent in one PUT/POST payload and synced atomically server-side
