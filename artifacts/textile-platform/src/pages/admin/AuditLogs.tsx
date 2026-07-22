import { useEffect, useState } from "react";
import { AdminLayout } from "./AdminLayout";
import { adminApi } from "@/lib/adminApi";

type Log = { id: number; userEmail?: string; action: string; resource: string; resourceId?: string; ipAddress?: string; createdAt: string };
const RESOURCES = ["articles","users","authors","categories","tags","fabrics","stains","experts","appointments","payments","zoom","newsletter","media","seo","redirects","settings","auth"];

export function AuditLogs() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [resource, setResource] = useState("");
  const [page, setPage] = useState(1);

  const load = async (p = page) => {
    setLoading(true);
    try {
      const params: any = { page: String(p), limit:"50" };
      if (resource) params.resource = resource;
      const d = await adminApi.auditLogs.list(params);
      setLogs(d.logs||[]);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(1); setPage(1); }, [resource]);

  const ACTION_COLORS: Record<string,string> = { create:"bg-emerald-100 text-emerald-700", update:"bg-blue-100 text-blue-700", delete:"bg-red-100 text-red-700", login:"bg-purple-100 text-purple-700", logout:"bg-stone-100 text-stone-600", publish:"bg-amber-100 text-amber-700" };

  return (
    <AdminLayout title="Audit Logs" breadcrumbs={[{label:"Audit Logs"}]}>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <select className="px-3 py-1.5 border border-stone-200 rounded-lg text-sm bg-white" value={resource} onChange={e=>setResource(e.target.value)}>
            <option value="">All resources</option>
            {RESOURCES.map(r=><option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        {loading ? <div className="bg-white rounded-xl border p-8 text-center text-stone-400 text-sm">Loading…</div>
        : logs.length===0 ? <div className="bg-white rounded-xl border p-8 text-center text-stone-400 text-sm">No audit logs</div>
        : <div className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-50">
            {logs.map(l=>(
              <div key={l.id} className="px-4 py-2.5 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_COLORS[l.action]??"bg-stone-100 text-stone-600"}`}>{l.action}</span>
                    <span className="text-sm text-stone-700">{l.resource}{l.resourceId ? ` #${l.resourceId}` : ""}</span>
                  </div>
                  <p className="text-xs text-stone-400 mt-0.5">{l.userEmail||"system"} · {l.ipAddress||"—"}</p>
                </div>
                <p className="text-xs text-stone-400 shrink-0 hidden sm:block">{new Date(l.createdAt).toLocaleString()}</p>
                <p className="text-xs text-stone-400 shrink-0 sm:hidden">{new Date(l.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>}
        <div className="flex gap-2">
          <button disabled={page<=1} onClick={()=>{const p=page-1;setPage(p);load(p);}} className="px-3 py-1.5 border border-stone-200 rounded-lg text-sm disabled:opacity-40">← Prev</button>
          <span className="px-3 py-1.5 text-sm text-stone-500">Page {page}</span>
          <button disabled={logs.length<50} onClick={()=>{const p=page+1;setPage(p);load(p);}} className="px-3 py-1.5 border border-stone-200 rounded-lg text-sm disabled:opacity-40">Next →</button>
        </div>
      </div>
    </AdminLayout>
  );
}
