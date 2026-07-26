import { useEffect, useState } from "react";
import { Trash2, X, AlertTriangle } from "lucide-react";
import { AdminLayout } from "./AdminLayout";
import { adminApi } from "@/lib/adminApi";
import { useToast } from "@/hooks/use-toast";

type Subscriber = { id: number; email: string; name?: string; subscribedAt: string };

export function Newsletter() {
  const [items, setItems]       = useState<Subscriber[]>([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);

  // Confirmation modal state
  const [confirmDelete, setConfirmDelete] = useState<{ ids: number[]; label: string } | null>(null);

  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try { const d = await adminApi.newsletter.list(); setItems(d.subscribers || []); }
    catch { toast({ title: "Failed to load subscribers", variant: "destructive" }); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const toggleSelect  = (id: number) => setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const toggleAll     = () => setSelected(selected.size === items.length ? new Set() : new Set(items.map(i => i.id)));

  const confirmAndDelete = (ids: number[], label: string) => setConfirmDelete({ ids, label });

  const executeDelete = async () => {
    if (!confirmDelete) return;
    const { ids } = confirmDelete;
    setConfirmDelete(null);
    setDeleting(true);
    try {
      if (ids.length === 1) {
        await adminApi.newsletter.deleteOne(ids[0]);
      } else {
        await adminApi.newsletter.bulkDelete(ids);
        setSelected(new Set());
      }
      toast({ title: ids.length === 1 ? "Subscriber deleted" : `${ids.length} subscribers deleted` });
      load();
    } catch (e: any) {
      toast({ title: e.message || "Delete failed", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminLayout title="Newsletter" breadcrumbs={[{ label: "Newsletter" }]}>
      {/* Confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-stone-900">Delete {confirmDelete.label}?</h3>
                <p className="text-xs text-stone-500 mt-0.5">This cannot be undone.</p>
              </div>
              <button onClick={() => setConfirmDelete(null)} className="ml-auto shrink-0 text-stone-400 hover:text-stone-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={executeDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
              <button onClick={() => setConfirmDelete(null)} className="flex-1 border border-stone-200 text-sm font-medium py-2 rounded-lg hover:bg-stone-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-stone-600">{items.length} subscribers</span>
          {selected.size > 0 && (
            <button
              onClick={() => confirmAndDelete([...selected], `${selected.size} subscriber${selected.size > 1 ? "s" : ""}`)}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete {selected.size} selected
            </button>
          )}
        </div>

        {loading
          ? <div className="bg-white rounded-xl border p-8 text-center text-stone-400 text-sm">Loading…</div>
          : items.length === 0
          ? <div className="bg-white rounded-xl border p-8 text-center text-stone-400 text-sm">No subscribers yet</div>
          : (
            <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-stone-100 flex items-center gap-3">
                <input type="checkbox" checked={selected.size === items.length && items.length > 0} onChange={toggleAll} className="rounded" />
                <span className="text-xs font-medium text-stone-500">Select all</span>
              </div>
              <div className="divide-y divide-stone-50">
                {items.map(s => (
                  <div key={s.id} className="px-4 py-2.5 flex items-center gap-3">
                    <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggleSelect(s.id)} className="rounded" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-stone-800">{s.email}</p>
                      {s.name && <p className="text-xs text-stone-400">{s.name}</p>}
                    </div>
                    <p className="text-xs text-stone-400 shrink-0">{new Date(s.subscribedAt).toLocaleDateString()}</p>
                    <button
                      onClick={() => confirmAndDelete([s.id], s.email)}
                      className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
      </div>
    </AdminLayout>
  );
}
