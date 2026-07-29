import { useState, useEffect, useRef, useCallback } from "react";
import { AdminLayout } from "./AdminLayout";
import { adminApi } from "@/lib/adminApi";
import { apiGet, apiPost } from "@/lib/api";
import { useInvalidateSiteImages } from "@/lib/useSiteImages";
import { useQueryClient } from "@tanstack/react-query";
import { apiPut } from "@/lib/api";
import { Check, Upload, X, Image as ImageIcon, Palette, AlertCircle, RefreshCw } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SiteImage {
  id: number; key: string; url: string; label: string; section: string; description?: string;
}

interface LogoSettings {
  logoUrl?: string; logoText?: string; logoSizeDesktop?: string; logoSizeMobile?: string;
  siteName?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function cls(...args: (string | false | undefined | null)[]) {
  return args.filter(Boolean).join(" ");
}

// ── Image upload component ────────────────────────────────────────────────────

function ImageField({
  label, description, value, onChange, aspectHint,
}: {
  label: string; description?: string; value: string; onChange: (url: string) => void; aspectHint?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [urlMode, setUrlMode] = useState(false);
  const [urlInput, setUrlInput] = useState(value);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setUrlInput(value); }, [value]);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) { setError("Please select an image file."); return; }
    if (file.size > 10 * 1024 * 1024) { setError("File must be under 10 MB."); return; }
    setError(""); setUploading(true);
    try {
      const { uploadURL, objectPath } = await apiPost<{ uploadURL: string; objectPath: string }>(
        "/api/storage/uploads/request-url",
        { name: file.name, size: file.size, contentType: file.type }
      );
      const resp = await fetch(uploadURL, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      if (!resp.ok) throw new Error("Upload failed");
      // Build the accessible URL from objectPath
      const servingUrl = `/api${objectPath}`;
      onChange(servingUrl);
    } catch (e: any) {
      setError(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }, [onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-stone-700">{label}</label>
        <div className="flex gap-2">
          <button type="button" onClick={() => setUrlMode(m => !m)}
            className="text-xs text-stone-500 hover:text-stone-800 underline transition-colors">
            {urlMode ? "Upload file" : "Paste URL"}
          </button>
          {value && (
            <button type="button" onClick={() => onChange("")}
              className="text-xs text-red-500 hover:text-red-700 transition-colors flex items-center gap-1">
              <X className="w-3 h-3" /> Remove
            </button>
          )}
        </div>
      </div>

      {description && <p className="text-xs text-stone-400">{description}</p>}

      {urlMode ? (
        /* URL input mode */
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            placeholder="https://…"
            className="flex-1 px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30 focus:border-[#4a7c59]"
          />
          <button type="button"
            onClick={() => { onChange(urlInput); setUrlMode(false); }}
            className="px-4 py-2 bg-[#1a2e1a] text-white text-sm rounded-lg hover:bg-[#243824] transition-colors">
            Apply
          </button>
        </div>
      ) : (
        /* Upload / drop zone */
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          className={cls(
            "border-2 border-dashed rounded-xl overflow-hidden transition-colors",
            uploading ? "border-[#4a7c59] bg-[#f0f7f0]" : "border-stone-200 hover:border-[#4a7c59]/50"
          )}
        >
          {value ? (
            <div className="relative group">
              <img src={value} alt={label}
                className="w-full object-cover bg-stone-100"
                style={{ maxHeight: 160 }} />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="bg-white text-stone-800 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-stone-100 transition-colors">
                  <Upload className="w-3.5 h-3.5" /> Change
                </button>
              </div>
              {aspectHint && (
                <div className="absolute bottom-2 right-2 text-[10px] bg-black/60 text-white px-2 py-0.5 rounded">
                  {aspectHint}
                </div>
              )}
            </div>
          ) : (
            <button type="button" onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-full flex flex-col items-center justify-center gap-2 py-8 text-stone-400 hover:text-stone-600 transition-colors disabled:opacity-50">
              {uploading
                ? <RefreshCw className="w-6 h-6 animate-spin" />
                : <ImageIcon className="w-6 h-6" />
              }
              <span className="text-xs font-medium">
                {uploading ? "Uploading…" : "Click to upload or drag & drop"}
              </span>
              {aspectHint && <span className="text-[10px] text-stone-300">{aspectHint}</span>}
            </button>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" />{error}
        </p>
      )}

      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
    </div>
  );
}

// ── Logo tab ──────────────────────────────────────────────────────────────────

function LogoTab() {
  const qc = useQueryClient();
  const [form, setForm] = useState<LogoSettings>({
    logoUrl: "", logoText: "Laundry Master",
    logoSizeDesktop: "32", logoSizeMobile: "28",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    adminApi.settings.get()
      .then((d: any) => {
        setForm({
          logoUrl: d.logoUrl || "",
          logoText: d.logoText || "Laundry Master",
          logoSizeDesktop: d.logoSizeDesktop || "32",
          logoSizeMobile: d.logoSizeMobile || "28",
          siteName: d.siteName,
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const set = (k: keyof LogoSettings, v: string) => setForm(p => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      await adminApi.settings.update(form);
      qc.invalidateQueries({ queryKey: ["site-status"] });
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  };

  const desktopH = Math.max(20, Math.min(80, Number(form.logoSizeDesktop) || 32));
  const mobileH = Math.max(16, Math.min(60, Number(form.logoSizeMobile) || 28));

  if (loading) return <div className="p-8 text-sm text-stone-400 text-center animate-pulse">Loading…</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Logo image */}
      <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-5">
        <h3 className="text-sm font-semibold text-stone-800 flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-stone-400" /> Logo Image
        </h3>
        <ImageField
          label="Logo image"
          description="Upload a PNG or SVG with transparent background. When set, it replaces the default icon+text logo."
          value={form.logoUrl || ""}
          onChange={url => set("logoUrl", url)}
          aspectHint="Recommended: transparent PNG, any aspect ratio"
        />
        {form.logoUrl && (
          <div className="rounded-lg border border-[#e8e8e4] bg-[#fafaf9] p-4">
            <p className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-3">Preview</p>
            <div className="bg-white border border-[#f0f0f0] rounded-lg px-6 py-4 flex items-center gap-3">
              <img src={form.logoUrl} alt="Logo preview"
                style={{ height: desktopH, width: "auto", maxWidth: 200 }}
                className="object-contain" />
            </div>
          </div>
        )}
      </div>

      {/* Logo text (shown when no image, or alongside image) */}
      <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4">
        <h3 className="text-sm font-semibold text-stone-800">Logo Text</h3>
        <p className="text-xs text-stone-400">Shown next to the icon when no logo image is uploaded. Also used as alt text when an image is set.</p>
        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1">Brand name</label>
          <input
            value={form.logoText || ""}
            onChange={e => set("logoText", e.target.value)}
            placeholder="Laundry Master"
            className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30 focus:border-[#4a7c59]"
          />
        </div>
      </div>

      {/* Logo sizes */}
      <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-5">
        <h3 className="text-sm font-semibold text-stone-800">Logo Size</h3>
        <p className="text-xs text-stone-400">Controls the height (in pixels) of the logo. Width scales automatically to preserve the aspect ratio.</p>
        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Desktop height (px)</label>
            <div className="flex items-center gap-3">
              <input
                type="range" min={20} max={80} step={1}
                value={Number(form.logoSizeDesktop) || 32}
                onChange={e => set("logoSizeDesktop", e.target.value)}
                className="flex-1 accent-[#4a7c59]"
              />
              <span className="w-10 text-center text-sm font-mono font-semibold text-stone-700">{form.logoSizeDesktop}px</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Mobile height (px)</label>
            <div className="flex items-center gap-3">
              <input
                type="range" min={16} max={60} step={1}
                value={Number(form.logoSizeMobile) || 28}
                onChange={e => set("logoSizeMobile", e.target.value)}
                className="flex-1 accent-[#4a7c59]"
              />
              <span className="w-10 text-center text-sm font-mono font-semibold text-stone-700">{form.logoSizeMobile}px</span>
            </div>
          </div>
        </div>

        {/* Live size preview */}
        <div className="rounded-lg border border-[#e8e8e4] bg-[#fafaf9] p-4">
          <p className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-4">Size Preview</p>
          <div className="flex gap-8 items-end">
            <div className="text-center">
              <p className="text-[10px] text-stone-400 mb-2">Desktop — {desktopH}px</p>
              <div className="inline-flex items-center gap-2 bg-white border border-[#f0f0f0] rounded px-3 py-2">
                {form.logoUrl ? (
                  <img src={form.logoUrl} alt="logo"
                    style={{ height: desktopH, width: "auto", maxWidth: 160 }} className="object-contain" />
                ) : (
                  <>
                    <div className="bg-[#1c1c1c] rounded-sm flex items-center justify-center"
                      style={{ width: Math.round(desktopH * 0.875), height: Math.round(desktopH * 0.875) }}>
                      <svg width={Math.round(desktopH * 0.4375)} height={Math.round(desktopH * 0.4375)} viewBox="0 0 14 14" fill="none">
                        <path d="M2 2h4v4H2zM8 2h4v4H8zM2 8h4v4H2zM8 8h4v4H8z" fill="white" opacity="0.9"/>
                      </svg>
                    </div>
                    <span className="font-extrabold tracking-tight text-[#1c1c1c]"
                      style={{ fontSize: Math.max(14, Math.round(desktopH * 0.525)) }}>
                      {form.logoText || "Laundry Master"}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-stone-400 mb-2">Mobile — {mobileH}px</p>
              <div className="inline-flex items-center gap-2 bg-white border border-[#f0f0f0] rounded px-3 py-2">
                {form.logoUrl ? (
                  <img src={form.logoUrl} alt="logo"
                    style={{ height: mobileH, width: "auto", maxWidth: 120 }} className="object-contain" />
                ) : (
                  <>
                    <div className="bg-[#1c1c1c] rounded-sm flex items-center justify-center"
                      style={{ width: Math.round(mobileH * 0.875), height: Math.round(mobileH * 0.875) }}>
                      <svg width={Math.round(mobileH * 0.4375)} height={Math.round(mobileH * 0.4375)} viewBox="0 0 14 14" fill="none">
                        <path d="M2 2h4v4H2zM8 2h4v4H8zM2 8h4v4H8z" fill="white" opacity="0.9"/>
                      </svg>
                    </div>
                    <span className="font-extrabold tracking-tight text-[#1c1c1c]"
                      style={{ fontSize: Math.max(11, Math.round(mobileH * 0.525)) }}>
                      {form.logoText || "Laundry Master"}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving}
          className="px-6 py-2.5 bg-[#1a2e1a] text-white text-sm font-semibold rounded-lg hover:bg-[#243824] disabled:opacity-50 transition-colors">
          {saving ? "Saving…" : "Save Logo Settings"}
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
            <Check className="w-3.5 h-3.5" /> Saved — refresh the site to see changes
          </span>
        )}
      </div>
    </div>
  );
}

// ── Images tab ────────────────────────────────────────────────────────────────

function ImagesTab() {
  const invalidate = useInvalidateSiteImages();
  const [images, setImages] = useState<SiteImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    apiGet<SiteImage[]>("/api/admin/site-images")
      .then(setImages)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleChange = useCallback(async (img: SiteImage, url: string) => {
    // Optimistic update
    setImages(prev => prev.map(i => i.key === img.key ? { ...i, url } : i));
    setSaving(p => ({ ...p, [img.key]: true }));
    setErrors(p => ({ ...p, [img.key]: "" }));
    try {
      await apiPut(`/api/admin/site-images/${img.key}`, { url });
      setSaved(p => ({ ...p, [img.key]: true }));
      setTimeout(() => setSaved(p => ({ ...p, [img.key]: false })), 2500);
      invalidate();
    } catch (e: any) {
      setErrors(p => ({ ...p, [img.key]: e.message || "Failed to save" }));
    } finally {
      setSaving(p => ({ ...p, [img.key]: false }));
    }
  }, [invalidate]);

  if (loading) return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array(6).fill(0).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-stone-200 p-5 animate-pulse">
          <div className="h-4 bg-stone-100 rounded w-2/3 mb-2" />
          <div className="aspect-video bg-stone-100 rounded-lg mb-3" />
          <div className="h-3 bg-stone-100 rounded w-full" />
        </div>
      ))}
    </div>
  );

  // Group by section
  const sections = Array.from(new Set(images.map(i => i.section)));

  const ASPECT_HINTS: Record<string, string> = {
    Articles: "16:9 recommended",
    Categories: "4:3 recommended",
    Home: "16:9 wide",
    About: "4:3 or 1:1",
    Consultations: "16:9",
    Knowledge: "16:9 wide",
  };

  return (
    <div className="space-y-10">
      {sections.map(section => (
        <div key={section}>
          <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-5 pb-2 border-b border-stone-100">
            {section}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {images.filter(i => i.section === section).map(img => (
              <div key={img.key} className="bg-white rounded-xl border border-stone-200 p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-stone-800">{img.label}</p>
                    {img.description && (
                      <p className="text-[11px] text-stone-400 mt-0.5 leading-relaxed">{img.description}</p>
                    )}
                  </div>
                  {saving[img.key] && <RefreshCw className="w-4 h-4 text-stone-300 animate-spin shrink-0 mt-0.5" />}
                  {saved[img.key] && <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />}
                </div>

                <ImageField
                  label=""
                  value={img.url}
                  onChange={url => handleChange(img, url)}
                  aspectHint={ASPECT_HINTS[section] || undefined}
                />

                {errors[img.key] && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />{errors[img.key]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

type Tab = "logo" | "images";

export function Branding() {
  const [tab, setTab] = useState<Tab>("logo");

  const tabs: { id: Tab; label: string; Icon: any }[] = [
    { id: "logo",   label: "Logo & Brand",  Icon: Palette   },
    { id: "images", label: "Site Images",   Icon: ImageIcon  },
  ];

  return (
    <AdminLayout
      title="Branding & Images"
      breadcrumbs={[{ label: "Configuration" }, { label: "Branding & Images" }]}
    >
      <div className="mb-6 flex gap-1 bg-stone-100 p-1 rounded-xl w-fit">
        {tabs.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={[
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
              tab === id
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-500 hover:text-stone-800",
            ].join(" ")}>
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "logo"   && <LogoTab />}
      {tab === "images" && <ImagesTab />}
    </AdminLayout>
  );
}
