import { useEffect, useState } from "react";
import { AdminLayout } from "./AdminLayout";
import { adminApi } from "@/lib/adminApi";

type Payment = { id: number; amount: number; currency: string; status: string; provider: string; description?: string; createdAt: string };
const STATUS_COLORS: Record<string,string> = { pending:"bg-amber-100 text-amber-700", succeeded:"bg-emerald-100 text-emerald-700", failed:"bg-red-100 text-red-700", refunded:"bg-stone-100 text-stone-600" };

export function Payments() {
  const [items, setItems] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { const data = await adminApi.payments.list(); setItems(data.payments || []); } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const fmt = (amount: number, currency: string) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(amount / 100);

  return (
    <AdminLayout title="Payments" breadcrumbs={[{label:"Payments"}]}>
      <div className="space-y-4">
        <p className="text-xs text-stone-400">Read-only — live payment processing requires Stripe credentials.</p>
        {loading ? <div className="bg-white rounded-xl border p-8 text-center text-stone-400 text-sm">Loading…</div>
        : items.length===0 ? <div className="bg-white rounded-xl border p-8 text-center text-stone-400 text-sm">No payments recorded</div>
        : <div className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-50">
            {items.map(p=>(
              <div key={p.id} className="px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-800">{fmt(p.amount, p.currency)}</p>
                  <p className="text-xs text-stone-400">{p.provider} · {p.description || "—"} · {new Date(p.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[p.status]??""}`}>{p.status}</span>
              </div>
            ))}
          </div>}
      </div>
    </AdminLayout>
  );
}
