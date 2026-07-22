import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { AdminLayout } from "./AdminLayout";
import { adminApi } from "@/lib/adminApi";

type Stain = { id: number; name: string; slug: string; description?: string; difficulty: string; createdAt: string };
const DIFFICULTIES = ["easy","medium","hard"];
const DIFF_COLORS: Record<string,string> = { easy:"bg-emerald-100 text-emerald-700", medium:"bg-amber-100 text-amber-700", hard:"bg-red-100 text-red-700" };
const EMPTY = { name:"", slug:"", description:"", difficulty:"medium" };

export function Stains() {
  const [items, setItems] = useState<Stain[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number|null>(null);

  const load = async () => { setLoading(true); try { setItems(await adminApi.stains.list()); } catch {} finally { setLoading(false); } };
  useEffect(() => { load(); }, []);

  const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");

  const save = async () => {
    if (!editing?.name?.trim()) return alert("Name required");
    setSaving(true);
    try {
      if (isNew) await adminApi.stains.create(editing);
      else await adminApi.stains.update(editing.id, editing);
      setEditing(null); setIsNew(false); load();
    } catch(e:any) { alert(e.message); }
    finally { setSaving(false); }
  };

  return (
    <AdminLayout title="Stains" breadcrumbs={[{label:"Stains"}]}>
      {deleteId !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-base font-semibold mb-2">Delete stain?</h3>
            <p className="text-sm text-stone-500 mb-5">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={async()=>{await adminApi.stains.delete(deleteId!);setDeleteId(null);load();}} className="flex-1 bg-red-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-red-700">Delete</button>
              <button onClick={()=>setDeleteId(null)} className="flex-1 border border-stone-200 text-sm font-medium py-2 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-stone-700">All Stains ({items.length})</h2>
            <button onClick={() => { setEditing({...EMPTY}); setIsNew(true); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1c1c1c] text-white text-xs font-medium rounded-lg hover:bg-[#333]">
              <Plus className="w-3.5 h-3.5" /> Add Stain
            </button>
          </div>
          {loading ? <div className="bg-white rounded-xl border border-stone-200 p-8 text-center text-stone-400 text-sm">Loading…</div>
          : items.length === 0 ? <div className="bg-white rounded-xl border border-stone-200 p-8 text-center text-stone-400 text-sm">No stains yet</div>
          : <div className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-50">
              {items.map(s => (
                <div key={s.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-800">{s.name}</p>
                    <p className="text-xs text-stone-400">{s.slug}</p>
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${DIFF_COLORS[s.difficulty]??""}`}>{s.difficulty}</span>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditing({...s}); setIsNew(false); }} className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleteId(s.id)} className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>}
        </div>
        {editing && (
          <div className="bg-white rounded-xl border border-stone-200 p-5 h-fit space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">{isNew ? "New Stain" : "Edit Stain"}</h3>
              <button onClick={() => { setEditing(null); setIsNew(false); }}><X className="w-4 h-4 text-stone-400" /></button>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Name</label>
              <input className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30 focus:border-[#4a7c59]"
                value={editing.name ?? ""} onChange={e => setEditing((p:any) => ({...p,name:e.target.value, slug: isNew ? slugify(e.target.value) : p.slug}))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Slug</label>
              <input className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30 focus:border-[#4a7c59]"
                value={editing.slug ?? ""} onChange={e => setEditing((p:any) => ({...p,slug:e.target.value}))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Description</label>
              <textarea className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30 focus:border-[#4a7c59] resize-none" rows={3}
                value={editing.description ?? ""} onChange={e => setEditing((p:any) => ({...p,description:e.target.value}))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Difficulty</label>
              <select className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30 focus:border-[#4a7c59]"
                value={editing.difficulty ?? "medium"} onChange={e => setEditing((p:any) => ({...p,difficulty:e.target.value}))}>
                {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <button onClick={save} disabled={saving} className="w-full bg-[#1c1c1c] text-white text-sm font-medium py-2 rounded-lg hover:bg-[#333] disabled:opacity-50">
              {saving ? "Saving…" : isNew ? "Create" : "Save Changes"}
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
