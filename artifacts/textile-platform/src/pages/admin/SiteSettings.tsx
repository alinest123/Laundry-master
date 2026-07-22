import { useEffect, useState } from "react";
import { AdminLayout } from "./AdminLayout";
import { adminApi } from "@/lib/adminApi";

type Settings = { siteName: string; siteDescription?: string; contactEmail?: string; maintenanceMode: boolean; customHeadHtml?: string; customBodyHtml?: string; socialLinks?: string };

export function SiteSettings() {
  const [form, setForm] = useState<Settings>({ siteName:"", maintenanceMode:false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    adminApi.settings.get().then(d => { setForm(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const set = (k: keyof Settings, v: any) => setForm(p => ({...p,[k]:v}));

  const save = async () => {
    setSaving(true);
    try { await adminApi.settings.update(form); setSaved(true); setTimeout(()=>setSaved(false),2500); }
    catch(e:any) { alert(e.message); }
    finally { setSaving(false); }
  };

  if (loading) return <AdminLayout title="Site Settings" breadcrumbs={[{label:"Site Settings"}]}><div className="p-8 text-center text-stone-400 text-sm">Loading…</div></AdminLayout>;

  return (
    <AdminLayout title="Site Settings" breadcrumbs={[{label:"Site Settings"}]}>
      <div className="max-w-2xl space-y-6">
        <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-stone-800">General</h2>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Site Name</label>
            <input className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30 focus:border-[#4a7c59]"
              value={form.siteName} onChange={e=>set("siteName",e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Site Description</label>
            <textarea className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none resize-none" rows={2}
              value={form.siteDescription??""} onChange={e=>set("siteDescription",e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Contact Email</label>
            <input type="email" className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30 focus:border-[#4a7c59]"
              value={form.contactEmail??""} onChange={e=>set("contactEmail",e.target.value)} />
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="maintenance" checked={form.maintenanceMode} onChange={e=>set("maintenanceMode",e.target.checked)} className="rounded" />
            <label htmlFor="maintenance" className="text-sm text-stone-700">Maintenance Mode</label>
            {form.maintenanceMode && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">⚠ Site is in maintenance</span>}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-stone-800">Custom HTML</h2>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Custom &lt;head&gt; HTML</label>
            <textarea className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm font-mono focus:outline-none resize-none" rows={4}
              placeholder="<!-- e.g. analytics scripts -->" value={form.customHeadHtml??""} onChange={e=>set("customHeadHtml",e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Custom &lt;body&gt; HTML</label>
            <textarea className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm font-mono focus:outline-none resize-none" rows={4}
              placeholder="<!-- e.g. chat widget -->" value={form.customBodyHtml??""} onChange={e=>set("customBodyHtml",e.target.value)} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={save} disabled={saving} className="px-6 py-2.5 bg-[#1c1c1c] text-white text-sm font-medium rounded-lg hover:bg-[#333] disabled:opacity-50">
            {saving ? "Saving…" : "Save Settings"}
          </button>
          {saved && <span className="text-xs text-emerald-600 font-medium">✓ Saved</span>}
        </div>
      </div>
    </AdminLayout>
  );
}
