import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, ShieldCheck } from "lucide-react";
import { AdminLayout } from "./AdminLayout";
import { adminApi } from "@/lib/adminApi";

type User = { id: number; name: string; email: string; role: string; isActive: boolean; createdAt: string };
const ROLES = ["super_admin","administrator","editor","author","consultant","user"];
const ROLE_COLORS: Record<string,string> = { super_admin:"bg-purple-100 text-purple-700", administrator:"bg-blue-100 text-blue-700", editor:"bg-emerald-100 text-emerald-700", author:"bg-amber-100 text-amber-700", consultant:"bg-sky-100 text-sky-700", user:"bg-stone-100 text-stone-600" };
const EMPTY = { name:"", email:"", password:"", role:"user", isActive:true };

export function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number|null>(null);

  const load = async () => { setLoading(true); try { setUsers(await adminApi.users.list()); } catch {} finally { setLoading(false); } };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing?.name?.trim() || !editing?.email?.trim()) return alert("Name and email required");
    if (isNew && !editing.password?.trim()) return alert("Password required for new users");
    setSaving(true);
    try {
      if (isNew) await adminApi.users.create(editing);
      else await adminApi.users.update(editing.id, editing);
      setEditing(null); setIsNew(false); load();
    } catch(e:any) { alert(e.message); }
    finally { setSaving(false); }
  };

  const del = async () => {
    if (!deleteId) return;
    try { await adminApi.users.delete(deleteId); setDeleteId(null); load(); } catch(e:any) { alert(e.message); }
  };

  return (
    <AdminLayout title="Users" breadcrumbs={[{label:"Users"}]}>
      {deleteId !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-base font-semibold mb-2">Delete user?</h3>
            <p className="text-sm text-stone-500 mb-5">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={del} className="flex-1 bg-red-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-red-700">Delete</button>
              <button onClick={() => setDeleteId(null)} className="flex-1 border border-stone-200 text-sm font-medium py-2 rounded-lg hover:bg-stone-50">Cancel</button>
            </div>
          </div>
        </div>
      )}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* List */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-stone-700">All Users ({users.length})</h2>
            <button onClick={() => { setEditing({...EMPTY}); setIsNew(true); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1c1c1c] text-white text-xs font-medium rounded-lg hover:bg-[#333]">
              <Plus className="w-3.5 h-3.5" /> Add User
            </button>
          </div>
          {loading ? <div className="bg-white rounded-xl border border-stone-200 p-8 text-center text-stone-400 text-sm">Loading…</div>
          : users.length === 0 ? <div className="bg-white rounded-xl border border-stone-200 p-8 text-center text-stone-400 text-sm">No users yet</div>
          : <div className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-50">
              {users.map(u => (
                <div key={u.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#4a7c59]/10 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4 text-[#4a7c59]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-800 truncate">{u.name}</p>
                    <p className="text-xs text-stone-400 truncate">{u.email}</p>
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[u.role] ?? "bg-stone-100 text-stone-600"}`}>{u.role.replace("_"," ")}</span>
                  <span className={`shrink-0 w-2 h-2 rounded-full ${u.isActive ? "bg-emerald-400" : "bg-stone-300"}`} title={u.isActive ? "Active" : "Inactive"} />
                  <div className="flex gap-1">
                    <button onClick={() => { setEditing({...u, password:""}); setIsNew(false); }} className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleteId(u.id)} className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>}
        </div>
        {/* Form */}
        {editing && (
          <div className="bg-white rounded-xl border border-stone-200 p-5 h-fit space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-stone-800">{isNew ? "New User" : "Edit User"}</h3>
              <button onClick={() => { setEditing(null); setIsNew(false); }} className="text-stone-400 hover:text-stone-700"><X className="w-4 h-4" /></button>
            </div>
            {[["Name","name"],["Email","email"]].map(([label,field]) => (
              <div key={field}>
                <label className="block text-xs font-medium text-stone-600 mb-1">{label}</label>
                <input type={field === "email" ? "email" : "text"} className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30 focus:border-[#4a7c59]"
                  value={editing[field] ?? ""} onChange={e => setEditing((p:any) => ({...p,[field]:e.target.value}))} />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">{isNew ? "Password" : "New Password (leave blank to keep)"}</label>
              <input type="password" className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30 focus:border-[#4a7c59]"
                value={editing.password ?? ""} onChange={e => setEditing((p:any) => ({...p,password:e.target.value}))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Role</label>
              <select className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30 focus:border-[#4a7c59]"
                value={editing.role ?? "user"} onChange={e => setEditing((p:any) => ({...p,role:e.target.value}))}>
                {ROLES.map(r => <option key={r} value={r}>{r.replace("_"," ")}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isActive" checked={editing.isActive ?? true} onChange={e => setEditing((p:any) => ({...p,isActive:e.target.checked}))} className="rounded" />
              <label htmlFor="isActive" className="text-xs font-medium text-stone-600">Active</label>
            </div>
            <button onClick={save} disabled={saving} className="w-full bg-[#1c1c1c] text-white text-sm font-medium py-2 rounded-lg hover:bg-[#333] disabled:opacity-50">
              {saving ? "Saving…" : isNew ? "Create User" : "Save Changes"}
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
