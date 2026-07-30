import { useState, useEffect, useCallback } from "react";
import { Link as LinkIcon, GripVertical, Eye, EyeOff, ChevronUp, ChevronDown } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "./AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { adminApi } from "@/lib/adminApi";
import { HOME_DEFAULT_SECTIONS, type HomeSectionConfig } from "@/pages/Home";

// ── Field + Section + Page config ─────────────────────────────────────────

type FieldDef = { key: string; label: string; type: "text" | "textarea" | "email" | "url" | "checkbox" };
type SectionDef = { title: string; fields: FieldDef[] };
type PageDef = { label: string; sections: SectionDef[] };

const PAGE_CONFIGS: Record<string, PageDef> = {
  home: {
    label: "Homepage",
    sections: [
      {
        title: "Hero",
        fields: [
          { key: "hero_tag", label: "Top Label", type: "text" },
          { key: "hero_headline", label: "Headline", type: "text" },
          { key: "hero_subheadline", label: "Subheadline", type: "textarea" },
          { key: "hero_cta_primary", label: "Primary Button Label", type: "text" },
          { key: "hero_cta_secondary", label: "Secondary Link Label", type: "text" },
          { key: "caption_box", label: "Photo Caption Box Text", type: "textarea" },
        ],
      },
      {
        title: "Expertise Section",
        fields: [
          { key: "expertise_label", label: "Section Label", type: "text" },
          { key: "expertise_heading", label: "Section Heading", type: "text" },
          { key: "expertise_body", label: "Section Body", type: "textarea" },
          { key: "expertise_item1_title", label: "Item 1 — Title", type: "text" },
          { key: "expertise_item1_body", label: "Item 1 — Description", type: "textarea" },
          { key: "expertise_item2_title", label: "Item 2 — Title", type: "text" },
          { key: "expertise_item2_body", label: "Item 2 — Description", type: "textarea" },
        ],
      },
      {
        title: "Knowledge Section",
        fields: [
          { key: "knowledge_heading", label: "Section Heading", type: "text" },
          { key: "knowledge_body", label: "Section Body", type: "textarea" },
        ],
      },
    ],
  },
  about: {
    label: "About",
    sections: [
      {
        title: "Hero",
        fields: [
          { key: "hero_badge", label: "Badge Text", type: "text" },
          { key: "hero_headline", label: "Headline", type: "text" },
          { key: "hero_subheadline", label: "Subheadline", type: "textarea" },
        ],
      },
      {
        title: "Mission",
        fields: [
          { key: "mission_heading", label: "Heading", type: "text" },
          { key: "mission_body1", label: "Paragraph 1", type: "textarea" },
          { key: "mission_body2", label: "Paragraph 2", type: "textarea" },
        ],
      },
      {
        title: "Statistics",
        fields: [
          { key: "stat1_value", label: "Stat 1 — Value", type: "text" },
          { key: "stat1_label", label: "Stat 1 — Label", type: "text" },
          { key: "stat2_value", label: "Stat 2 — Value", type: "text" },
          { key: "stat2_label", label: "Stat 2 — Label", type: "text" },
          { key: "stat3_value", label: "Stat 3 — Value", type: "text" },
          { key: "stat3_label", label: "Stat 3 — Label", type: "text" },
        ],
      },
      {
        title: "Editorial Standards",
        fields: [
          { key: "editorial_heading", label: "Section Heading", type: "text" },
          { key: "editorial_body", label: "Section Body", type: "textarea" },
          { key: "editorial_card1_title", label: "Card 1 — Title", type: "text" },
          { key: "editorial_card1_body", label: "Card 1 — Body", type: "textarea" },
          { key: "editorial_card2_title", label: "Card 2 — Title", type: "text" },
          { key: "editorial_card2_body", label: "Card 2 — Body", type: "textarea" },
          { key: "editorial_card3_title", label: "Card 3 — Title", type: "text" },
          { key: "editorial_card3_body", label: "Card 3 — Body", type: "textarea" },
        ],
      },
    ],
  },
  contact: {
    label: "Contact",
    sections: [
      {
        title: "Page Header",
        fields: [
          { key: "heading", label: "Heading", type: "text" },
          { key: "subheading", label: "Subheading", type: "textarea" },
          { key: "form_heading", label: "Form Section Heading", type: "text" },
        ],
      },
      {
        title: "Contact Details",
        fields: [
          { key: "general_email", label: "General Inquiries Email", type: "email" },
          { key: "editorial_email", label: "Editorial Email", type: "email" },
          { key: "address", label: "Headquarters Address (one line per row)", type: "textarea" },
        ],
      },
    ],
  },
  consultations: {
    label: "Consultations",
    sections: [
      {
        title: "Hero",
        fields: [
          { key: "hero_headline", label: "Headline", type: "text" },
          { key: "hero_subheadline", label: "Subheadline", type: "textarea" },
          { key: "hero_cta", label: "CTA Button Label", type: "text" },
        ],
      },
      {
        title: "Services Section",
        fields: [
          { key: "services_heading", label: "Section Heading", type: "text" },
          { key: "services_subheading", label: "Section Subheading", type: "textarea" },
        ],
      },
    ],
  },
  knowledge: {
    label: "Knowledge Hub",
    sections: [
      {
        title: "Hero",
        fields: [
          { key: "hero_headline", label: "Headline", type: "text" },
          { key: "hero_subheadline", label: "Subheadline", type: "textarea" },
        ],
      },
    ],
  },
  footer: {
    label: "Footer",
    sections: [
      {
        title: "Brand & Newsletter",
        fields: [
          { key: "tagline", label: "Brand Tagline", type: "textarea" },
          { key: "newsletter_label", label: "Newsletter Label", type: "text" },
        ],
      },
      {
        title: "Bottom Bar",
        fields: [
          { key: "copyright", label: "Copyright Text", type: "text" },
        ],
      },
    ],
  },
  banner: {
    label: "Banner",
    sections: [
      {
        title: "Contact Bar",
        fields: [
          { key: "hours",    label: "Opening Hours",   type: "text" },
          { key: "phone",    label: "Phone Number",    type: "text" },
          { key: "location", label: "Location / Reach", type: "text" },
        ],
      },
      {
        title: "Social Media Links",
        fields: [
          { key: "facebook_show",  label: "Show Facebook icon",   type: "checkbox" },
          { key: "facebook_url",   label: "Facebook URL",         type: "url" },
          { key: "twitter_show",   label: "Show Twitter / X icon", type: "checkbox" },
          { key: "twitter_url",    label: "Twitter / X URL",      type: "url" },
          { key: "linkedin_show",  label: "Show LinkedIn icon",   type: "checkbox" },
          { key: "linkedin_url",   label: "LinkedIn URL",         type: "url" },
          { key: "instagram_show", label: "Show Instagram icon",  type: "checkbox" },
          { key: "instagram_url",  label: "Instagram URL",        type: "url" },
        ],
      },
    ],
  },
};

