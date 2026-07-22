import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { AdminLayout } from "./AdminLayout";
import { adminApi, generateSlug } from "@/lib/adminApi";

type Tag = { id: number; name: string; slug: string; articleCount: number };

export function Tags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try { setTags(await adminApi.tags.list()); } catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await adminApi.tags.create({ name: name.trim(), slug: slug || generateSlug(name) });
      setName(""); setSlug(""); load();
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  };

  const update = async () => {
    if (!editName.trim() || editingId === null) return;
    setSaving(true);
    try {
      await adminApi.tags.update(editingId, { name: editName, slug: editSlug || generateSlug(editName) });
      setEditingId(null); load();
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  };

  const del = async () => {
    if (!deleteId) return;
    try { await adminApi.tags.delete(deleteId); setDeleteId(null); load(); } catch (e: any) { alert(e.message); }
  };

  return (
    <AdminLayout title="Tags" breadcrumbs={[{ label: "Tags" }]}>
      {deleteId !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-base font-semibold mb-2">Delete tag?</h3>
            <p className="text-sm text-stone-500 mb-5">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={del} className="flex-1 bg-red-600 text-white text-sm font-medium py-2 rounded-lg">Delete</button>
              <button onClick={() => setDeleteId(null)} className="flex-1 border border-stone-200 text-sm font-medium py-2 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          {loading ? (
            <div className="bg-white rounded-xl border border-stone-200 p-8 text-center text-stone-400 text-sm">Loading…</div>
          ) : (
            <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-stone-100 bg-stone-50">
                <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">All Tags ({tags.length})</span>
              </div>
              {tags.length === 0 ? (
                <div className="p-8 text-center text-stone-400 text-sm">No tags yet</div>
              ) : (
                <div className="divide-y divide-stone-50">
                  {tags.map(t => (
                    <div key={t.id} className="px-4 py-3 flex items-center gap-3">
                      {editingId === t.id ? (
                        <>
                          <div className="flex flex-col sm:flex-row flex-1 gap-1.5 min-w-0">
                            <input className="flex-1 min-w-0 px-2 py-1 border border-stone-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30"
                              value={editName} onChange={e => { setEditName(e.target.value); setEditSlug(generateSlug(e.target.value)); }} />
                            <input className="w-full sm:w-32 px-2 py-1 border border-stone-200 rounded text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30"
                              value={editSlug} onChange={e => setEditSlug(e.target.value)} placeholder="slug" />
                          </div>
                          <button onClick={update} disabled={saving} className="p-1.5 rounded bg-[#4a7c59] text-white hover:bg-[#3d6849]"><Check className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setEditingId(null)} className="p-1.5 rounded hover:bg-stone-100 text-stone-400"><X className="w-3.5 h-3.5" /></button>
                        </>
                      ) : (
                        <>
                          <span className="flex-1">
                            <span className="text-sm font-medium text-stone-800">{t.name}</span>
                            <span className="ml-2 text-xs text-stone-400 font-mono">/{t.slug}</span>
                          </span>
                          <span className="text-xs text-stone-400">{t.articleCount} articles</span>
                          <button onClick={() => { setEditingId(t.id); setEditName(t.name); setEditSlug(t.slug); }}
                            className="p-1.5 rounded hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDeleteId(t.id)}
                            className="p-1.5 rounded hover:bg-red-50 text-stone-400 hover:text-red-600 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-stone-200 p-5 h-fit sticky top-4">
          <h3 className="text-sm font-semibold text-stone-900 mb-4">Add New Tag</h3>
          <form onSubmit={create} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Tag Name *</label>
              <input className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30"
                value={name} onChange={e => { setName(e.target.value); setSlug(generateSlug(e.target.value)); }}
                placeholder="e.g. Fabric Science" />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Slug</label>
              <input className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30"
                value={slug} onChange={e => setSlug(e.target.value)} placeholder="fabric-science" />
            </div>
            <button type="submit" disabled={saving || !name.trim()}
              className="w-full flex items-center justify-center gap-2 py-2 bg-[#4a7c59] text-white text-sm font-medium rounded-lg hover:bg-[#3d6849] disabled:opacity-60 transition-colors">
              <Plus className="w-4 h-4" />
              {saving ? "Adding…" : "Add Tag"}
            </button>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
