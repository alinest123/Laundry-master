import { useEffect, useState, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { Plus, Search, Pencil, Trash2, Eye, EyeOff, ExternalLink } from "lucide-react";
import { AdminLayout } from "../AdminLayout";
import { adminApi } from "@/lib/adminApi";

const STATUS_BADGE: Record<string, string> = {
  published: "bg-emerald-100 text-emerald-700 border-emerald-200",
  draft: "bg-stone-100 text-stone-600 border-stone-200",
  scheduled: "bg-blue-100 text-blue-700 border-blue-200",
  archived: "bg-red-100 text-red-600 border-red-200",
};

export function ArticleList() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [, navigate] = useLocation();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: "100" };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const data = await adminApi.articles.list(params);
      setArticles(data.articles || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: number) => {
    try {
      await adminApi.articles.delete(id);
      setDeleteId(null);
      load();
    } catch (e: any) { alert(e.message); }
  };

  const handlePublish = async (id: number, status: string) => {
    try {
      if (status === "published") await adminApi.articles.unpublish(id);
      else await adminApi.articles.publish(id);
      load();
    } catch (e: any) { alert(e.message); }
  };

  return (
    <AdminLayout title="Articles" breadcrumbs={[{ label: "Articles" }]}>
      {/* Delete confirm modal */}
      {deleteId !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-base font-semibold text-stone-900 mb-2">Delete article?</h3>
            <p className="text-sm text-stone-500 mb-5">This action cannot be undone. All associated images, FAQs, references and relations will also be removed.</p>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(deleteId)} className="flex-1 bg-red-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-red-700 transition-colors">Delete</button>
              <button onClick={() => setDeleteId(null)} className="flex-1 border border-stone-200 text-stone-700 text-sm font-medium py-2 rounded-lg hover:bg-stone-50 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              className="w-full pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30 focus:border-[#4a7c59]"
              placeholder="Search articles…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="scheduled">Scheduled</option>
            <option value="archived">Archived</option>
          </select>
          <Link href="/admin/articles/new">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#1c1c1c] text-white text-sm font-medium rounded-lg hover:bg-[#333] cursor-pointer transition-colors whitespace-nowrap">
              <Plus className="w-4 h-4" /> New Article
            </span>
          </Link>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-stone-400 text-sm">Loading…</div>
          ) : articles.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-stone-400 text-sm mb-3">No articles found</p>
              <Link href="/admin/articles/new">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#1c1c1c] text-white text-sm font-medium rounded-lg cursor-pointer">
                  <Plus className="w-4 h-4" /> Create your first article
                </span>
              </Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Title</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide hidden md:table-cell">Author</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide hidden lg:table-cell">Updated</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {articles.map((a: any) => (
                  <tr key={a.id} className="hover:bg-stone-50/50 group">
                    <td className="px-4 py-3">
                      <div className="font-medium text-stone-900 truncate max-w-[280px]">{a.title}</div>
                      <div className="text-xs text-stone-400 mt-0.5">/{a.slug}</div>
                    </td>
                    <td className="px-4 py-3 text-stone-500 hidden md:table-cell">{a.authorName}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_BADGE[a.status] ?? "bg-stone-100 text-stone-600"}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-stone-400 text-xs hidden lg:table-cell">
                      {a.updatedAt ? new Date(a.updatedAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link href={`/admin/articles/${a.id}/edit`}>
                          <span className="p-1.5 rounded hover:bg-stone-100 text-stone-500 hover:text-stone-900 cursor-pointer transition-colors" title="Edit">
                            <Pencil className="w-3.5 h-3.5" />
                          </span>
                        </Link>
                        <button
                          className="p-1.5 rounded hover:bg-stone-100 text-stone-500 hover:text-stone-900 transition-colors"
                          title={a.status === "published" ? "Unpublish" : "Publish"}
                          onClick={() => handlePublish(a.id, a.status)}
                        >
                          {a.status === "published" ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        {a.status === "published" && (
                          <a href={`/articles/${a.slug}`} target="_blank" rel="noreferrer"
                            className="p-1.5 rounded hover:bg-stone-100 text-stone-500 hover:text-stone-900 transition-colors" title="View live">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          className="p-1.5 rounded hover:bg-red-50 text-stone-400 hover:text-red-600 transition-colors"
                          title="Delete"
                          onClick={() => setDeleteId(a.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
