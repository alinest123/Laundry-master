import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Check, ChevronRight } from "lucide-react";
import { AdminLayout } from "./AdminLayout";
import { adminApi, generateSlug } from "@/lib/adminApi";

type Cat = { id: number; name: string; slug: string; description?: string; featuredImage?: string; parentId?: number | null; subcategories?: Cat[] };
const EMPTY = { name: "", slug: "", description: "", featuredImage: "", parentId: null as number | null };

export function Categories() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [flat, setFlat] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Cat> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [nested, flatList] = await Promise.all([adminApi.categories.list(), adminApi.categories.flat()]);
      setCats(nested); setFlat(flatList);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing?.name?.trim()) return alert("Name is required");
    if (!editing?.slug?.trim()) return alert("Slug is required");
    setSaving(true);
    try {
      if (isNew) await adminApi.categories.create(editing);
      else await adminApi.categories.update(editing!.id!, editing);
      setEditing(null); setIsNew(false); load();
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  };

  const del = async () => {
    if (!deleteId) return;
    try { await adminApi.categories.delete(deleteId); setDeleteId(null); load(); } catch (e: any) { alert(e.message); }
  };

  const Field = ({ label, field, textarea = false }: { label: string; field: keyof typeof EMPTY; textarea?: boolean }) => (
    <div>
      <label className="block text-xs font-medium text-stone-600 mb-1">{label}</label>
      {textarea ? (
        <textarea className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30 resize-none" rows={2}
          value={(editing as any)?.[field] ?? ""} onChange={e => setEditing(p => ({ ...p, [field]: e.target.value }))} />
      ) : (
        <input className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30"
          value={(editing as any)?.[field] ?? ""} onChange={e => setEditing(p => ({ ...p, [field]: e.target.value }))} />
      )}
    </div>
  );

  return (
    <AdminLayout title="Categories" breadcrumbs={[{ label: "Categories" }]}>
      {deleteId !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-base font-semibold mb-2">Delete category?</h3>
            <p className="text-sm text-stone-500 mb-5">Subcategories will be orphaned. This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={del} className="flex-1 bg-red-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-red-700 transition-colors">Delete</button>
              <button onClick={() => setDeleteId(null)} className="flex-1 border border-stone-200 text-sm font-medium py-2 rounded-lg hover:bg-stone-50 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-stone-700">Categories ({flat.length})</h2>
            <button onClick={() => { setEditing({ ...EMPTY }); setIsNew(true); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1c1c1c] text-white text-xs font-medium rounded-lg hover:bg-[#333] transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add Category
            </button>
          </div>
          {loading ? (
            <div className="bg-white rounded-xl border border-stone-200 p-8 text-center text-stone-400 text-sm">Loading…</div>
          ) : cats.length === 0 ? (
            <div className="bg-white rounded-xl border border-stone-200 p-8 text-center text-stone-400 text-sm">No categories yet</div>
          ) : (
            <div className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-50">
              {cats.map(cat => (
                <div key={cat.id}>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-stone-900">{cat.name}</p>
                      <p className="text-xs text-stone-400">/{cat.slug}{cat.subcategories?.length ? ` · ${cat.subcategories.length} subcategories` : ""}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditing({ ...cat }); setIsNew(false); }}
                        className="p-1.5 rounded hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteId(cat.id)}
                        className="p-1.5 rounded hover:bg-red-50 text-stone-400 hover:text-red-600 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {cat.subcategories?.map(sub => (
                    <div key={sub.id} className="flex items-center gap-3 px-4 py-2.5 bg-stone-50/50 border-t border-stone-50">
                      <ChevronRight className="w-3.5 h-3.5 text-stone-300 ml-4 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-stone-700">{sub.name}</p>
                        <p className="text-xs text-stone-400">/{sub.slug}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setEditing({ ...sub }); setIsNew(false); }}
                          className="p-1.5 rounded hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteId(sub.id)}
                          className="p-1.5 rounded hover:bg-red-50 text-stone-400 hover:text-red-600 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          {editing ? (
            <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-4 sticky top-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{isNew ? "New Category" : "Edit Category"}</h3>
                <button onClick={() => { setEditing(null); setIsNew(false); }}><X className="w-4 h-4 text-stone-400" /></button>
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Name *</label>
                <input className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30"
                  value={editing.name ?? ""} onChange={e => setEditing(p => ({ ...p, name: e.target.value, slug: generateSlug(e.target.value) }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Slug *</label>
                <input className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30 font-mono"
                  value={editing.slug ?? ""} onChange={e => setEditing(p => ({ ...p, slug: e.target.value }))} />
              </div>
              <Field label="Description" field="description" textarea />
              <Field label="Featured Image URL" field="featuredImage" />
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Parent Category (optional)</label>
                <select className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30"
                  value={editing.parentId ?? ""} onChange={e => setEditing(p => ({ ...p, parentId: e.target.value ? parseInt(e.target.value) : null }))}>
                  <option value="">— None (top-level) —</option>
                  {flat.filter(c => c.id !== editing.id && !c.parentId).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <button onClick={save} disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-2 bg-[#4a7c59] text-white text-sm font-medium rounded-lg hover:bg-[#3d6849] disabled:opacity-60 transition-colors">
                <Check className="w-4 h-4" />
                {saving ? "Saving…" : isNew ? "Create Category" : "Save Changes"}
              </button>
            </div>
          ) : (
            <div className="bg-stone-50 rounded-xl border border-dashed border-stone-300 p-8 text-center">
              <p className="text-sm text-stone-400">Select a category to edit or create a new one</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
