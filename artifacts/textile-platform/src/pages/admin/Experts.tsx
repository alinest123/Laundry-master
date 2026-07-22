import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { AdminLayout } from "./AdminLayout";
import { adminApi } from "@/lib/adminApi";

type Expert = { id: number; name: string; title: string; bio: string; avatar?: string; specializations: string[]; rating: string; yearsExperience: number };
const EMPTY = { name:"", title:"", bio:"", avatar:"", specializations:[] as string[], rating:"4.8", sessionCount:0, yearsExperience:10 };

export function Experts() {
  const [items, setItems] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number|null>(null);
  const [specInput, setSpecInput] = useState("");

  const load = async () => { setLoading(true); try { setItems(await adminApi.experts.list()); } catch {} finally { setLoading(false); } };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing?.name?.trim() || !editing?.title?.trim()) return alert("Name and title required");
    setSaving(true);
    try {
      if (isNew) await adminApi.experts.create(editing);
      else await adminApi.experts.update(editing.id, editing);
      setEditing(null); setIsNew(false); load();
    } catch(e:any) { alert(e.message); }
    finally { setSaving(false); }
  };

  const addSpec = () => {
    if (!specInput.trim()) return;
    setEditing((p:any) => ({...p, specializations:[...(p.specializations||[]), specInput.trim()]}));
    setSpecInput("");
  };

  return (
    <AdminLayout title="Experts" breadcrumbs={[{label:"Experts"}]}>
      {deleteId !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-base font-semibold mb-2">Delete expert?</h3>
            <div className="flex gap-3">
              <button onClick={async()=>{await adminApi.experts.delete(deleteId!);setDeleteId(null);load();}} className="flex-1 bg-red-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-red-700">Delete</button>
              <button onClick={()=>setDeleteId(null)} className="flex-1 border border-stone-200 text-sm font-medium py-2 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-stone-700">All Experts ({items.length})</h2>
            <button onClick={() => { setEditing({...EMPTY}); setIsNew(true); setSpecInput(""); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1c1c1c] text-white text-xs font-medium rounded-lg hover:bg-[#333]">
              <Plus className="w-3.5 h-3.5" /> Add Expert
            </button>
          </div>
          {loading ? <div className="bg-white rounded-xl border p-8 text-center text-stone-400 text-sm">Loading…</div>
          : items.length === 0 ? <div className="bg-white rounded-xl border p-8 text-center text-stone-400 text-sm">No experts yet</div>
          : <div className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-50">
              {items.map(ex => (
                <div key={ex.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-800">{ex.name}</p>
                    <p className="text-xs text-stone-400">{ex.title} · ⭐ {ex.rating}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditing({...ex}); setIsNew(false); }} className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleteId(ex.id)} className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>}
        </div>
        {editing && (
          <div className="bg-white rounded-xl border border-stone-200 p-5 h-fit space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">{isNew ? "New Expert" : "Edit Expert"}</h3>
              <button onClick={() => setEditing(null)}><X className="w-4 h-4 text-stone-400" /></button>
            </div>
            {[["Name","name"],["Title","title"],["Avatar URL","avatar"]].map(([label,field]) => (
              <div key={field}>
                <label className="block text-xs font-medium text-stone-600 mb-1">{label}</label>
                <input className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30 focus:border-[#4a7c59]"
                  value={editing[field]??""} onChange={e=>setEditing((p:any)=>({...p,[field]:e.target.value}))} />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Bio</label>
              <textarea className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none resize-none" rows={3}
                value={editing.bio??""} onChange={e=>setEditing((p:any)=>({...p,bio:e.target.value}))} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Rating</label>
                <input type="number" step="0.1" min="0" max="5" className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm"
                  value={editing.rating??""} onChange={e=>setEditing((p:any)=>({...p,rating:e.target.value}))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Years Exp.</label>
                <input type="number" className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm"
                  value={editing.yearsExperience??""} onChange={e=>setEditing((p:any)=>({...p,yearsExperience:parseInt(e.target.value)||0}))} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Specializations</label>
              <div className="flex gap-2 mb-2">
                <input className="flex-1 px-3 py-1.5 border border-stone-200 rounded-lg text-sm" placeholder="Add…"
                  value={specInput} onChange={e=>setSpecInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addSpec();}}} />
                <button onClick={addSpec} type="button" className="px-3 py-1.5 bg-stone-100 text-xs rounded-lg hover:bg-stone-200">Add</button>
              </div>
              <div className="flex flex-wrap gap-1">
                {(editing.specializations||[]).map((s:string,i:number)=>(
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#4a7c59]/10 text-[#4a7c59] text-xs rounded-full">
                    {s} <button onClick={()=>setEditing((p:any)=>({...p,specializations:p.specializations.filter((_:any,j:number)=>j!==i)}))}>×</button>
                  </span>
                ))}
              </div>
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
