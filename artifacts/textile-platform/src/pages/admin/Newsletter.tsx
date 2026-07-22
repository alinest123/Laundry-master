import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { AdminLayout } from "./AdminLayout";
import { adminApi } from "@/lib/adminApi";

type Subscriber = { id: number; email: string; name?: string; subscribedAt: string };

export function Newsletter() {
  const [items, setItems] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const load = async () => { setLoading(true); try { const d = await adminApi.newsletter.list(); setItems(d.subscribers||[]); } catch {} finally { setLoading(false); } };
  useEffect(() => { load(); }, []);

  const toggleSelect = (id: number) => setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const toggleAll = () => setSelected(selected.size === items.length ? new Set() : new Set(items.map(i=>i.id)));

  const deleteOne = async (id: number) => {
    if (!confirm("Delete subscriber?")) return;
    try { await adminApi.newsletter.deleteOne(id); load(); } catch(e:any) { alert(e.message); }
  };

  const bulkDelete = async () => {
    if (!selected.size || !confirm(`Delete ${selected.size} subscribers?`)) return;
    setDeleting(true);
    try { await adminApi.newsletter.bulkDelete([...selected]); setSelected(new Set()); load(); } catch(e:any) { alert(e.message); }
    finally { setDeleting(false); }
  };

  return (
    <AdminLayout title="Newsletter" breadcrumbs={[{label:"Newsletter"}]}>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-stone-600">{items.length} subscribers</span>
          {selected.size > 0 && (
            <button onClick={bulkDelete} disabled={deleting} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 disabled:opacity-50">
              <Trash2 className="w-3.5 h-3.5" /> Delete {selected.size} selected
            </button>
          )}
        </div>
        {loading ? <div className="bg-white rounded-xl border p-8 text-center text-stone-400 text-sm">Loading…</div>
        : items.length===0 ? <div className="bg-white rounded-xl border p-8 text-center text-stone-400 text-sm">No subscribers yet</div>
        : <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-stone-100 flex items-center gap-3">
              <input type="checkbox" checked={selected.size===items.length&&items.length>0} onChange={toggleAll} className="rounded" />
              <span className="text-xs font-medium text-stone-500">Select all</span>
            </div>
            <div className="divide-y divide-stone-50">
              {items.map(s=>(
                <div key={s.id} className="px-4 py-2.5 flex items-center gap-3">
                  <input type="checkbox" checked={selected.has(s.id)} onChange={()=>toggleSelect(s.id)} className="rounded" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-stone-800">{s.email}</p>
                    {s.name && <p className="text-xs text-stone-400">{s.name}</p>}
                  </div>
                  <p className="text-xs text-stone-400 shrink-0">{new Date(s.subscribedAt).toLocaleDateString()}</p>
                  <button onClick={()=>deleteOne(s.id)} className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          </div>}
      </div>
    </AdminLayout>
  );
}
