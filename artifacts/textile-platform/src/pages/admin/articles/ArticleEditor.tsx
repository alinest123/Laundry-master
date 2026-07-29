import { useEffect, useState, useCallback, useRef } from "react";
import { useLocation, useParams } from "wouter";
import {
  Save, Send, Calendar, Plus,
  Image, HelpCircle, BookOpen, Search, X, ExternalLink, History,
  RotateCcw, Clock, CalendarClock, CalendarCheck, CalendarX,
} from "lucide-react";
import { AdminLayout } from "../AdminLayout";
import { adminApi, generateSlug } from "@/lib/adminApi";
import { RichTextEditor } from "@/components/editor/RichTextEditor";

// ── Types ─────────────────────────────────────────────────────────────────────
type ArticleImage = { url: string; caption: string; altText: string; sortOrder: number };
type ArticleFaq   = { question: string; answer: string; sortOrder: number };
type ArticleRef   = { title: string; url: string; description: string; refType: string; sortOrder: number };

type FormData = {
  title: string; slug: string; excerpt: string; content: string;
  featuredImage: string; readingTime: number;
  status: string; publishedAt: string; scheduledAt: string;
  isFeatured: boolean; tocEnabled: boolean;
  authorId: string; categoryIds: number[]; tagIds: number[]; relatedArticleIds: number[]; topicIds: number[];
  // Knowledge architecture
  contentType: string; knowledgeLevel: string; difficulty: string;
  keyTakeaway: string; learningObjectives: string; expertReviewStatus: string;
  metaTitle: string; metaDescription: string; metaKeywords: string;
  canonicalUrl: string; ogImage: string; structuredData: string;
  noindex: boolean; nofollow: boolean;
  images: ArticleImage[]; faqs: ArticleFaq[]; references: ArticleRef[];
};

const EMPTY: FormData = {
  title: "", slug: "", excerpt: "", content: "", featuredImage: "", readingTime: 5,
  status: "draft", publishedAt: "", scheduledAt: "",
  isFeatured: false, tocEnabled: false,
  authorId: "", categoryIds: [], tagIds: [], relatedArticleIds: [], topicIds: [],
  contentType: "professional-article", knowledgeLevel: "professional", difficulty: "",
  keyTakeaway: "", learningObjectives: "", expertReviewStatus: "not-reviewed",
  metaTitle: "", metaDescription: "", metaKeywords: "",
  canonicalUrl: "", ogImage: "", structuredData: "",
  noindex: false, nofollow: false,
  images: [], faqs: [], references: [],
};

const SIDEBAR_TABS = ["Publish", "Organize", "Knowledge", "Relationships", "SEO", "Media", "Extras", "Revisions"] as const;
type SidebarTab = (typeof SIDEBAR_TABS)[number];

const CONTENT_TYPES = [
  { value: "60-second",            label: "60-Second Knowledge" },
  { value: "professional-article", label: "Professional Article" },
  { value: "editorial",            label: "Editorial" },
  { value: "practical-guide",      label: "Practical Guide" },
  { value: "technical-article",    label: "Technical Article" },
  { value: "research-paper",       label: "Research Paper" },
  { value: "white-paper",          label: "White Paper" },
  { value: "case-study",           label: "Case Study" },
  { value: "best-practice-guide",  label: "Best Practice Guide" },
  { value: "sop",                  label: "Standard Operating Procedure" },
  { value: "technical-reference",  label: "Technical Reference" },
  { value: "expert-interview",     label: "Expert Interview" },
  { value: "industry-heritage",    label: "Industry Heritage" },
  { value: "professional-profile", label: "Professional Profile" },
];

const KNOWLEDGE_LEVELS = [
  { value: "quick",        label: "Quick (60-second)" },
  { value: "professional", label: "Professional" },
  { value: "advanced",     label: "Advanced / Technical" },
];

