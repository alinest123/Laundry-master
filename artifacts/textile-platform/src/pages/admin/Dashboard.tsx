import { useEffect, useState } from "react";
import { Link } from "wouter";
import { FileText, Users, Tag, Folder, Plus, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { AdminLayout } from "./AdminLayout";
import { adminApi } from "@/lib/adminApi";

export function Dashboard() {
  const [stats, setStats] = useState({ total: 0, published: 0, draft: 0, scheduled: 0 });
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.articles.list({ limit: "5" }),
      adminApi.articles.list({ status: "published", limit: "1" }),
      adminApi.articles.list({ status: "draft", limit: "1" }),
      adminApi.articles.list({ status: "scheduled", limit: "1" }),
    ]).then(([all, pub, draft, sched]) => {
      setRecent(all.articles || []);
      setStats({
        total: all.articles?.length || 0,
        published: pub.articles?.length || 0,
        draft: draft.articles?.length || 0,
        scheduled: sched.articles?.length || 0,
      });
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const STATUS_COLORS: Record<string, string> = {
    published: "bg-emerald-100 text-emerald-700",
    draft: "bg-stone-100 text-stone-600",
    scheduled: "bg-blue-100 text-blue-700",
    archived: "bg-red-100 text-red-600",
  };

  return (
    <AdminLayout title="Dashboard" breadcrumbs={[{ label: "Dashboard" }]}>
      <div className="space-y-6">
        {/* Quick actions */}
        <div className="flex items-center gap-3">
          <Link href="/admin/articles/new">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#1c1c1c] text-white text-sm font-medium rounded-md hover:bg-[#333] cursor-pointer transition-colors">
              <Plus className="w-4 h-4" /> New Article
            </span>
          </Link>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Articles", value: stats.total, icon: FileText, color: "bg-stone-50" },
            { label: "Published", value: stats.published, icon: CheckCircle, color: "bg-emerald-50" },
            { label: "Drafts", value: stats.draft, icon: Clock, color: "bg-amber-50" },
            { label: "Scheduled", value: stats.scheduled, icon: TrendingUp, color: "bg-blue-50" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className={`${color} rounded-xl p-4 border border-stone-200`}>
              <Icon className="w-5 h-5 text-stone-500 mb-2" />
              <p className="text-2xl font-bold text-stone-900">{loading ? "—" : value}</p>
              <p className="text-xs text-stone-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Quick nav */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { href: "/admin/articles", label: "Articles", icon: FileText, desc: "Manage all content" },
            { href: "/admin/authors", label: "Authors", icon: Users, desc: "Manage contributors" },
            { href: "/admin/categories", label: "Categories", icon: Folder, desc: "Organize content" },
            { href: "/admin/tags", label: "Tags", icon: Tag, desc: "Label your articles" },
          ].map(({ href, label, icon: Icon, desc }) => (
            <Link key={href} href={href}>
              <div className="bg-white border border-stone-200 rounded-xl p-4 hover:border-stone-300 cursor-pointer transition-colors group">
                <Icon className="w-5 h-5 text-[#4a7c59] mb-3" />
                <p className="text-sm font-semibold text-stone-900 group-hover:text-[#4a7c59] transition-colors">{label}</p>
                <p className="text-xs text-stone-500 mt-0.5">{desc}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent articles */}
        <div className="bg-white rounded-xl border border-stone-200">
          <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-stone-900">Recent Articles</h2>
            <Link href="/admin/articles"><span className="text-xs text-[#4a7c59] hover:underline cursor-pointer">View all →</span></Link>
          </div>
          {loading ? (
            <div className="p-8 text-center text-stone-400 text-sm">Loading…</div>
          ) : recent.length === 0 ? (
            <div className="p-8 text-center text-stone-400 text-sm">No articles yet</div>
          ) : (
            <div className="divide-y divide-stone-50">
              {recent.map((a: any) => (
                <div key={a.id} className="px-5 py-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <Link href={`/admin/articles/${a.id}/edit`}>
                      <p className="text-sm font-medium text-stone-800 truncate hover:text-[#4a7c59] cursor-pointer">{a.title}</p>
                    </Link>
                    <p className="text-xs text-stone-400 mt-0.5">{a.authorName} · {a.updatedAt ? new Date(a.updatedAt).toLocaleDateString() : "—"}</p>
                  </div>
                  <span className={`ml-4 shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[a.status] ?? "bg-stone-100 text-stone-600"}`}>
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