const PAGE_KEYS = Object.keys(PAGE_CONFIGS);

// ── Homepage Sections Editor ───────────────────────────────────────────────

function HomeSectionsEditor({ onSaved }: { onSaved?: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [sections, setSections] = useState<HomeSectionConfig[]>(HOME_DEFAULT_SECTIONS);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi.pageContent.get("home").then((data) => {
      if (data?.sections_layout) {
        try {
          const parsed = JSON.parse(data.sections_layout) as HomeSectionConfig[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSections(parsed);
            setLoaded(true);
            return;
          }
        } catch { /* fall through */ }
      }
      setLoaded(true);
    });
  }, []);

  const move = useCallback((idx: number, dir: -1 | 1) => {
    setSections((prev) => {
      const next = [...prev];
      const swap = idx + dir;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  }, []);

  const toggleVisible = useCallback((id: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s))
    );
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const layout = JSON.stringify(sections);
      await adminApi.pageContent.update("home", { sections_layout: layout });
      // Push into public cache immediately — no stale flash.
      qc.setQueryData(["page-content", "home"], (old: any) => ({
        ...(old ?? {}),
        sections_layout: layout,
      }));
      toast({ title: "Saved", description: "Homepage section order and visibility updated." });
      onSaved?.();
    } catch {
      toast({ title: "Error", description: "Failed to save. Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-stone-200 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-stone-900">Homepage Sections</h3>
        <button
          onClick={handleSave}
          disabled={saving || !loaded}
          className="px-4 py-1.5 bg-stone-900 text-white text-xs font-semibold rounded-md hover:bg-stone-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving…" : "Save order"}
        </button>
      </div>
      <p className="text-xs text-stone-400 mb-5">Reorder or hide sections. Drag handles (⠿) are decorative — use the arrows to reorder.</p>

      {!loaded ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-stone-50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {sections.map((section, idx) => (
            <div
              key={section.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors ${
                section.visible
                  ? "bg-white border-stone-200"
                  : "bg-stone-50 border-stone-100"
              }`}
            >
              {/* Grip handle */}
              <GripVertical className="w-4 h-4 text-stone-300 shrink-0 cursor-grab" />

              {/* Section name */}
              <span className={`flex-1 text-sm font-medium ${section.visible ? "text-stone-800" : "text-stone-400 line-through"}`}>
                {section.label}
              </span>

              {/* Visibility toggle */}
              <button
                onClick={() => toggleVisible(section.id)}
                title={section.visible ? "Hide section" : "Show section"}
                className={`w-8 h-8 flex items-center justify-center rounded-md border transition-colors ${
                  section.visible
                    ? "border-stone-200 text-stone-600 hover:bg-stone-50"
                    : "border-stone-200 text-stone-300 hover:bg-stone-50"
                }`}
              >
                {section.visible
                  ? <Eye className="w-3.5 h-3.5" />
                  : <EyeOff className="w-3.5 h-3.5" />}
              </button>

              {/* Up */}
              <button
                onClick={() => move(idx, -1)}
                disabled={idx === 0}
                className="w-8 h-8 flex items-center justify-center rounded-md border border-stone-200 text-stone-500 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>

              {/* Down */}
              <button
                onClick={() => move(idx, 1)}
                disabled={idx === sections.length - 1}
                className="w-8 h-8 flex items-center justify-center rounded-md border border-stone-200 text-stone-500 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export function PageContent() {
  const [activeTab, setActiveTab] = useState(PAGE_KEYS[0]);
  // fieldValues[page][fieldKey] = current edited value
  const [fieldValues, setFieldValues] = useState<Record<string, Record<string, string>>>({});
  const [loadedPages, setLoadedPages] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const qc = useQueryClient();

  // Load content for the active tab (lazy, once per page)
  useEffect(() => {
    if (loadedPages.has(activeTab)) return;
    adminApi.pageContent.get(activeTab).then((data) => {
      setFieldValues((prev) => ({ ...prev, [activeTab]: data ?? {} }));
      setLoadedPages((prev) => new Set([...prev, activeTab]));
    });
  }, [activeTab, loadedPages]);

  function getVal(page: string, key: string): string {
    return fieldValues[page]?.[key] ?? "";
  }

  function setVal(page: string, key: string, value: string) {
    setFieldValues((prev) => ({
      ...prev,
      [page]: { ...(prev[page] ?? {}), [key]: value },
    }));
  }

  async function saveSection(page: string, section: SectionDef) {
    const sectionKey = `${page}::${section.title}`;
    setSaving((s) => ({ ...s, [sectionKey]: true }));
    try {
      const payload: Record<string, string> = {};
      for (const f of section.fields) {
        payload[f.key] = fieldValues[page]?.[f.key] ?? "";
      }
      await adminApi.pageContent.update(page, payload);
      // Immediately push new values into the public cache — no stale flash.
      qc.setQueryData(["page-content", page], (old: any) => ({
        ...(old ?? {}),
        ...payload,
      }));
      toast({ title: "Saved", description: `${PAGE_CONFIGS[page].label} — ${section.title} updated.` });
    } catch {
      toast({ title: "Error", description: "Failed to save. Please try again.", variant: "destructive" });
    } finally {
      setSaving((s) => ({ ...s, [sectionKey]: false }));
    }
  }

  const pageDef = PAGE_CONFIGS[activeTab];
  const isLoaded = loadedPages.has(activeTab);

  return (
    <AdminLayout title="Page Content" breadcrumbs={[{ label: "Page Content" }]}>
      <div className="max-w-4xl">
        <p className="text-sm text-stone-500 mb-6">
          Edit the text shown on each public page. Changes go live immediately after saving — no deployment needed.
        </p>

        {/* Tab bar */}
        <div className="flex gap-0 mb-8 border-b border-stone-200 overflow-x-auto">
          {PAGE_KEYS.map((key) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                activeTab === key
                  ? "border-stone-900 text-stone-900"
                  : "border-transparent text-stone-500 hover:text-stone-900"
              }`}
            >
              {PAGE_CONFIGS[key].label}
            </button>
          ))}
        </div>

        {/* Loading state */}
        {!isLoaded && (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white border border-stone-200 rounded-lg p-6 animate-pulse">
                <div className="h-4 bg-stone-100 rounded w-32 mb-5" />
                <div className="space-y-3">
                  <div className="h-9 bg-stone-100 rounded" />
                  <div className="h-9 bg-stone-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Homepage sections reorder/visibility editor */}
        {activeTab === "home" && <HomeSectionsEditor />}

        {/* Sections */}
        {isLoaded && (
          <div className="space-y-6">
            {pageDef.sections.map((section) => {
              const sectionKey = `${activeTab}::${section.title}`;
              return (
                <div key={section.title} className="bg-white border border-stone-200 rounded-lg p-6">
                  <h3 className="text-sm font-semibold text-stone-900 mb-5 pb-3 border-b border-stone-100">
                    {section.title}
                  </h3>
                  <div className="space-y-4">
                    {section.fields.map((field) => (
                      <div key={field.key}>
                        <label className="block text-xs font-semibold text-stone-500 mb-1.5 uppercase tracking-wide">
                          {field.label}
                        </label>
                        {field.type === "checkbox" ? (
                          <label className="flex items-center gap-3 cursor-pointer select-none">
                            <div className="relative shrink-0">
                              <input
                                type="checkbox"
                                className="sr-only"
                                checked={getVal(activeTab, field.key) !== "0"}
                                onChange={(e) => setVal(activeTab, field.key, e.target.checked ? "1" : "0")}
                              />
                              <div className={`w-9 h-5 rounded-full transition-colors ${getVal(activeTab, field.key) !== "0" ? "bg-stone-800" : "bg-stone-200"}`} />
                              <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${getVal(activeTab, field.key) !== "0" ? "translate-x-4" : ""}`} />
                            </div>
                            <span className="text-sm text-stone-600">{getVal(activeTab, field.key) !== "0" ? "Visible" : "Hidden"}</span>
                          </label>
                        ) : field.type === "textarea" ? (
                          <textarea
                            rows={3}
                            value={getVal(activeTab, field.key)}
                            onChange={(e) => setVal(activeTab, field.key, e.target.value)}
                            className="w-full border border-stone-200 rounded-md px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400 resize-y"
                            placeholder={`Enter ${field.label.toLowerCase()}…`}
                          />
                        ) : field.type === "url" ? (
                          <div className="relative">
                            <LinkIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 pointer-events-none" />
                            <input
                              type="url"
                              value={getVal(activeTab, field.key)}
                              onChange={(e) => setVal(activeTab, field.key, e.target.value)}
                              className="w-full border border-stone-200 rounded-md pl-8 pr-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400"
                              placeholder="https://…"
                            />
                          </div>
                        ) : (
                          <input
                            type={field.type}
                            value={getVal(activeTab, field.key)}
                            onChange={(e) => setVal(activeTab, field.key, e.target.value)}
                            className="w-full border border-stone-200 rounded-md px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400"
                            placeholder={`Enter ${field.label.toLowerCase()}…`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 flex justify-end">
                    <button
                      onClick={() => saveSection(activeTab, section)}
                      disabled={saving[sectionKey]}
                      className="px-5 py-2 bg-stone-900 text-white text-sm font-semibold rounded-md hover:bg-stone-700 disabled:opacity-50 transition-colors"
                    >
                      {saving[sectionKey] ? "Saving…" : `Save ${section.title}`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