const DIFFICULTIES = [
  { value: "",           label: "Not set" },
  { value: "beginner",   label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced",   label: "Advanced" },
];

const REVIEW_STATUSES = [
  { value: "not-reviewed",        label: "Not Reviewed" },
  { value: "editorially-reviewed",label: "Editorially Reviewed" },
  { value: "expert-reviewed",     label: "Expert Reviewed" },
  { value: "technically-verified",label: "Technically Verified" },
];

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

// ── Schedule Modal ─────────────────────────────────────────────────────────────
function ScheduleModal({ initialDateTime, saving, onConfirm, onClose }: {
  initialDateTime?: string;
  saving: boolean;
  onConfirm: (dateTime: string) => void;
  onClose: () => void;
}) {
  const getDefault = () => {
    if (initialDateTime) return initialDateTime;
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    // Convert to local datetime-local string
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };
  const [dateTime, setDateTime] = useState(getDefault);
  const [err, setErr] = useState("");

  const submit = () => {
    if (!dateTime) { setErr("Please choose a date and time."); return; }
    if (new Date(dateTime) <= new Date()) { setErr("Scheduled time must be in the future."); return; }
    setErr("");
    onConfirm(dateTime);
  };

  const chosen = dateTime ? new Date(dateTime) : null;
  const isFuture = chosen && chosen > new Date();

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-start justify-between mb-1">
            <div className="flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-amber-500" />
              <h3 className="font-semibold text-stone-900 text-sm">Schedule Publication</h3>
            </div>
            <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-stone-400 ml-6">The article will publish automatically at the chosen time.</p>
        </div>

        <div className="px-5 pb-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1.5">Date &amp; time</label>
            <input
              type="datetime-local"
              value={dateTime}
              onChange={e => { setDateTime(e.target.value); setErr(""); }}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400"
            />
            {err && <p className="text-xs text-red-500 mt-1">{err}</p>}
          </div>

          {isFuture && chosen && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
              <CalendarCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <p className="text-xs text-amber-700">
                Publishes{" "}
                <span className="font-semibold">
                  {chosen.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                </span>
                {" at "}
                <span className="font-semibold">
                  {chosen.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                </span>
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={submit} disabled={saving}
              className="flex-1 py-2 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 disabled:opacity-60 transition-colors flex items-center justify-center gap-1.5">
              <CalendarClock className="w-3.5 h-3.5" />
              {saving ? "Scheduling…" : "Confirm Schedule"}
            </button>
            <button onClick={onClose} className="px-4 py-2 border border-stone-200 text-sm rounded-lg hover:bg-stone-50 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function fmtRelative(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1)  return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24)   return `${diffH}h ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
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

  // Revision state
  const [revisions, setRevisions] = useState<any[]>([]);
  const [revisionsLoading, setRevisionsLoading] = useState(false);
  const [restoringRevId, setRestoringRevId] = useState<number | null>(null);

  // Autosave state
  const [autoSavedAt, setAutoSavedAt] = useState<Date | null>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedContent = useRef<string>("");

  // Data for selectors
  const [authors, setAuthors] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [relatedSearch, setRelatedSearch] = useState("");

  // Relationships state
  const [relationships, setRelationships] = useState<any[]>([]);
  const [relSearch, setRelSearch] = useState("");
  const [relSearchResults, setRelSearchResults] = useState<any[]>([]);
  const [relType, setRelType] = useState("related");
  const [relLoading, setRelLoading] = useState(false);
  const [relatedResults, setRelatedResults] = useState<any[]>([]);
  const [relatedTitles, setRelatedTitles] = useState<Record<number, string>>({});

  // Schedule modal
  const [scheduleModal, setScheduleModal] = useState(false);

  // Slug auto-generation flag
  const [slugEdited, setSlugEdited] = useState(false);

  const up = (patch: Partial<FormData>) => setForm(p => ({ ...p, ...patch }));
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  // Load reference data
  useEffect(() => {
    Promise.all([adminApi.authors.list(), adminApi.categories.flat(), adminApi.tags.list(),
      fetch("/api/admin/topics", { credentials: "include" }).then(r => r.json()).catch(() => [])
    ]).then(([a, c, t, top]) => { setAuthors(a); setCategories(c); setTags(t); setTopics(Array.isArray(top) ? top : []); })
      .catch(console.error);
  }, []);

  // Load article if editing
  useEffect(() => {
    if (!articleId) return;
    setLoading(true);
    adminApi.articles.get(articleId).then((a: any) => {
      const content = a.content ?? "";
      setForm({
        title: a.title ?? "", slug: a.slug ?? "", excerpt: a.excerpt ?? "",
        content, featuredImage: a.featuredImage ?? "",
        readingTime: a.readingTime ?? 5, status: a.status ?? "draft",
        publishedAt: a.publishedAt ? a.publishedAt.slice(0, 16) : "",
        scheduledAt: a.scheduledAt ? a.scheduledAt.slice(0, 16) : "",
        isFeatured: !!a.isFeatured, tocEnabled: !!a.tocEnabled,
        authorId: String(a.authorId ?? ""),
        categoryIds: a.categoryIds ?? [], tagIds: a.tagIds ?? [],
        relatedArticleIds: a.relatedArticleIds ?? [],
        topicIds: a.topicIds ?? [],
        contentType: a.contentType ?? "professional-article",
        knowledgeLevel: a.knowledgeLevel ?? "professional",
        difficulty: a.difficulty ?? "",
        keyTakeaway: a.keyTakeaway ?? "",
        learningObjectives: a.learningObjectives ?? "",
        expertReviewStatus: a.expertReviewStatus ?? "not-reviewed",
        metaTitle: a.metaTitle ?? "", metaDescription: a.metaDescription ?? "",
        metaKeywords: a.metaKeywords ?? "", canonicalUrl: a.canonicalUrl ?? "",
        ogImage: a.ogImage ?? "", structuredData: a.structuredData ?? "",
        noindex: !!a.noindex, nofollow: !!a.nofollow,
        images: a.images?.map((i: any) => ({ url: i.url, caption: i.caption ?? "", altText: i.altText ?? "", sortOrder: i.sortOrder ?? 0 })) ?? [],
        faqs: a.faqs?.map((f: any) => ({ question: f.question, answer: f.answer, sortOrder: f.sortOrder ?? 0 })) ?? [],
        references: a.references?.map((r: any) => ({ title: r.title, url: r.url ?? "", description: r.description ?? "", refType: r.refType ?? "reference", sortOrder: r.sortOrder ?? 0 })) ?? [],
      });
      lastSavedContent.current = content;
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

  // Load relationships when Relationships tab is opened
  useEffect(() => {
    if (activeTab !== "Relationships" || !articleId) return;
    setRelLoading(true);
    fetch(`/api/admin/articles/${articleId}/relationships`, { credentials: "include" })
      .then(r => r.json()).then(setRelationships).catch(() => setRelationships([]))
      .finally(() => setRelLoading(false));
  }, [activeTab, articleId]);

  // Relationship article search
  useEffect(() => {
    if (!relSearch.trim()) { setRelSearchResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const data = await adminApi.articles.list({ search: relSearch, limit: "8" });
        setRelSearchResults((data.articles || []).filter((a: any) => a.id !== articleId));
      } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [relSearch, articleId]);

  const addRelationship = async (targetArticle: any) => {
    if (!articleId) return;
    try {
      const rel = await fetch(`/api/admin/articles/${articleId}/relationships`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetArticleId: targetArticle.id, relationshipType: relType }),
      }).then(r => r.json());
      setRelationships(prev => [...prev, { ...rel, targetArticle, sourceArticle: { id: articleId }, direction: "outbound" }]);
      setRelSearch(""); setRelSearchResults([]);
    } catch { showToast("Failed to add relationship"); }
  };

  const removeRelationship = async (relId: number) => {
    if (!articleId) return;
    try {
      await fetch(`/api/admin/articles/${articleId}/relationships/${relId}`, { method: "DELETE", credentials: "include" });
      setRelationships(prev => prev.filter(r => r.id !== relId));
    } catch { showToast("Failed to remove relationship"); }
  };

  // Load revisions when Revisions tab is opened
  useEffect(() => {
    if (activeTab !== "Revisions" || !articleId) return;
    setRevisionsLoading(true);
    adminApi.articles.revisions(articleId)
      .then(setRevisions)
      .catch(() => setRevisions([]))
      .finally(() => setRevisionsLoading(false));
  }, [activeTab, articleId]);

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
    if (!form.slug.trim())  { setError("Slug is required"); return; }
    if (!form.authorId)     { setError("Author is required"); return; }
    setError(""); setSaving(true);

    // Preserve "scheduled" status unless explicitly overriding
    const effectiveStatus = overrideStatus ?? (form.status === "scheduled" ? "scheduled" : form.status);

    const payload = {
      ...form,
      authorId: parseInt(form.authorId),
      isFeatured: form.isFeatured,
      status: effectiveStatus,
      publishedAt: form.publishedAt || null,
      scheduledAt: form.scheduledAt || null,
    };

    try {
      let result: any;
      if (isNew) {
        if (effectiveStatus === "published" && !payload.publishedAt) payload.publishedAt = new Date().toISOString();
        result = await adminApi.articles.create(payload);
        showToast(effectiveStatus === "published" ? "Article published!" : "Article saved!");
        navigate(`/admin/articles/${result.id}/edit`);
      } else {
        if (effectiveStatus === "published" && !payload.publishedAt) payload.publishedAt = new Date().toISOString();
        result = await adminApi.articles.update(articleId!, payload);
        lastSavedContent.current = form.content;
        up({ status: result.status });
        showToast(effectiveStatus === "published" ? "Article published!" : "Changes saved!");
      }
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }, [form, isNew, articleId, navigate]);

  // Schedule — save article with status "scheduled" and a future scheduledAt
  const scheduleArticle = useCallback(async (dateTime: string) => {
    if (!form.title.trim()) { setError("Title is required"); return; }
    if (!form.slug.trim())  { setError("Slug is required"); return; }
    if (!form.authorId)     { setError("Author is required"); return; }
    setError(""); setSaving(true);
    const payload = {
      ...form,
      authorId: parseInt(form.authorId),
      isFeatured: form.isFeatured,
      status: "scheduled",
      scheduledAt: new Date(dateTime).toISOString(),
      publishedAt: form.publishedAt || null,
    };
    try {
      if (isNew) {
        const result = await adminApi.articles.create(payload);
        showToast("Article scheduled!");
        setScheduleModal(false);
        navigate(`/admin/articles/${result.id}/edit`);
      } else {
        await adminApi.articles.update(articleId!, payload);
        lastSavedContent.current = form.content;
        up({ status: "scheduled", scheduledAt: dateTime });
        showToast("Article scheduled!");
        setScheduleModal(false);
      }
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }, [form, isNew, articleId, navigate]);

  // Cancel schedule — revert to draft
  const cancelSchedule = useCallback(async () => {
    if (!articleId) return;
    setError(""); setSaving(true);
    try {
      await adminApi.articles.update(articleId, {
        ...form,
        authorId: parseInt(form.authorId),
        status: "draft",
        scheduledAt: null,
        publishedAt: form.publishedAt || null,
      });
      up({ status: "draft", scheduledAt: "" });
      showToast("Schedule cancelled — article is now a draft.");
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }, [form, articleId]);

  // Autosave — 30 s after the last content change, for existing articles only
  const handleContentChange = useCallback((html: string) => {
    up({ content: html });
    if (isNew || !form.title || !form.authorId) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      if (html === lastSavedContent.current) return;
      try {
        await adminApi.articles.update(articleId!, {
          ...form, content: html,
          authorId: parseInt(form.authorId),
          publishedAt: form.publishedAt || null,
          scheduledAt: form.scheduledAt || null,
        });
        lastSavedContent.current = html;
        setAutoSavedAt(new Date());
      } catch { /* silent — user can always click Save */ }
    }, 30_000);
  }, [form, isNew, articleId]);

  useEffect(() => () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); }, []);

  // Restore revision
  const restoreRevision = useCallback(async (revId: number) => {
    if (!articleId) return;
    if (!confirm("Restore this revision? The current content will be saved as a new revision first.")) return;
    setRestoringRevId(revId);
    try {
      const result = await adminApi.articles.restoreRevision(articleId, revId);
      // Reload the article
      const a = await adminApi.articles.get(articleId);
      setForm(f => ({ ...f, title: a.title, content: a.content ?? "" }));
      lastSavedContent.current = a.content ?? "";
      showToast(`Restored: "${result.title}"`);
      // Refresh revisions list
      adminApi.articles.revisions(articleId).then(setRevisions).catch(() => {});
    } catch (e: any) {
      setError(e.message);
    } finally {
      setRestoringRevId(null);
    }
  }, [articleId]);

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
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3 min-w-0">
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-1.5 rounded-lg truncate">{error}</p>}
          {autoSavedAt && !error && (
            <p className="text-xs text-stone-400 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Autosaved {fmtRelative(autoSavedAt.toISOString())}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          {form.status === "scheduled" && form.scheduledAt && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium rounded-lg">
              <CalendarClock className="w-3.5 h-3.5 shrink-0" />
              Scheduled · {new Date(form.scheduledAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              {" "}
              {new Date(form.scheduledAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
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
          <button onClick={() => setScheduleModal(true)} disabled={saving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-amber-300 bg-amber-50 text-amber-700 text-sm font-medium rounded-lg hover:bg-amber-100 disabled:opacity-60 transition-colors">
            <Calendar className="w-4 h-4" /> Schedule
          </button>
          <button onClick={() => save("published")} disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#4a7c59] text-white text-sm font-medium rounded-lg hover:bg-[#3d6849] disabled:opacity-60 transition-colors">
            <Send className="w-4 h-4" /> Publish
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 items-start">
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

          {/* Content — TipTap rich editor */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-1">
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Article Content</label>
              <span className="text-xs text-stone-400">Ctrl+S to save · Ctrl+K for links</span>
            </div>
            <RichTextEditor
              value={form.content}
              onChange={handleContentChange}
              placeholder={`Start writing your article…\n\nUse the toolbar above for headings, links, callout blocks, tables, and more.`}
              onSave={() => save()}
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
        <div className="w-full lg:w-72 shrink-0 space-y-0 lg:sticky lg:top-16">
          {/* Tab bar */}
          <div className="bg-white rounded-t-xl border border-stone-200 overflow-hidden">
            <div className="flex overflow-x-auto">
              {SIDEBAR_TABS.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab ? "border-[#4a7c59] text-[#4a7c59]" : "border-transparent text-stone-500 hover:text-stone-700"
                  }`}>
                  {tab === "Revisions" ? (
                    <span className="flex items-center gap-1"><History className="w-3 h-3" /> {tab}</span>
                  ) : tab}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className="bg-white border border-t-0 border-stone-200 rounded-b-xl p-4 space-y-5">

            {/* ── PUBLISH tab ──────────────────────────────────────────────── */}
            {activeTab === "Publish" && (
              <>
                {/* Scheduling banner — shown when article is scheduled */}
                {form.status === "scheduled" && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-3 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <CalendarCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <p className="text-xs font-semibold text-amber-800">Scheduled to publish</p>
                    </div>
                    {form.scheduledAt ? (
                      <p className="text-xs text-amber-700 ml-5">
                        {new Date(form.scheduledAt).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
                        <br />
                        {new Date(form.scheduledAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    ) : (
                      <p className="text-xs text-amber-700 ml-5">No time set — click Reschedule below.</p>
                    )}
                    <div className="flex gap-2 ml-5">
                      <button onClick={() => setScheduleModal(true)} disabled={saving}
                        className="flex-1 py-1.5 text-xs font-medium border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors flex items-center justify-center gap-1">
                        <CalendarClock className="w-3 h-3" /> Reschedule
                      </button>
                      <button onClick={cancelSchedule} disabled={saving}
                        className="flex-1 py-1.5 text-xs font-medium border border-stone-200 text-stone-600 rounded-lg hover:bg-stone-50 transition-colors flex items-center justify-center gap-1">
                        <CalendarX className="w-3 h-3" /> Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <SectionLabel>Status</SectionLabel>
                  <select className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30"
                    value={form.status}
                    onChange={e => {
                      const s = e.target.value;
                      up({ status: s, ...(s !== "scheduled" ? { scheduledAt: "" } : {}) });
                    }}>
                    {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>

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
                    <button onClick={() => setScheduleModal(true)} disabled={saving}
                      className="w-full py-2 border border-amber-300 bg-amber-50 text-amber-700 text-sm font-medium rounded-lg hover:bg-amber-100 disabled:opacity-60 transition-colors flex items-center justify-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {form.status === "scheduled" ? "Reschedule" : "Schedule for later"}
                    </button>
                    {form.status === "published" && (
                      <button onClick={() => { adminApi.articles.unpublish(articleId!).then(() => { up({ status: "archived" }); showToast("Article unpublished"); }); }}
                        className="w-full py-2 border border-stone-200 text-stone-600 text-sm font-medium rounded-lg hover:bg-stone-50 transition-colors">
                        Unpublish
                      </button>
                    )}
                    {form.status === "scheduled" && (
                      <button onClick={cancelSchedule} disabled={saving}
                        className="w-full py-2 border border-stone-200 text-stone-600 text-sm font-medium rounded-lg hover:bg-stone-50 disabled:opacity-60 transition-colors flex items-center justify-center gap-1.5">
                        <CalendarX className="w-3.5 h-3.5" /> Cancel Schedule
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
                  <SectionLabel>Topics</SectionLabel>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {topics.length === 0 ? (
                      <p className="text-xs text-stone-400">No topics yet — create them in Knowledge → Topics</p>
                    ) : topics.map((t: any) => (
                      <label key={t.id} className="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox"
                          checked={(form.topicIds ?? []).includes(t.id)}
                          onChange={() => up({ topicIds: (form.topicIds ?? []).includes(t.id) ? (form.topicIds ?? []).filter((id: number) => id !== t.id) : [...(form.topicIds ?? []), t.id] })}
                          className="w-3.5 h-3.5 rounded border-stone-300 text-[#4a7c59] focus:ring-[#4a7c59]" />
                        <span className={`text-sm ${t.parentId ? "pl-3 text-stone-500" : "font-medium text-stone-700"}`}>{t.name}</span>
                      </label>
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

            {/* ── KNOWLEDGE tab ────────────────────────────────────────────── */}
            {activeTab === "Knowledge" && (
              <>
                <div>
                  <SectionLabel>Content Type</SectionLabel>
                  <select className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30"
                    value={form.contentType} onChange={e => up({ contentType: e.target.value })}>
                    {CONTENT_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <p className="text-xs text-stone-400 mt-1">Determines the content card format displayed to readers.</p>
                </div>

                <div>
                  <SectionLabel>Knowledge Level</SectionLabel>
                  <select className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30"
                    value={form.knowledgeLevel} onChange={e => up({ knowledgeLevel: e.target.value })}>
                    {KNOWLEDGE_LEVELS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>

                <div>
                  <SectionLabel>Difficulty</SectionLabel>
                  <select className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30"
                    value={form.difficulty} onChange={e => up({ difficulty: e.target.value })}>
                    {DIFFICULTIES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>

                <div>
                  <SectionLabel>Expert Review Status</SectionLabel>
                  <select className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30"
                    value={form.expertReviewStatus} onChange={e => up({ expertReviewStatus: e.target.value })}>
                    {REVIEW_STATUSES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>

                <div>
                  <SectionLabel>Key Takeaway</SectionLabel>
                  <textarea className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30 resize-none"
                    rows={3} placeholder="The single most important thing readers should remember…"
                    value={form.keyTakeaway} onChange={e => up({ keyTakeaway: e.target.value })} />
                </div>

                <div>
                  <SectionLabel>Learning Objectives</SectionLabel>
                  <textarea className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30 resize-none font-mono text-xs"
                    rows={5}
                    placeholder={`One objective per line:\nUnderstand fabric care labels\nApply correct wash temperatures`}
                    value={form.learningObjectives}
                    onChange={e => up({ learningObjectives: e.target.value })} />
                  <p className="text-xs text-stone-400 mt-0.5">One per line. Stored as a list.</p>
                </div>
              </>
            )}

            {/* ── RELATIONSHIPS tab ────────────────────────────────────────── */}
            {activeTab === "Relationships" && (
              <>
                {isNew ? (
                  <p className="text-xs text-stone-400 text-center py-4">Save the article first to manage content relationships.</p>
                ) : (
                  <>
                    <div>
                      <SectionLabel>Add Relationship</SectionLabel>
                      <div className="space-y-2">
                        <select className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30"
                          value={relType} onChange={e => setRelType(e.target.value)}>
                          <option value="related">Related</option>
                          <option value="prerequisite">Prerequisite (read first)</option>
                          <option value="follow-up">Follow-up (read next)</option>
                          <option value="case-study">Case Study</option>
                          <option value="sop">SOP</option>
                          <option value="reference">Reference</option>
                          <option value="quick-to-professional">60-Second → Professional</option>
                          <option value="professional-to-technical">Professional → Technical</option>
                        </select>
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                          <input className="w-full pl-8 pr-3 py-1.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30"
                            placeholder="Search articles to link…"
                            value={relSearch} onChange={e => setRelSearch(e.target.value)} />
                        </div>
                        {relSearchResults.length > 0 && (
                          <div className="border border-stone-200 rounded-lg divide-y divide-stone-50 max-h-40 overflow-y-auto">
                            {relSearchResults.map((a: any) => (
                              <button key={a.id} onClick={() => addRelationship(a)}
                                className="w-full text-left px-3 py-2 text-xs hover:bg-stone-50 flex items-center justify-between gap-2">
                                <span className="text-stone-700 truncate">{a.title}</span>
                                <Plus className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <SectionLabel>Current Relationships ({relationships.length})</SectionLabel>
                      {relLoading ? (
                        <p className="text-xs text-stone-400">Loading…</p>
                      ) : relationships.length === 0 ? (
                        <p className="text-xs text-stone-400 italic">No relationships yet. Add one above.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {relationships.map((rel: any) => {
                            const linked = rel.direction === "outbound" ? rel.targetArticle : rel.sourceArticle;
                            return (
                              <div key={rel.id} className="flex items-start gap-2 bg-stone-50 rounded-lg px-2.5 py-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-stone-700 truncate">{linked?.title ?? `#${linked?.id}`}</p>
                                  <p className="text-[10px] text-stone-400 capitalize">{rel.relationshipType.replace(/-/g, " ")} · {rel.direction}</p>
                                </div>
                                <button onClick={() => removeRelationship(rel.id)} className="text-stone-400 hover:text-red-500 shrink-0 mt-0.5">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}
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

            {/* ── REVISIONS tab ─────────────────────────────────────────────── */}
            {activeTab === "Revisions" && (
              <>
                {isNew ? (
                  <div className="py-6 text-center">
                    <History className="w-8 h-8 text-stone-200 mx-auto mb-2" />
                    <p className="text-xs text-stone-400">Save the article first to start tracking revisions.</p>
                  </div>
                ) : revisionsLoading ? (
                  <div className="py-6 text-center text-xs text-stone-400">Loading revision history…</div>
                ) : revisions.length === 0 ? (
                  <div className="py-6 text-center">
                    <History className="w-8 h-8 text-stone-200 mx-auto mb-2" />
                    <p className="text-xs text-stone-400">No revisions yet. Each save creates a revision.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[11px] text-stone-400 mb-3">
                      {revisions.length} revision{revisions.length !== 1 ? "s" : ""} saved. Restoring overwrites the current title and content.
                    </p>
                    {revisions.map(rev => (
                      <div key={rev.id} className="border border-stone-200 rounded-lg p-3 space-y-1.5 hover:border-stone-300 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-stone-800 truncate leading-snug">{rev.title}</p>
                            <p className="text-[10px] text-stone-400 mt-0.5">
                              {fmtRelative(rev.createdAt)} · {rev.savedBy || "Unknown"}
                            </p>
                          </div>
                          <button
                            onClick={() => restoreRevision(rev.id)}
                            disabled={restoringRevId === rev.id}
                            title="Restore this revision"
                            className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded border border-stone-200 text-[10px] text-stone-600 hover:border-[#4a7c59] hover:text-[#4a7c59] transition-colors disabled:opacity-50"
                          >
                            <RotateCcw className="w-3 h-3" />
                            {restoringRevId === rev.id ? "…" : "Restore"}
                          </button>
                        </div>
                        <p className="text-[10px] text-stone-400">
                          {new Date(rev.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

          </div>
        </div>
      </div>

      {scheduleModal && (
        <ScheduleModal
          initialDateTime={form.scheduledAt || undefined}
          saving={saving}
          onConfirm={scheduleArticle}
          onClose={() => setScheduleModal(false)}
        />
      )}
    </AdminLayout>
  );
}
