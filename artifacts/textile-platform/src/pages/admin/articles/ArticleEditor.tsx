import { useEffect, useState, useCallback } from "react";
import { useLocation, useParams } from "wouter";
import {
  Save, Send, Calendar, Plus, Trash2, ChevronDown, ChevronUp,
  Image, HelpCircle, BookOpen, Search, X, ExternalLink,
} from "lucide-react";
import { AdminLayout } from "../AdminLayout";
import { adminApi, generateSlug } from "@/lib/adminApi";

// ── Types ─────────────────────────────────────────────────────────────────────
type ArticleImage = { url: string; caption: string; altText: string; sortOrder: number };
type ArticleFaq   = { question: string; answer: string; sortOrder: number };
type ArticleRef   = { title: string; url: string; description: string; refType: string; sortOrder: number };

type FormData = {
  title: string; slug: string; excerpt: string; content: string;
  featuredImage: string; readingTime: number;
  status: string; publishedAt: string; scheduledAt: string;
  isFeatured: boolean; tocEnabled: boolean;
  authorId: string; categoryIds: number[]; tagIds: number[]; relatedArticleIds: number[];
  metaTitle: string; metaDescription: string; metaKeywords: string;
  canonicalUrl: string; ogImage: string; structuredData: string;
  noindex: boolean; nofollow: boolean;
  images: ArticleImage[]; faqs: ArticleFaq[]; references: ArticleRef[];
};

const EMPTY: FormData = {
  title: "", slug: "", excerpt: "", content: "", featuredImage: "", readingTime: 5,
  status: "draft", publishedAt: "", scheduledAt: "",
  isFeatured: false, tocEnabled: false,
  authorId: "", categoryIds: [], tagIds: [], relatedArticleIds: [],
  metaTitle: "", metaDescription: "", metaKeywords: "",
  canonicalUrl: "", ogImage: "", structuredData: "",
  noindex: false, nofollow: false,
  images: [], faqs: [], references: [],
};

const SIDEBAR_TABS = ["Publish", "Organize", "SEO", "Media", "Extras"] as const;
type SidebarTab = (typeof SIDEBAR_TABS)[number];

