import { useEffect, useState } from "react";
import { Pencil, X, Check, AlertCircle } from "lucide-react";
import { AdminLayout } from "./AdminLayout";
import { adminApi } from "@/lib/adminApi";

type SeoArticle = { id: number; title: string; slug: string; status: string; metaTitle?: string; metaDescription?: string; metaKeywords?: string; noindex: boolean };

function seoScore(a: SeoArticle): number {
  let s = 0;
  if (a.metaTitle) s += 40;
  if (a.metaDescription) s += 40;
  if (a.metaKeywords) s += 10;
  if (!a.noindex) s += 10;
  return s;
}

export function SeoManagement() {
  const [items, setItems] = useState<SeoArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<SeoArticle|null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => { setLoading(true); try { setItems(await adminApi.seo.list()); } catch {} finally { setLoading(false); } };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await adminApi.seo.update(editing.id, { metaTitle:editing.metaTitle, metaDescription:editing.metaDescription, metaKeywords:editing.metaKeywords, noindex:editing.noindex, nofollow:false });
      setEditing(null); load();
    } catch(e:any) { alert(e.message); }
    finally { setSaving(false); }
  };

  return (
    <AdminLayout title="SEO Management" breadcrumbs={[{label:"SEO"}]}>
      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Edit SEO — {editing.title}</h3>
              <button onClick={()=>setEditing(null)}><X className="w-4 h-4 text-stone-400" /></button>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Meta Title</label>
              <input className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm" maxLength={60}
                value={editing.metaTitle??""} onChange={e=>setEditing({...editing,metaTitle:e.target.value})} />
              <p className="text-[10px] text-stone-400 mt-1">{(editing.metaTitle?.length??0)}/60 chars</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Meta Description</label>
              <textarea className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm resize-none" rows={3} maxLength={160}
                value={editing.metaDescription??""} onChange={e=>setEditing({...editing,metaDescription:e.target.value})} />
              <p className="text-[10px] text-stone-400 mt-1">{(editing.metaDescription?.length??0)}/160 chars</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Meta Keywords</label>
              <input className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm"
                value={editing.metaKeywords??""} onChange={e=>setEditing({...editing,metaKeywords:e.target.value})} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="noindex" checked={editing.noindex} onChange={e=>setEditing({...editing,noindex:e.target.checked})} />
              <label htmlFor="noindex" className="text-xs text-stone-600">No-index (hide from search engines)</label>
            </div>
            <div className="flex gap-3">
              <button onClick={save} disabled={saving} className="flex-1 bg-[#1c1c1c] text-white text-sm font-medium py-2 rounded-lg hover:bg-[#333] disabled:opacity-50">{saving?"Saving…":"Save"}</button>
              <button onClick={()=>setEditing(null)} className="flex-1 border border-stone-200 text-sm font-medium py-2 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}
      <div className="space-y-3">
        {loading ? <div className="bg-white rounded-xl border p-8 text-center text-stone-400 text-sm">Loading…</div>
        : items.length===0 ? <div className="bg-white rounded-xl border p-8 text-center text-stone-400 text-sm">No articles</div>
        : <div className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-50">
            {items.map(a=>{
              const score = seoScore(a);
              const scoreColor = score>=80?"text-emerald-600":score>=40?"text-amber-600":"text-red-600";
              return (
                <div key={a.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-800 truncate">{a.title}</p>
                    <p className="text-xs text-stone-400 truncate">{a.metaDescription || <span className="text-red-400">No meta description</span>}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {score < 80 ? <AlertCircle className={`w-3.5 h-3.5 ${scoreColor}`} /> : <Check className={`w-3.5 h-3.5 ${scoreColor}`} />}
                    <span className={`text-xs font-medium ${scoreColor}`}>{score}%</span>
                  </div>
                  <button onClick={()=>setEditing(a)} className="shrink-0 p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded"><Pencil className="w-3.5 h-3.5" /></button>
                </div>
              );
            })}
          </div>}
      </div>
    </AdminLayout>
  );
}
