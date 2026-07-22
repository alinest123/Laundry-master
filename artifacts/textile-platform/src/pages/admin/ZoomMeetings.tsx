import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Video } from "lucide-react";
import { AdminLayout } from "./AdminLayout";
import { adminApi } from "@/lib/adminApi";

type Meeting = { id: number; title: string; hostEmail: string; joinUrl?: string; startTime?: string; duration?: number; status: string };
const STATUS_COLORS: Record<string,string> = { scheduled:"bg-blue-100 text-blue-700", started:"bg-emerald-100 text-emerald-700", ended:"bg-stone-100 text-stone-600", cancelled:"bg-red-100 text-red-700" };
const EMPTY = { title:"", hostEmail:"", joinUrl:"", startTime:"", duration:60, status:"scheduled" };

export function ZoomMeetings() {
  const [items, setItems] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number|null>(null);

  const load = async () => { setLoading(true); try { setItems(await adminApi.zoom.list()); } catch {} finally { setLoading(false); } };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing?.title?.trim() || !editing?.hostEmail?.trim()) return alert("Title and host email required");
    setSaving(true);
    try {
      if (isNew) await adminApi.zoom.create(editing);
      else await adminApi.zoom.update(editing.id, editing);
      setEditing(null); setIsNew(false); load();
    } catch(e:any) { alert(e.message); }
    finally { setSaving(false); }
  };

  return (
    <AdminLayout title="Zoom Meetings" breadcrumbs={[{label:"Zoom Meetings"}]}>
      {deleteId !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-base font-semibold mb-2">Delete meeting?</h3>
            <div className="flex gap-3">
              <button onClick={async()=>{await adminApi.zoom.delete(deleteId!);setDeleteId(null);load();}} className="flex-1 bg-red-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-red-700">Delete</button>
              <button onClick={()=>setDeleteId(null)} className="flex-1 border border-stone-200 text-sm font-medium py-2 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-stone-700">Meetings ({items.length})</h2>
            <button onClick={() => { setEditing({...EMPTY}); setIsNew(true); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1c1c1c] text-white text-xs font-medium rounded-lg hover:bg-[#333]">
              <Plus className="w-3.5 h-3.5" /> New Meeting
            </button>
          </div>
          {loading ? <div className="bg-white rounded-xl border p-8 text-center text-stone-400 text-sm">Loading…</div>
          : items.length===0 ? <div className="bg-white rounded-xl border p-8 text-center text-stone-400 text-sm">No meetings yet</div>
          : <div className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-50">
              {items.map(m=>(
                <div key={m.id} className="px-4 py-3 flex items-center gap-3">
                  <Video className="w-4 h-4 text-stone-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-800">{m.title}</p>
                    <p className="text-xs text-stone-400">{m.hostEmail}{m.startTime ? ` · ${new Date(m.startTime).toLocaleString()}` : ""}</p>
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[m.status]??""}`}>{m.status}</span>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditing({...m, startTime: m.startTime ? new Date(m.startTime).toISOString().slice(0,16) : ""}); setIsNew(false); }} className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleteId(m.id)} className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>}
        </div>
        {editing && (
          <div className="bg-white rounded-xl border border-stone-200 p-5 h-fit space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">{isNew ? "New Meeting" : "Edit Meeting"}</h3>
              <button onClick={()=>setEditing(null)}><X className="w-4 h-4 text-stone-400" /></button>
            </div>
            {[["Title","title"],["Host Email","hostEmail"],["Join URL","joinUrl"]].map(([label,field])=>(
              <div key={field}>
                <label className="block text-xs font-medium text-stone-600 mb-1">{label}</label>
                <input type={field==="hostEmail"?"email":"text"} className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30 focus:border-[#4a7c59]"
                  value={editing[field]??""} onChange={e=>setEditing((p:any)=>({...p,[field]:e.target.value}))} />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Start Time</label>
              <input type="datetime-local" className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm"
                value={editing.startTime??""} onChange={e=>setEditing((p:any)=>({...p,startTime:e.target.value}))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Duration (min)</label>
              <input type="number" className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm"
                value={editing.duration??60} onChange={e=>setEditing((p:any)=>({...p,duration:parseInt(e.target.value)||60}))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Status</label>
              <select className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm"
                value={editing.status??""} onChange={e=>setEditing((p:any)=>({...p,status:e.target.value}))}>
                {["scheduled","started","ended","cancelled"].map(s=><option key={s} value={s}>{s}</option>)}
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