const STATUS_OPTS = [
  { value: "draft",     label: "Draft" },
  { value: "published", label: "Published" },
  { value: "scheduled", label: "Scheduled" },
  { value: "archived",  label: "Archived" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function Input({ label, value, onChange, type = "text", placeholder = "", mono = false, help = "" }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; mono?: boolean; help?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-stone-600 mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className={`w-full px-3 py-1.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30 focus:border-[#4a7c59] ${mono ? "font-mono text-xs" : ""}`} />
      {help && <p className="text-xs text-stone-400 mt-0.5">{help}</p>}
    </div>
  );
}

function Toggle({ label, checked, onChange, help = "" }: { label: string; checked: boolean; onChange: (v: boolean) => void; help?: string }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <div className="relative mt-0.5 shrink-0">
        <input type="checkbox" className="sr-only" checked={checked} onChange={e => onChange(e.target.checked)} />
        <div className={`w-9 h-5 rounded-full transition-colors ${checked ? "bg-[#4a7c59]" : "bg-stone-200"}`} />
        <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : ""}`} />
      </div>
      <div>
        <span className="text-sm text-stone-700">{label}</span>
        {help && <p className="text-xs text-stone-400 mt-0.5">{help}</p>}
      </div>
    </label>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-2">{children}</p>;
}

// ── Main component ────────────────────────────────────────────────────────────
export function ArticleEditor() {
  const params = useParams<{ id?: string }>();
  const [, navigate] = useLocation();
  const isNew = !params.id || params.id === "new";
  const articleId = isNew ? null : parseInt(params.id!);

  const [form, setForm] = useState<FormData>(EMPTY);
  const [activeTab, setActiveTab] = useState<SidebarTab>("Publish");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  // Data for selectors
  const [authors, setAuthors] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [relatedSearch, setRelatedSearch] = useState("");
  const [relatedResults, setRelatedResults] = useState<any[]>([]);
  const [relatedTitles, setRelatedTitles] = useState<Record<number, string>>({});

  // Slug auto-generation flag
  const [slugEdited, setSlugEdited] = useState(false);

  const up = (patch: Partial<FormData>) => setForm(p => ({ ...p, ...patch }));
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  // Load reference data
  useEffect(() => {
    Promise.all([adminApi.authors.list(), adminApi.categories.flat(), adminApi.tags.list()])
      .then(([a, c, t]) => { setAuthors(a); setCategories(c); setTags(t); })
      .catch(console.error);
  }, []);

  // Load article if editing
  useEffect(() => {
    if (!articleId) return;
    setLoading(true);
    adminApi.articles.get(articleId).then((a: any) => {
      setForm({
        title: a.title ?? "", slug: a.slug ?? "", excerpt: a.excerpt ?? "",
        content: a.content ?? "", featuredImage: a.featuredImage ?? "",
        readingTime: a.readingTime ?? 5, status: a.status ?? "draft",
        publishedAt: a.publishedAt ? a.publishedAt.slice(0, 16) : "",
        scheduledAt: a.scheduledAt ? a.scheduledAt.slice(0, 16) : "",
        isFeatured: !!a.isFeatured, tocEnabled: !!a.tocEnabled,
        authorId: String(a.authorId ?? ""),
        categoryIds: a.categoryIds ?? [], tagIds: a.tagIds ?? [],
        relatedArticleIds: a.relatedArticleIds ?? [],
        metaTitle: a.metaTitle ?? "", metaDescription: a.metaDescription ?? "",
        metaKeywords: a.metaKeywords ?? "", canonicalUrl: a.canonicalUrl ?? "",
        ogImage: a.ogImage ?? "", structuredData: a.structuredData ?? "",
        noindex: !!a.noindex, nofollow: !!a.nofollow,
        images: a.images?.map((i: any) => ({ url: i.url, caption: i.caption ?? "", altText: i.altText ?? "", sortOrder: i.sortOrder ?? 0 })) ?? [],
        faqs: a.faqs?.map((f: any) => ({ question: f.question, answer: f.answer, sortOrder: f.sortOrder ?? 0 })) ?? [],
        references: a.references?.map((r: any) => ({ title: r.title, url: r.url ?? "", description: r.description ?? "", refType: r.refType ?? "reference", sortOrder: r.sortOrder ?? 0 })) ?? [],
      });
      setSlugEdited(true);
      // Load related article titles
      if (a.relatedArticleIds?.length) {
        Promise.all(a.relatedArticleIds.map((id: number) => adminApi.articles.get(id))).then(arts => {
          const m: Record<number, string> = {};
          arts.forEach((art: any) => { m[art.id] = art.title; });
          setRelatedTitles(m);
        }).catch(() => {});
      }
    }).catch(() => setError("Failed to load article"))
      .finally(() => setLoading(false));
  }, [articleId]);

  // Auto-slug from title
  const handleTitleChange = (v: string) => {
    up({ title: v, ...(!slugEdited ? { slug: generateSlug(v) } : {}) });
  };

  // Related article search
  useEffect(() => {
    if (!relatedSearch.trim()) { setRelatedResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const data = await adminApi.articles.list({ search: relatedSearch, limit: "8" });
        setRelatedResults((data.articles || []).filter((a: any) => a.id !== articleId));
      } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [relatedSearch, articleId]);

  // Save
  const save = useCallback(async (overrideStatus?: string) => {
    if (!form.title.trim()) { setError("Title is required"); return; }
    if (!form.slug.trim()) { setError("Slug is required"); return; }
    if (!form.authorId) { setError("Author is required"); return; }
    setError(""); setSaving(true);

    const payload = {
      ...form,
      authorId: parseInt(form.authorId),
      isFeatured: form.isFeatured,
      status: overrideStatus ?? form.status,
      publishedAt: form.publishedAt || null,
      scheduledAt: form.scheduledAt || null,
    };

    try {
      let result: any;
      if (isNew) {
        if (overrideStatus === "published" && !payload.publishedAt) payload.publishedAt = new Date().toISOString();
        result = await adminApi.articles.create(payload);
        showToast(overrideStatus === "published" ? "Article published!" : "Article saved!");
        navigate(`/admin/articles/${result.id}/edit`);
      } else {
        if (overrideStatus === "published" && !payload.publishedAt) payload.publishedAt = new Date().toISOString();
        result = await adminApi.articles.update(articleId!, payload);
        up({ status: result.status });
        showToast(overrideStatus === "published" ? "Article published!" : "Changes saved!");
      }
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }, [form, isNew, articleId, navigate]);

  // ── FAQ helpers ───────────────────────────────────────────────────────────
  const addFaq = () => up({ faqs: [...form.faqs, { question: "", answer: "", sortOrder: form.faqs.length }] });
  const removeFaq = (i: number) => up({ faqs: form.faqs.filter((_, idx) => idx !== i) });
  const updateFaq = (i: number, patch: Partial<ArticleFaq>) => {
    const next = [...form.faqs]; next[i] = { ...next[i], ...patch }; up({ faqs: next });
  };

  // ── Image helpers ─────────────────────────────────────────────────────────
  const addImage = () => up({ images: [...form.images, { url: "", caption: "", altText: "", sortOrder: form.images.length }] });
  const removeImage = (i: number) => up({ images: form.images.filter((_, idx) => idx !== i) });
  const updateImage = (i: number, patch: Partial<ArticleImage>) => {
    const next = [...form.images]; next[i] = { ...next[i], ...patch }; up({ images: next });
  };

  // ── Ref helpers ───────────────────────────────────────────────────────────
  const addRef = (type = "reference") => up({ references: [...form.references, { title: "", url: "", description: "", refType: type, sortOrder: form.references.length }] });
  const removeRef = (i: number) => up({ references: form.references.filter((_, idx) => idx !== i) });
  const updateRef = (i: number, patch: Partial<ArticleRef>) => {
    const next = [...form.references]; next[i] = { ...next[i], ...patch }; up({ references: next });
  };

  // ── Related helpers ───────────────────────────────────────────────────────
  const addRelated = (a: any) => {
    if (form.relatedArticleIds.includes(a.id)) return;
    setRelatedTitles(p => ({ ...p, [a.id]: a.title }));
    up({ relatedArticleIds: [...form.relatedArticleIds, a.id] });
    setRelatedSearch(""); setRelatedResults([]);
  };
  const removeRelated = (id: number) => up({ relatedArticleIds: form.relatedArticleIds.filter(x => x !== id) });

  // ── Toggle category/tag ───────────────────────────────────────────────────
  const toggleCat = (id: number) => up({ categoryIds: form.categoryIds.includes(id) ? form.categoryIds.filter(x => x !== id) : [...form.categoryIds, id] });
  const toggleTag = (id: number) => up({ tagIds: form.tagIds.includes(id) ? form.tagIds.filter(x => x !== id) : [...form.tagIds, id] });

  const breadcrumbs = [
    { label: "Articles", href: "/admin/articles" },
    { label: isNew ? "New Article" : (form.title || "Edit Article") },
  ];

  if (loading) return <AdminLayout title="Loading…" breadcrumbs={breadcrumbs}><div className="text-stone-400 text-sm p-8">Loading article…</div></AdminLayout>;

  return (
    <AdminLayout title={isNew ? "New Article" : "Edit Article"} breadcrumbs={breadcrumbs}>
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 bg-[#1c1c1c] text-white text-sm px-4 py-2.5 rounded-lg shadow-lg">
          {toast}
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-1.5 rounded-lg">{error}</p>}
        </div>
        <div className="flex items-center gap-2">
          {form.status === "published" && (
            <a href={`/articles/${form.slug}`} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-stone-200 text-stone-600 text-xs font-medium rounded-lg hover:bg-stone-50 transition-colors">
              <ExternalLink className="w-3.5 h-3.5" /> View Live
            </a>
          )}
          <button onClick={() => save("draft")} disabled={saving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-stone-200 text-stone-700 text-sm font-medium rounded-lg hover:bg-stone-50 disabled:opacity-60 transition-colors">
            <Save className="w-4 h-4" /> Save Draft
          </button>
          <button onClick={() => save("published")} disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#4a7c59] text-white text-sm font-medium rounded-lg hover:bg-[#3d6849] disabled:opacity-60 transition-colors">
            <Send className="w-4 h-4" /> Publish
          </button>
        </div>
      </div>

      <div className="flex gap-5 items-start">
        {/* ── Main content pane ───────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Title */}
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <input
              className="w-full text-2xl font-bold text-stone-900 placeholder:text-stone-300 focus:outline-none mb-3 leading-tight"
              placeholder="Article title…"
              value={form.title}
              onChange={e => handleTitleChange(e.target.value)}
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-400">Slug:</span>
              <span className="text-xs text-stone-400">/articles/</span>
              <input
                className="flex-1 text-xs font-mono text-[#4a7c59] border-b border-dashed border-stone-200 focus:outline-none focus:border-[#4a7c59] bg-transparent py-0.5"
                value={form.slug}
                onChange={e => { setSlugEdited(true); up({ slug: e.target.value }); }}
              />
            </div>
          </div>

          {/* Excerpt */}
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Excerpt / Summary</label>
            <textarea
              className="w-full text-sm text-stone-700 placeholder:text-stone-300 focus:outline-none resize-none leading-relaxed"
              placeholder="Brief summary shown in article listings and social previews…"
              rows={3}
              value={form.excerpt}
              onChange={e => up({ excerpt: e.target.value })}
            />
          </div>

          {/* Content */}
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Article Content</label>
              <span className="text-xs text-stone-400">Markdown supported · {form.content.split(/\s+/).filter(Boolean).length} words</span>
            </div>
            <textarea
              className="w-full min-h-[480px] text-sm text-stone-700 placeholder:text-stone-300 focus:outline-none resize-y font-mono leading-relaxed"
              placeholder={`# Introduction\n\nWrite your article content here. Markdown is supported.\n\n## Section Heading\n\nParagraph text…\n\n- Bullet point\n- Another point\n\n> Blockquote`}
              value={form.content}
              onChange={e => up({ content: e.target.value })}
            />
          </div>

          {/* Featured image */}
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">Featured Image</label>
            <div className="flex gap-3 items-start">
              <div className="flex-1">
                <input
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30"
                  placeholder="https://example.com/image.jpg"
                  value={form.featuredImage}
                  onChange={e => up({ featuredImage: e.target.value })}
                />
                <p className="text-xs text-stone-400 mt-1">Paste an image URL. Displayed as the article hero and in social share previews.</p>
              </div>
              {form.featuredImage && (
                <img src={form.featuredImage} alt="" className="w-24 h-16 object-cover rounded-lg border border-stone-200 shrink-0" onError={e => (e.currentTarget.style.display = "none")} />
              )}
            </div>
          </div>
        </div>

        {/* ── Right sidebar ────────────────────────────────────────────────── */}
        <div className="w-72 shrink-0 space-y-0 sticky top-16">
          {/* Tab bar */}
          <div className="bg-white rounded-t-xl border border-stone-200 overflow-hidden">
            <div className="flex overflow-x-auto">
              {SIDEBAR_TABS.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab ? "border-[#4a7c59] text-[#4a7c59]" : "border-transparent text-stone-500 hover:text-stone-700"
                  }`}>
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className="bg-white border border-t-0 border-stone-200 rounded-b-xl p-4 space-y-5">

            {/* ── PUBLISH tab ──────────────────────────────────────────────── */}
            {activeTab === "Publish" && (
              <>
                <div>
                  <SectionLabel>Status</SectionLabel>
                  <select className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30"
                    value={form.status} onChange={e => up({ status: e.target.value })}>
                    {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>

                {form.status === "scheduled" && (
                  <div>
                    <label className="block text-xs font-medium text-stone-600 mb-1">Publish at</label>
                    <input type="datetime-local" className="w-full px-3 py-1.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30"
                      value={form.scheduledAt} onChange={e => up({ scheduledAt: e.target.value })} />
                  </div>
                )}

                {(form.status === "published" || form.status === "archived") && (
                  <div>
                    <label className="block text-xs font-medium text-stone-600 mb-1">Published at</label>
                    <input type="datetime-local" className="w-full px-3 py-1.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30"
                      value={form.publishedAt} onChange={e => up({ publishedAt: e.target.value })} />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">Reading time (min)</label>
                  <input type="number" min={1} max={120} className="w-full px-3 py-1.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30"
                    value={form.readingTime} onChange={e => up({ readingTime: parseInt(e.target.value) || 5 })} />
                </div>

                <div className="space-y-3 pt-1">
                  <Toggle label="Featured article" checked={form.isFeatured} onChange={v => up({ isFeatured: v })} help="Shown in featured sections on the homepage" />
                  <Toggle label="Table of contents" checked={form.tocEnabled} onChange={v => up({ tocEnabled: v })} help="Auto-generate TOC from headings" />
                </div>

                {!isNew && (
                  <div className="pt-2 space-y-2">
                    <button onClick={() => save("published")} disabled={saving}
                      className="w-full py-2 bg-[#4a7c59] text-white text-sm font-medium rounded-lg hover:bg-[#3d6849] disabled:opacity-60 transition-colors">
                      Publish Now
                    </button>
                    {form.status === "published" && (
                      <button onClick={() => { adminApi.articles.unpublish(articleId!).then(() => { up({ status: "archived" }); showToast("Article unpublished"); }); }}
                        className="w-full py-2 border border-stone-200 text-stone-600 text-sm font-medium rounded-lg hover:bg-stone-50 transition-colors">
                        Unpublish
                      </button>
                    )}
                  </div>
                )}
              </>
            )}

            {/* ── ORGANIZE tab ─────────────────────────────────────────────── */}
            {activeTab === "Organize" && (
              <>
                <div>
                  <SectionLabel>Author</SectionLabel>
                  <select className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30"
                    value={form.authorId} onChange={e => up({ authorId: e.target.value })}>
                    <option value="">— Select author —</option>
                    {authors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>

                <div>
                  <SectionLabel>Categories</SectionLabel>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {categories.length === 0 ? (
                      <p className="text-xs text-stone-400">No categories yet</p>
                    ) : categories.map(c => (
                      <label key={c.id} className="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox" checked={form.categoryIds.includes(c.id)} onChange={() => toggleCat(c.id)}
                          className="w-3.5 h-3.5 rounded border-stone-300 text-[#4a7c59] focus:ring-[#4a7c59]" />
                        <span className={`text-sm ${c.parentId ? "pl-3 text-stone-500" : "font-medium text-stone-700"}`}>{c.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <SectionLabel>Tags</SectionLabel>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map(t => (
                      <button key={t.id} onClick={() => toggleTag(t.id)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                          form.tagIds.includes(t.id)
                            ? "bg-[#4a7c59] text-white border-[#4a7c59]"
                            : "bg-stone-50 text-stone-600 border-stone-200 hover:border-stone-300"
                        }`}>
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <SectionLabel>Related Articles</SectionLabel>
                  <div className="relative mb-2">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                    <input className="w-full pl-8 pr-3 py-1.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30"
                      placeholder="Search articles…" value={relatedSearch} onChange={e => setRelatedSearch(e.target.value)} />
                  </div>
                  {relatedResults.length > 0 && (
                    <div className="border border-stone-200 rounded-lg mb-2 divide-y divide-stone-50 max-h-40 overflow-y-auto">
                      {relatedResults.map(a => (
                        <button key={a.id} onClick={() => addRelated(a)}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-stone-50 transition-colors flex items-center justify-between gap-2">
                          <span className="text-stone-700 truncate">{a.title}</span>
                          <Plus className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                  {form.relatedArticleIds.length > 0 && (
                    <div className="space-y-1">
                      {form.relatedArticleIds.map(id => (
                        <div key={id} className="flex items-center gap-2 text-xs text-stone-600 bg-stone-50 rounded px-2 py-1.5">
                          <span className="flex-1 truncate">{relatedTitles[id] ?? `Article #${id}`}</span>
                          <button onClick={() => removeRelated(id)} className="text-stone-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── SEO tab ──────────────────────────────────────────────────── */}
            {activeTab === "SEO" && (
              <>
                <div>
                  <SectionLabel>Meta Tags</SectionLabel>
                  <div className="space-y-3">
                    <Input label="Meta Title" value={form.metaTitle} onChange={v => up({ metaTitle: v })}
                      placeholder="Defaults to article title" help={`${form.metaTitle.length}/60 chars`} />
                    <div>
                      <label className="block text-xs font-medium text-stone-600 mb-1">Meta Description</label>
                      <textarea className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30 resize-none"
                        rows={3} placeholder="Defaults to excerpt" value={form.metaDescription} onChange={e => up({ metaDescription: e.target.value })} />
                      <p className="text-xs text-stone-400 mt-0.5">{form.metaDescription.length}/160 chars</p>
                    </div>
                    <Input label="Meta Keywords" value={form.metaKeywords} onChange={v => up({ metaKeywords: v })} placeholder="keyword1, keyword2" />
                  </div>
                </div>

                <div>
                  <SectionLabel>Canonical & OG</SectionLabel>
                  <div className="space-y-3">
                    <Input label="Canonical URL" value={form.canonicalUrl} onChange={v => up({ canonicalUrl: v })} placeholder="https://…" />
                    <Input label="Open Graph Image" value={form.ogImage} onChange={v => up({ ogImage: v })} placeholder="https://…/og.jpg" />
                  </div>
                </div>

                <div>
                  <SectionLabel>Structured Data (JSON-LD)</SectionLabel>
                  <textarea
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30 resize-none"
                    rows={5} placeholder='{"@context":"https://schema.org","@type":"Article",...}'
                    value={form.structuredData} onChange={e => up({ structuredData: e.target.value })} />
                </div>

                <div>
                  <SectionLabel>Crawl Directives</SectionLabel>
                  <div className="space-y-3">
                    <Toggle label="noindex" checked={form.noindex} onChange={v => up({ noindex: v })} help="Prevent search engines from indexing this page" />
                    <Toggle label="nofollow" checked={form.nofollow} onChange={v => up({ nofollow: v })} help="Prevent crawlers from following links" />
                  </div>
                </div>
              </>
            )}

            {/* ── MEDIA tab ────────────────────────────────────────────────── */}
            {activeTab === "Media" && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <SectionLabel>Article Images</SectionLabel>
                    <button onClick={addImage} className="inline-flex items-center gap-1 text-xs text-[#4a7c59] hover:text-[#3d6849]">
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>
                  {form.images.length === 0 ? (
                    <div className="border border-dashed border-stone-200 rounded-lg p-4 text-center">
                      <Image className="w-6 h-6 text-stone-300 mx-auto mb-1" />
                      <p className="text-xs text-stone-400">No images yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {form.images.map((img, i) => (
                        <div key={i} className="border border-stone-200 rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-stone-500">Image {i + 1}</span>
                            <button onClick={() => removeImage(i)} className="text-stone-300 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                          </div>
                          <input className="w-full px-2.5 py-1.5 border border-stone-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30"
                            placeholder="Image URL" value={img.url} onChange={e => updateImage(i, { url: e.target.value })} />
                          {img.url && <img src={img.url} alt="" className="w-full h-20 object-cover rounded border border-stone-100" onError={e => (e.currentTarget.style.display = "none")} />}
                          <input className="w-full px-2.5 py-1.5 border border-stone-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30"
                            placeholder="Caption (optional)" value={img.caption} onChange={e => updateImage(i, { caption: e.target.value })} />
                          <input className="w-full px-2.5 py-1.5 border border-stone-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30"
                            placeholder="Alt text" value={img.altText} onChange={e => updateImage(i, { altText: e.target.value })} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── EXTRAS tab ───────────────────────────────────────────────── */}
            {activeTab === "Extras" && (
              <>
                {/* FAQs */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <SectionLabel>FAQ Section</SectionLabel>
                    <button onClick={addFaq} className="inline-flex items-center gap-1 text-xs text-[#4a7c59] hover:text-[#3d6849]">
                      <Plus className="w-3.5 h-3.5" /> Add Q&A
                    </button>
                  </div>
                  {form.faqs.length === 0 ? (
                    <div className="border border-dashed border-stone-200 rounded-lg p-4 text-center">
                      <HelpCircle className="w-5 h-5 text-stone-300 mx-auto mb-1" />
                      <p className="text-xs text-stone-400">No FAQ items yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {form.faqs.map((faq, i) => (
                        <div key={i} className="border border-stone-200 rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-stone-500">Q{i + 1}</span>
                            <button onClick={() => removeFaq(i)} className="text-stone-300 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                          </div>
                          <input className="w-full px-2.5 py-1.5 border border-stone-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30"
                            placeholder="Question" value={faq.question} onChange={e => updateFaq(i, { question: e.target.value })} />
                          <textarea className="w-full px-2.5 py-1.5 border border-stone-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30 resize-none"
                            placeholder="Answer" rows={2} value={faq.answer} onChange={e => updateFaq(i, { answer: e.target.value })} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* References */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <SectionLabel>References & Citations</SectionLabel>
                    <div className="flex gap-1">
                      {["reference", "citation", "external"].map(t => (
                        <button key={t} onClick={() => addRef(t)}
                          className="px-1.5 py-0.5 text-[10px] border border-stone-200 rounded text-stone-500 hover:border-[#4a7c59] hover:text-[#4a7c59] transition-colors capitalize">
                          +{t.slice(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>
                  {form.references.length === 0 ? (
                    <div className="border border-dashed border-stone-200 rounded-lg p-4 text-center">
                      <BookOpen className="w-5 h-5 text-stone-300 mx-auto mb-1" />
                      <p className="text-xs text-stone-400">No references yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {form.references.map((ref, i) => (
                        <div key={i} className="border border-stone-200 rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                              ref.refType === "citation" ? "bg-blue-50 text-blue-600" :
                              ref.refType === "external" ? "bg-amber-50 text-amber-600" :
                              "bg-stone-50 text-stone-500"
                            }`}>{ref.refType}</span>
                            <button onClick={() => removeRef(i)} className="text-stone-300 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                          </div>
                          <input className="w-full px-2.5 py-1.5 border border-stone-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30"
                            placeholder="Title *" value={ref.title} onChange={e => updateRef(i, { title: e.target.value })} />
                          <input className="w-full px-2.5 py-1.5 border border-stone-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30"
                            placeholder="URL (optional)" value={ref.url} onChange={e => updateRef(i, { url: e.target.value })} />
                          <input className="w-full px-2.5 py-1.5 border border-stone-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30"
                            placeholder="Description" value={ref.description} onChange={e => updateRef(i, { description: e.target.value })} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
