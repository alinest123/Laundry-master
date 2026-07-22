import { useEffect, useState } from "react";
import { AdminLayout } from "./AdminLayout";
import { adminApi } from "@/lib/adminApi";

type Log = { id: number; event: string; userId?: number; ipAddress?: string; userAgent?: string; path?: string; detail?: string; createdAt: string };
const EVENTS = ["login_failed","unauthorized","permission_denied","brute_force"];
const EVENT_COLORS: Record<string,string> = { login_failed:"bg-red-100 text-red-700", unauthorized:"bg-amber-100 text-amber-700", permission_denied:"bg-orange-100 text-orange-700", brute_force:"bg-red-100 text-red-800" };

export function SecurityLogs() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState("");
  const [page, setPage] = useState(1);

  const load = async (p = page) => {
    setLoading(true);
    try {
      const params: any = { page: String(p), limit:"50" };
      if (event) params.event = event;
      const d = await adminApi.securityLogs.list(params);
      setLogs(d.logs||[]);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(1); setPage(1); }, [event]);

  return (
    <AdminLayout title="Security Logs" breadcrumbs={[{label:"Security Logs"}]}>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <select className="px-3 py-1.5 border border-stone-200 rounded-lg text-sm bg-white" value={event} onChange={e=>setEvent(e.target.value)}>
            <option value="">All events</option>
            {EVENTS.map(e=><option key={e} value={e}>{e.replace(/_/g," ")}</option>)}
          </select>
        </div>
        {loading ? <div className="bg-white rounded-xl border p-8 text-center text-stone-400 text-sm">Loading…</div>
        : logs.length===0 ? <div className="bg-white rounded-xl border p-8 text-center text-stone-400 text-sm">No security events</div>
        : <div className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-50">
            {logs.map(l=>(
              <div key={l.id} className="px-4 py-2.5 flex items-start gap-3">
                <span className={`shrink-0 mt-0.5 px-2 py-0.5 rounded-full text-xs font-medium ${EVENT_COLORS[l.event]??""}`}>{l.event.replace(/_/g," ")}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-stone-700 truncate">{l.detail||l.path||"—"}</p>
                  <p className="text-xs text-stone-400">{l.ipAddress||"no IP"}{l.userId ? ` · user #${l.userId}` : ""}</p>
                </div>
                <p className="text-xs text-stone-400 shrink-0">{new Date(l.createdAt).toLocaleString()}</p>
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
