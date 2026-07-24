import { useState, useEffect } from "react";
import { AdminLayout } from "./AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { adminApi } from "@/lib/adminApi";

// ── Field + Section + Page config ─────────────────────────────────────────

type FieldDef = { key: string; label: string; type: "text" | "textarea" | "email" };
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
};

const PAGE_KEYS = Object.keys(PAGE_CONFIGS);

// ── Component ──────────────────────────────────────────────────────────────

export function PageContent() {
  const [activeTab, setActiveTab] = useState(PAGE_KEYS[0]);
  // fieldValues[page][fieldKey] = current edited value
  const [fieldValues, setFieldValues] = useState<Record<string, Record<string, string>>>({});
  const [loadedPages, setLoadedPages] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

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
                        {field.type === "textarea" ? (
                          <textarea
                            rows={3}
                            value={getVal(activeTab, field.key)}
                            onChange={(e) => setVal(activeTab, field.key, e.target.value)}
                            className="w-full border border-stone-200 rounded-md px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400 resize-y"
                            placeholder={`Enter ${field.label.toLowerCase()}…`}
                          />
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
