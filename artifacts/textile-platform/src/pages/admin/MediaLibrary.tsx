import { useEffect, useState } from "react";
import { Plus, Trash2, Image as ImageIcon, X, AlertTriangle } from "lucide-react";
import { AdminLayout } from "./AdminLayout";
import { adminApi } from "@/lib/adminApi";
import { useToast } from "@/hooks/use-toast";

type Media = { id: number; filename: string; originalName: string; url: string; mimeType: string; size: number; altText?: string; createdAt: string };
const EMPTY = { filename: "", originalName: "", mimeType: "image/jpeg", url: "", size: 0, altText: "" };

function MediaThumb({ url, alt }: { url: string; alt: string }) {
  const [broken, setBroken] = useState(false);
  return broken ? (
    <div className="w-full h-full flex items-center justify-center">
      <ImageIcon className="w-8 h-8 text-stone-300" />
    </div>
  ) : (
    <img
      src={url}
      alt={alt}
      className="w-full h-full object-cover"
      onError={() => setBroken(true)}
    />
  );
}

export function MediaLibrary() {
  const [items, setItems]     = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding]   = useState(false);
  const [form, setForm]       = useState<any>({ ...EMPTY });
  const [saving, setSaving]   = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Media | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try { const d = await adminApi.media.list(); setItems(d.media || []); }
    catch { toast({ title: "Failed to load media", variant: "destructive" }); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.url?.trim()) { toast({ title: "URL is required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const name = form.url.split("/").pop()?.split("?")[0] || "file";
      await adminApi.media.create({ ...form, filename: form.filename || name, originalName: form.originalName || name });
      setAdding(false);
      setForm({ ...EMPTY });
      toast({ title: "Media added" });
      load();
    } catch (e: any) {
      toast({ title: e.message || "Failed to add media", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.media.delete(deleteTarget.id);
      toast({ title: "Media deleted" });
      setDeleteTarget(null);
      load();
    } catch (e: any) {
      toast({ title: e.message || "Delete failed", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const fmtSize = (b: number) =>
    b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)}MB`
    : b > 1024 ? `${(b / 1024).toFixed(0)}KB`
    : `${b}B`;

  return (
    <AdminLayout title="Media Library" breadcrumbs={[{ label: "Media Library" }]}>
      {/* Add modal */}
      {adding && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Add Media by URL</h3>
              <button onClick={() => setAdding(false)}><X className="w-4 h-4 text-stone-400" /></button>
            </div>
            {([["URL", "url"], ["Alt Text", "altText"], ["MIME Type", "mimeType"]] as const).map(([label, field]) => (
              <div key={field}>
                <label className="block text-xs font-medium text-stone-600 mb-1">{label}</label>
                <input
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm"
                  value={form[field] ?? ""}
                  onChange={e => setForm((p: any) => ({ ...p, [field]: e.target.value }))}
                />
              </div>
            ))}
            <div className="flex gap-3">
              <button onClick={save} disabled={saving} className="flex-1 bg-[#1c1c1c] text-white text-sm font-medium py-2 rounded-lg hover:bg-[#333] disabled:opacity-50">
                {saving ? "Adding…" : "Add"}
              </button>
              <button onClick={() => setAdding(false)} className="flex-1 border border-stone-200 text-sm font-medium py-2 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-stone-900">Delete media?</h3>
                <p className="text-xs text-stone-500 mt-0.5 break-all">{deleteTarget.originalName}</p>
              </div>
              <button onClick={() => setDeleteTarget(null)} className="ml-auto shrink-0 text-stone-400 hover:text-stone-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-3">
              <button onClick={executeDelete} disabled={deleting} className="flex-1 bg-red-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-red-700 disabled:opacity-50">
                {deleting ? "Deleting…" : "Delete"}
              </button>
              <button onClick={() => setDeleteTarget(null)} className="flex-1 border border-stone-200 text-sm font-medium py-2 rounded-lg hover:bg-stone-50">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-stone-600">{items.length} items</span>
          <button
            onClick={() => { setForm({ ...EMPTY }); setAdding(true); }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1c1c1c] text-white text-xs font-medium rounded-lg hover:bg-[#333]"
          >
            <Plus className="w-3.5 h-3.5" /> Add by URL
          </button>
        </div>

        {loading
          ? <div className="bg-white rounded-xl border p-8 text-center text-stone-400 text-sm">Loading…</div>
          : items.length === 0
          ? <div className="bg-white rounded-xl border p-8 text-center text-stone-400 text-sm">No media yet</div>
          : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {items.map(m => (
                <div key={m.id} className="bg-white rounded-xl border border-stone-200 overflow-hidden group">
                  <div className="aspect-square bg-stone-100 flex items-center justify-center relative">
                    {m.mimeType.startsWith("image/")
                      ? <MediaThumb url={m.url} alt={m.altText || m.originalName} />
                      : <ImageIcon className="w-8 h-8 text-stone-300" />}
                    <button
                      onClick={() => setDeleteTarget(m)}
                      className="absolute top-1.5 right-1.5 p-1 bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-medium text-stone-700 truncate">{m.originalName}</p>
                    <p className="text-[10px] text-stone-400">{fmtSize(m.size)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
    </AdminLayout>
  );
}
