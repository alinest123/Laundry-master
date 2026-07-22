import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { AdminLayout } from "./AdminLayout";
import { adminApi } from "@/lib/adminApi";

type Author = { id: number; name: string; role: string; email?: string; bio?: string; avatar?: string; twitter?: string; linkedin?: string; expertise?: string };
const EMPTY: Omit<Author, "id"> = { name: "", role: "Author", email: "", bio: "", avatar: "", twitter: "", linkedin: "", expertise: "" };

export function Authors() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Author> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try { setAuthors(await adminApi.authors.list()); } catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing?.name?.trim()) return alert("Name is required");
    setSaving(true);
    try {
      if (isNew) await adminApi.authors.create(editing);
      else await adminApi.authors.update(editing!.id!, editing);
      setEditing(null); setIsNew(false); load();
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  };

  const del = async () => {
    if (!deleteId) return;
    try { await adminApi.authors.delete(deleteId); setDeleteId(null); load(); } catch (e: any) { alert(e.message); }
  };

  const Field = ({ label, field, type = "text", textarea = false }: { label: string; field: keyof typeof EMPTY; type?: string; textarea?: boolean }) => (
    <div>
      <label className="block text-xs font-medium text-stone-600 mb-1">{label}</label>
      {textarea ? (
        <textarea className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30 focus:border-[#4a7c59] resize-none" rows={3}
          value={(editing as any)?.[field] ?? ""} onChange={e => setEditing(p => ({ ...p, [field]: e.target.value }))} />
      ) : (
        <input type={type} className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30 focus:border-[#4a7c59]"
          value={(editing as any)?.[field] ?? ""} onChange={e => setEditing(p => ({ ...p, [field]: e.target.value }))} />
      )}
    </div>
  );

  return (
    <AdminLayout title="Authors" breadcrumbs={[{ label: "Authors" }]}>
      {deleteId !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-base font-semibold text-stone-900 mb-2">Delete author?</h3>
            <p className="text-sm text-stone-500 mb-5">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={del} className="flex-1 bg-red-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-red-700 transition-colors">Delete</button>
              <button onClick={() => setDeleteId(null)} className="flex-1 border border-stone-200 text-sm font-medium py-2 rounded-lg hover:bg-stone-50 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        {/* List */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-stone-700">All Authors ({authors.length})</h2>
            <button onClick={() => { setEditing({ ...EMPTY }); setIsNew(true); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1c1c1c] text-white text-xs font-medium rounded-lg hover:bg-[#333] transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add Author
            </button>
          </div>
          {loading ? (
            <div className="bg-white rounded-xl border border-stone-200 p-8 text-center text-stone-400 text-sm">Loading…</div>
          ) : authors.length === 0 ? (
            <div className="bg-white rounded-xl border border-stone-200 p-8 text-center text-stone-400 text-sm">No authors yet</div>
          ) : (
            <div className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-50">
              {authors.map(a => (
                <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                  {a.avatar ? (
                    <img src={a.avatar} alt={a.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-stone-500">{a.name[0]}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-900 truncate">{a.name}</p>
                    <p className="text-xs text-stone-400">{a.role}{a.email ? ` · ${a.email}` : ""}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditing({ ...a }); setIsNew(false); }}
                      className="p-1.5 rounded hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteId(a.id)}
                      className="p-1.5 rounded hover:bg-red-50 text-stone-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Editor panel */}
        <div>
          {editing ? (
            <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-4 sticky top-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-stone-900">{isNew ? "New Author" : "Edit Author"}</h3>
                <button onClick={() => { setEditing(null); setIsNew(false); }} className="text-stone-400 hover:text-stone-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <Field label="Full Name *" field="name" />
              <Field label="Role" field="role" />
              <Field label="Email" field="email" type="email" />
              <Field label="Avatar URL" field="avatar" />
              <Field label="Expertise" field="expertise" />
              <Field label="Bio" field="bio" textarea />
              <Field label="Twitter handle" field="twitter" />
              <Field label="LinkedIn URL" field="linkedin" />
              <button onClick={save} disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-2 bg-[#4a7c59] text-white text-sm font-medium rounded-lg hover:bg-[#3d6849] disabled:opacity-60 transition-colors">
                <Check className="w-4 h-4" />
                {saving ? "Saving…" : isNew ? "Create Author" : "Save Changes"}
              </button>
            </div>
          ) : (
            <div className="bg-stone-50 rounded-xl border border-dashed border-stone-300 p-8 text-center">
              <p className="text-sm text-stone-400">Select an author to edit or create a new one</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
