import { useEffect, useState } from "react";
import { AdminLayout } from "./AdminLayout";
import { adminApi } from "@/lib/adminApi";

type Appointment = { id: number; userName: string; userEmail: string; status: string; scheduledAt: string; notes?: string; zoomLink?: string };
const STATUS_COLORS: Record<string,string> = { pending:"bg-amber-100 text-amber-700", confirmed:"bg-blue-100 text-blue-700", completed:"bg-emerald-100 text-emerald-700", cancelled:"bg-red-100 text-red-700" };
const STATUSES = ["pending","confirmed","completed","cancelled"];

export function Appointments() {
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [editing, setEditing] = useState<Appointment|null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filter) params.status = filter;
      const data = await adminApi.appointments.list(params);
      setItems(data.appointments || []);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [filter]);

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await adminApi.appointments.update(editing.id, { status: editing.status, notes: editing.notes, zoomLink: editing.zoomLink });
      setEditing(null); load();
    } catch(e:any) { alert(e.message); }
    finally { setSaving(false); }
  };

  return (
    <AdminLayout title="Appointments" breadcrumbs={[{label:"Appointments"}]}>
      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl space-y-4">
            <h3 className="text-base font-semibold">Edit Appointment #{editing.id}</h3>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Status</label>
              <select className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm" value={editing.status} onChange={e=>setEditing({...editing,status:e.target.value})}>
                {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Zoom Link</label>
              <input className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm" value={editing.zoomLink??""} onChange={e=>setEditing({...editing,zoomLink:e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Notes</label>
              <textarea className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm resize-none" rows={3} value={editing.notes??""} onChange={e=>setEditing({...editing,notes:e.target.value})} />
            </div>
            <div className="flex gap-3">
              <button onClick={save} disabled={saving} className="flex-1 bg-[#1c1c1c] text-white text-sm font-medium py-2 rounded-lg hover:bg-[#333] disabled:opacity-50">{saving?"Saving…":"Save"}</button>
              <button onClick={()=>setEditing(null)} className="flex-1 border border-stone-200 text-sm font-medium py-2 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <select className="px-3 py-1.5 border border-stone-200 rounded-lg text-sm bg-white" value={filter} onChange={e=>setFilter(e.target.value)}>
            <option value="">All statuses</option>
            {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        {loading ? <div className="bg-white rounded-xl border p-8 text-center text-stone-400 text-sm">Loading…</div>
        : items.length===0 ? <div className="bg-white rounded-xl border p-8 text-center text-stone-400 text-sm">No appointments</div>
        : <div className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-50">
            {items.map(a=>(
              <div key={a.id} className="px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-800">{a.userName}</p>
                  <p className="text-xs text-stone-400">{a.userEmail} · {new Date(a.scheduledAt).toLocaleString()}</p>
                </div>
                <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[a.status]??""}`}>{a.status}</span>
                <button onClick={()=>setEditing(a)} className="text-xs text-[#4a7c59] hover:underline shrink-0">Edit</button>
              </div>
            ))}
          </div>}
      </div>
    </AdminLayout>
  );
}
