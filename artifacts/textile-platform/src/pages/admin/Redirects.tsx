import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { AdminLayout } from "./AdminLayout";
import { adminApi } from "@/lib/adminApi";

type Redirect = { id: number; fromPath: string; toPath: string; statusCode: number; isActive: boolean };
const EMPTY = { fromPath:"", toPath:"", statusCode:301, isActive:true };

export function Redirects() {
  const [items, setItems] = useState<Redirect[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number|null>(null);

  const load = async () => { setLoading(true); try { setItems(await adminApi.redirects.list()); } catch {} finally { setLoading(false); } };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing?.fromPath?.trim() || !editing?.toPath?.trim()) return alert("Both paths required");
    setSaving(true);
    try {
      if (isNew) await adminApi.redirects.create(editing);
      else await adminApi.redirects.update(editing.id, editing);
      setEditing(null); setIsNew(false); load();
    } catch(e:any) { alert(e.message); }
    finally { setSaving(false); }
  };

  return (
    <AdminLayout title="Redirects" breadcrumbs={[{label:"Redirects"}]}>
      {deleteId !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-base font-semibold mb-2">Delete redirect?</h3>
            <div className="flex gap-3">
              <button onClick={async()=>{await adminApi.redirects.delete(deleteId!);setDeleteId(null);load();}} className="flex-1 bg-red-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-red-700">Delete</button>
              <button onClick={()=>setDeleteId(null)} className="flex-1 border border-stone-200 text-sm font-medium py-2 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-stone-700">Redirects ({items.length})</h2>
            <button onClick={() => { setEditing({...EMPTY}); setIsNew(true); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1c1c1c] text-white text-xs font-medium rounded-lg hover:bg-[#333]">
              <Plus className="w-3.5 h-3.5" /> Add Redirect
            </button>
          </div>
          {loading ? <div className="bg-white rounded-xl border p-8 text-center text-stone-400 text-sm">Loading…</div>
          : items.length===0 ? <div className="bg-white rounded-xl border p-8 text-center text-stone-400 text-sm">No redirects</div>
          : <div className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-50">
              {items.map(r=>(
                <div key={r.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-800 truncate">{r.fromPath} → {r.toPath}</p>
                    <p className="text-xs text-stone-400">{r.statusCode} · {r.isActive ? "Active" : "Inactive"}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditing({...r}); setIsNew(false); }} className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleteId(r.id)} className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>}
        </div>
        {editing && (
          <div className="bg-white rounded-xl border border-stone-200 p-5 h-fit space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">{isNew ? "New Redirect" : "Edit Redirect"}</h3>
              <button onClick={()=>{setEditing(null);setIsNew(false);}}><X className="w-4 h-4 text-stone-400" /></button>
            </div>
            {[["From Path","fromPath"],["To Path","toPath"]].map(([label,field])=>(
              <div key={field}>
                <label className="block text-xs font-medium text-stone-600 mb-1">{label}</label>
                <input placeholder={field==="fromPath"?"/old-url":"/new-url"} className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30 focus:border-[#4a7c59]"
                  value={editing[field]??""} onChange={e=>setEditing((p:any)=>({...p,[field]:e.target.value}))} />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Status Code</label>
              <select className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm" value={editing.statusCode??301} onChange={e=>setEditing((p:any)=>({...p,statusCode:parseInt(e.target.value)}))}>
                <option value={301}>301 Permanent</option>
                <option value={302}>302 Temporary</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="rActive" checked={editing.isActive??true} onChange={e=>setEditing((p:any)=>({...p,isActive:e.target.checked}))} />
              <label htmlFor="rActive" className="text-xs text-stone-600">Active</label>
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
