import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  FileText, Users, Tag, Folder, Plus, CheckCircle, Clock, Archive,
  Calendar, CreditCard, Mail, Image, MessageCircle, UserCog, Eye,
  TrendingUp, AlertTriangle, ChevronRight, Check, Trash2,
  Pencil, BookOpen, LayoutDashboard, Settings,
} from "lucide-react";
import { AdminLayout } from "./AdminLayout";
import { adminApi, generateSlug } from "@/lib/adminApi";
import { useAuth } from "@/lib/auth";

interface DashStats {
  articles: { published: number; draft: number; scheduled: number; archived: number };
  categories: number; tags: number; authors: number; pendingComments: number;
  users: number; media: number; subscribers: number; payments: number;
}
interface Activity {
  recentPublished: { id: number; title: string; slug: string; publishedAt: string | null; authorName: string | null }[];
  scheduled:       { id: number; title: string; slug: string; scheduledAt: string | null; authorName: string | null }[];
  pendingComments: { id: number; authorName: string; content: string; createdAt: string; articleTitle: string | null; articleId: number }[];
}

const fmt = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`bg-[#e8e8e5] animate-pulse rounded-lg ${className}`} />
);

export function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats]           = useState<DashStats | null>(null);
  const [activity, setActivity]     = useState<Activity | null>(null);
  const [pendingComments, setPendingComments] = useState<Activity["pendingComments"]>([]);
  const [topArticles, setTopArticles] = useState<any[]>([]);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [allArticles, setAllArticles]   = useState<any[]>([]);
  const [authors, setAuthors]           = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  // Quick draft
  const [draft, setDraft]           = useState({ title: "", content: "", authorId: "" });
  const [draftSaving, setDraftSaving] = useState(false);
  const [draftSaved, setDraftSaved]   = useState<{ id: number; title: string } | null>(null);

  useEffect(() => {
    Promise.all([
      adminApi.dashboard.stats(),
      adminApi.dashboard.activity(),
      adminApi.dashboard.topArticles(),
      adminApi.dashboard.upcomingAppointments(),
      adminApi.articles.list({ limit: "200" }),
      adminApi.authors.list(),
    ]).then(([s, act, top, appt, articlesResp, authList]) => {
      setStats(s);
      setActivity(act);
      setPendingComments(act.pendingComments ?? []);
      setTopArticles(top ?? []);
      setUpcomingCount(appt?.count ?? 0);
      setAllArticles(articlesResp?.articles ?? []);
      setAuthors(authList ?? []);
      if (authList?.[0]) setDraft(d => ({ ...d, authorId: String(authList[0].id) }));
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  // Content health
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const healthIssues = allArticles.flatMap(a => {
    const issues: { id: number; title: string; issue: string; filter: string }[] = [];
    if (!a.featuredImage)
      issues.push({ id: a.id, title: a.title, issue: "Missing featured image", filter: "no-image" });
    if (!a.excerpt)
      issues.push({ id: a.id, title: a.title, issue: "Missing excerpt", filter: "no-excerpt" });
    if (a.status === "draft" && a.updatedAt && new Date(a.updatedAt) < thirtyDaysAgo)
      issues.push({ id: a.id, title: a.title, issue: "Stale draft (30+ days)", filter: "stale" });
    return issues;
  }).slice(0, 8);

  const approveComment = async (id: number) => {
    try { await adminApi.comments.approve(id); } catch { /* continue */ }
    setPendingComments(p => p.filter(c => c.id !== id));
  };
  const trashComment = async (id: number) => {
    try { await adminApi.comments.delete(id); } catch { /* continue */ }
    setPendingComments(p => p.filter(c => c.id !== id));
  };

  const saveDraft = async () => {
    if (!draft.title.trim()) return;
    setDraftSaving(true);
    try {
      const result = await adminApi.articles.create({
        title:       draft.title,
        content:     draft.content || "",
        slug:        generateSlug(draft.title),
        status:      "draft",
        authorId:    parseInt(draft.authorId) || 1,
        readingTime: 1,
      });
      setDraftSaved({ id: result.id, title: draft.title });
      setDraft(d => ({ ...d, title: "", content: "" }));
    } catch (e: any) { alert(e.message); }
    finally { setDraftSaving(false); }
  };

  const STAT_TILES = stats ? [
    { label: "Published",     value: stats.articles.published, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50",  href: "/admin/articles?status=published" },
    { label: "Drafts",        value: stats.articles.draft,     icon: Clock,        color: "text-amber-600",  bg: "bg-amber-50",    href: "/admin/articles?status=draft" },
    { label: "Scheduled",     value: stats.articles.scheduled, icon: Calendar,     color: "text-blue-600",   bg: "bg-blue-50",     href: "/admin/articles?status=scheduled" },
    { label: "Archived",      value: stats.articles.archived,  icon: Archive,      color: "text-stone-500",  bg: "bg-stone-100",   href: "/admin/articles?status=archived" },
    { label: "Categories",    value: stats.categories,          icon: Folder,       color: "text-violet-600", bg: "bg-violet-50",   href: "/admin/categories" },
    { label: "Tags",          value: stats.tags,                icon: Tag,          color: "text-pink-600",   bg: "bg-pink-50",     href: "/admin/tags" },
    { label: "Authors",       value: stats.authors,             icon: BookOpen,     color: "text-indigo-600", bg: "bg-indigo-50",   href: "/admin/authors" },
    { label: "Comments",      value: stats.pendingComments,     icon: MessageCircle,color: "text-orange-600", bg: "bg-orange-50",   href: "/admin/comments" },
    { label: "Users",         value: stats.users,               icon: UserCog,      color: "text-cyan-600",   bg: "bg-cyan-50",     href: "/admin/users" },
    { label: "Media",         value: stats.media,               icon: Image,        color: "text-teal-600",   bg: "bg-teal-50",     href: "/admin/media" },
    { label: "Subscribers",   value: stats.subscribers,         icon: Mail,         color: "text-rose-600",   bg: "bg-rose-50",     href: "/admin/newsletter" },
    { label: "Payments",      value: stats.payments,            icon: CreditCard,   color: "text-[#4a7c59]",  bg: "bg-green-50",    href: "/admin/payments" },
  ] : [];

  return (
    <AdminLayout title="Dashboard" breadcrumbs={[{ label: "Dashboard" }]}>
      <div className="space-y-5 max-w-[1400px]">

        {/* ── At a Glance ────────────────────────────────────────────── */}
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.12em] mb-3">At a Glance</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {loading
              ? Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-[#eee] p-4 shadow-sm">
                    <Skeleton className="w-9 h-9 mb-3" />
                    <Skeleton className="w-10 h-7 mb-1.5" />
                    <Skeleton className="w-16 h-3" />
                  </div>
                ))
              : STAT_TILES.map(({ label, value, icon: Icon, color, bg, href }) => (
                  <Link key={label} href={href}>
                    <div className="bg-white border border-[#eee] rounded-2xl p-4 hover:shadow-md transition-shadow cursor-pointer flex flex-col gap-3 shadow-sm">
                      <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center`}>
                        <Icon className={`w-[18px] h-[18px] ${color}`} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-[#1a1a1a] leading-none mb-1">{value}</p>
                        <p className="text-xs text-muted-foreground leading-tight">{label}</p>
                      </div>
                    </div>
                  </Link>
                ))
            }
          </div>
        </div>

        {/* ── Main grid: Activity + Quick Draft ─────────────────────── */}
        <div className="grid lg:grid-cols-3 gap-5">

          {/* Activity (2/3 width) */}
          <div className="lg:col-span-2 space-y-4">

            {/* Recently Published */}
            <div className="bg-white rounded-2xl border border-[#eee] overflow-hidden shadow-sm">
              <div className="px-5 py-3.5 border-b border-[#f0f0f0] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-sm font-semibold text-[#1a1a1a]">Recently Published</h3>
                </div>
                <Link href="/admin/articles?status=published">
                  <span className="text-xs text-primary hover:underline cursor-pointer">View all →</span>
                </Link>
              </div>
              {loading ? (
                <div className="divide-y divide-[#f8f8f8]">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="px-5 py-3 flex items-center gap-3">
                      <Skeleton className="flex-1 h-4" /><Skeleton className="w-20 h-3" />
                    </div>
                  ))}
                </div>
              ) : (activity?.recentPublished?.length ?? 0) === 0 ? (
                <p className="px-5 py-6 text-sm text-muted-foreground text-center">No published articles yet.</p>
              ) : (
                <div className="divide-y divide-[#f8f8f8]">
                  {activity!.recentPublished.map(a => (
                    <div key={a.id} className="px-5 py-3 flex items-center gap-3 group">
                      <FileText className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <Link href={`/admin/articles/${a.id}/edit`}>
                          <p className="text-sm font-medium text-[#1a1a1a] truncate hover:text-primary cursor-pointer">{a.title}</p>
                        </Link>
                        <p className="text-[11px] text-muted-foreground">{a.authorName ?? "Unknown"} · {fmt(a.publishedAt)}</p>
                      </div>
                      <Link href={`/admin/articles/${a.id}/edit`}>
                        <Pencil className="w-3 h-3 text-muted-foreground/30 hover:text-[#555] cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming Scheduled */}
            <div className="bg-white rounded-2xl border border-[#eee] overflow-hidden shadow-sm">
              <div className="px-5 py-3.5 border-b border-[#f0f0f0] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <h3 className="text-sm font-semibold text-[#1a1a1a]">Upcoming Scheduled</h3>
                </div>
                <Link href="/admin/articles?status=scheduled">
                  <span className="text-xs text-primary hover:underline cursor-pointer">View all →</span>
                </Link>
              </div>
              {loading ? (
                <div className="divide-y divide-[#f8f8f8]">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="px-5 py-3 flex items-center gap-3">
                      <Skeleton className="flex-1 h-4" /><Skeleton className="w-24 h-3" />
                    </div>
                  ))}
                </div>
              ) : (activity?.scheduled?.length ?? 0) === 0 ? (
                <p className="px-5 py-6 text-sm text-muted-foreground text-center">No scheduled articles.</p>
              ) : (
                <div className="divide-y divide-[#f8f8f8]">
                  {activity!.scheduled.map(a => (
                    <div key={a.id} className="px-5 py-3 flex items-center gap-3">
                      <Calendar className="w-3.5 h-3.5 text-blue-300 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <Link href={`/admin/articles/${a.id}/edit`}>
                          <p className="text-sm font-medium text-[#1a1a1a] truncate hover:text-primary cursor-pointer">{a.title}</p>
                        </Link>
                        <p className="text-[11px] text-muted-foreground">{a.authorName ?? "Unknown"}</p>
                      </div>
                      <span className="text-[11px] text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-lg shrink-0">{fmt(a.scheduledAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pending Comments */}
            <div className="bg-white rounded-2xl border border-[#eee] overflow-hidden shadow-sm">
              <div className="px-5 py-3.5 border-b border-[#f0f0f0] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-orange-500" />
                  <h3 className="text-sm font-semibold text-[#1a1a1a]">Pending Comments</h3>
                  {pendingComments.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-600">
                      {pendingComments.length}
                    </span>
                  )}
                </div>
                <Link href="/admin/comments">
                  <span className="text-xs text-primary hover:underline cursor-pointer">Manage all →</span>
                </Link>
              </div>
              {loading ? (
                <div className="divide-y divide-[#f8f8f8]">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="px-5 py-3.5 space-y-1.5">
                      <Skeleton className="w-32 h-3" /><Skeleton className="w-full h-3" />
                    </div>
                  ))}
                </div>
              ) : pendingComments.length === 0 ? (
                <div className="px-5 py-6 text-center">
                  <CheckCircle className="w-8 h-8 text-emerald-200 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">All caught up — no pending comments.</p>
                </div>
              ) : (
                <div className="divide-y divide-[#f8f8f8]">
                  {pendingComments.map(c => (
                    <div key={c.id} className="px-5 py-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-semibold text-[#1a1a1a] truncate">
                            {c.authorName}
                            {c.articleTitle && (
                              <span className="font-normal text-muted-foreground"> on "{c.articleTitle}"</span>
                            )}
                          </p>
                          <p className="text-xs text-[#555] mt-0.5 line-clamp-2 leading-relaxed">
                            {c.content.slice(0, 120)}{c.content.length > 120 ? "…" : ""}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1">{fmt(c.createdAt)}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 mt-0.5">
                          <button onClick={() => approveComment(c.id)}
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors" title="Approve">
                            <Check className="w-3 h-3" />
                          </button>
                          <button onClick={() => trashComment(c.id)}
                            className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors" title="Trash">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column: Quick Draft + Site Overview */}
          <div className="space-y-4">

            {/* Quick Draft */}
            <div className="bg-white rounded-2xl border border-[#eee] overflow-hidden shadow-sm">
              <div className="px-5 py-3.5 border-b border-[#f0f0f0] flex items-center gap-2">
                <Pencil className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-[#1a1a1a]">Quick Draft</h3>
              </div>
              <div className="p-5 space-y-3">
                {draftSaved ? (
                  <div className="text-center py-2 space-y-2">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                    <p className="text-sm font-semibold text-[#1a1a1a]">Draft saved!</p>
                    <p className="text-xs text-muted-foreground">"{draftSaved.title}"</p>
                    <div className="flex gap-2">
                      <Link href={`/admin/articles/${draftSaved.id}/edit`} className="flex-1">
                        <span className="block text-center px-3 py-1.5 bg-[#1a1a1a] text-white text-xs font-medium rounded-lg hover:bg-[#333] transition-colors cursor-pointer">
                          Open Editor
                        </span>
                      </Link>
                      <button onClick={() => setDraftSaved(null)}
                        className="flex-1 px-3 py-1.5 border border-[#e0e0e0] text-xs font-medium rounded-lg hover:bg-[#f5f5f2] transition-colors">
                        New Draft
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Title</label>
                      <input
                        className="w-full px-3 py-2 border border-[#e0e0e0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                        placeholder="Article title…"
                        value={draft.title}
                        onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Content</label>
                      <textarea
                        className="w-full px-3 py-2 border border-[#e0e0e0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none bg-white"
                        rows={5}
                        placeholder="Start writing…"
                        value={draft.content}
                        onChange={e => setDraft(d => ({ ...d, content: e.target.value }))}
                      />
                    </div>
                    {authors.length > 0 && (
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Author</label>
                        <select
                          className="w-full px-3 py-2 border border-[#e0e0e0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                          value={draft.authorId}
                          onChange={e => setDraft(d => ({ ...d, authorId: e.target.value }))}
                        >
                          {authors.map((a: any) => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <button
                      onClick={saveDraft}
                      disabled={draftSaving || !draft.title.trim()}
                      className="w-full py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      {draftSaving ? "Saving…" : "Save Draft"}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Site Overview */}
            <div className="bg-white rounded-2xl border border-[#eee] overflow-hidden shadow-sm">
              <div className="px-5 py-3.5 border-b border-[#f0f0f0] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-[#1a1a1a]">Site Overview</h3>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-rose-50 rounded-xl p-3 text-center">
                    <Mail className="w-4 h-4 text-rose-500 mx-auto mb-1.5" />
                    <p className="text-lg font-bold text-[#1a1a1a]">{loading ? "—" : (stats?.subscribers ?? 0)}</p>
                    <p className="text-[10px] text-muted-foreground">Subscribers</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-3 text-center">
                    <Calendar className="w-4 h-4 text-blue-500 mx-auto mb-1.5" />
                    <p className="text-lg font-bold text-[#1a1a1a]">{loading ? "—" : upcomingCount}</p>
                    <p className="text-[10px] text-muted-foreground">Appointments</p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em] mb-2">Top Articles by Views</p>
                  {loading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
                    </div>
                  ) : topArticles.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-2">No data yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {topArticles.map((a, i) => (
                        <div key={a.id} className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-muted-foreground w-4 shrink-0">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <Link href={`/admin/articles/${a.id}/edit`}>
                              <p className="text-xs text-[#333] truncate hover:text-primary cursor-pointer">{a.title}</p>
                            </Link>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Eye className="w-3 h-3 text-muted-foreground/40" />
                            <span className="text-[11px] font-medium text-muted-foreground">{a.views ?? 0}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ── Content Health ──────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-[#eee] overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 border-b border-[#f0f0f0] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-[#1a1a1a]">Content Health</h3>
              {!loading && healthIssues.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-600">
                  {healthIssues.length} issue{healthIssues.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <Link href="/admin/articles">
              <span className="text-xs text-primary hover:underline cursor-pointer">View articles →</span>
            </Link>
          </div>
          {loading ? (
            <div className="p-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : healthIssues.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <CheckCircle className="w-10 h-10 text-emerald-200 mx-auto mb-2" />
              <p className="text-sm font-medium text-[#1a1a1a]">Everything looks great!</p>
              <p className="text-xs text-muted-foreground mt-1">All your articles have images, excerpts, and are up to date.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#f8f8f8]">
              {healthIssues.map((issue, i) => (
                <div key={i} className="px-5 py-3 flex items-center gap-3">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <Link href={`/admin/articles/${issue.id}/edit`}>
                      <p className="text-sm text-[#1a1a1a] truncate hover:text-primary cursor-pointer">{issue.title}</p>
                    </Link>
                    <p className="text-[11px] text-amber-600 font-medium">{issue.issue}</p>
                  </div>
                  <Link href={`/admin/articles/${issue.id}/edit`}>
                    <span className="shrink-0 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary cursor-pointer transition-colors">
                      Fix <ChevronRight className="w-3 h-3" />
                    </span>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Quick Nav ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { href: "/admin/articles/new", icon: Plus,     label: "New Article",  dark: true },
            { href: "/admin/articles",     icon: FileText, label: "All Articles", dark: false },
            { href: "/admin/categories",   icon: Folder,   label: "Categories",   dark: false },
            { href: "/admin/media",        icon: Image,    label: "Media",        dark: false },
            { href: "/admin/users",        icon: Users,    label: "Users",        dark: false },
            { href: "/admin/settings",     icon: Settings, label: "Settings",     dark: false },
          ].map(({ href, icon: Icon, label, dark }) => (
            <Link key={href} href={href}>
              <div className={`${dark ? "bg-[#1a1a1a]" : "bg-white"} border border-[#e0e0e0] rounded-2xl p-3.5 flex items-center gap-2.5 hover:shadow-md transition-shadow cursor-pointer shadow-sm`}>
                <Icon className={`w-4 h-4 shrink-0 ${dark ? "text-white" : "text-primary"}`} />
                <span className={`text-xs font-semibold truncate ${dark ? "text-white" : "text-[#1a1a1a]"}`}>{label}</span>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </AdminLayout>
  );
}
