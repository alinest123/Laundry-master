import { useEffect, useRef, useState, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Table, TableRow, TableHeader, TableCell } from "@tiptap/extension-table";
import TextAlign from "@tiptap/extension-text-align";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import Highlight from "@tiptap/extension-highlight";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import { Node, mergeAttributes } from "@tiptap/core";
import {
  Bold, Italic, UnderlineIcon, Strikethrough, Code, Subscript as SubIcon,
  Superscript as SupIcon, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, IndentDecrease, IndentIncrease, Quote, Minus,
  Link as LinkIcon, Link2, Upload, ImageIcon, Table as TableIcon, Undo2, Redo2,
  ChevronDown, X, Check, AlertTriangle, Lightbulb, Info, Star,
  Wrench, FlaskConical, Code2, Shirt, SprayCan,
} from "lucide-react";

// ── Custom Callout Node ────────────────────────────────────────────────────────
type CalloutInfo = { label: string; Icon: React.ComponentType<{ className?: string }>; border: string; bg: string; iconColor: string };
const CALLOUT_TYPES: Record<string, CalloutInfo> = {
  "expert-tip":      { label: "Expert Tip",        Icon: Lightbulb,    border: "border-teal-400",  bg: "bg-teal-50",   iconColor: "text-teal-600" },
  "warning":         { label: "Warning",            Icon: AlertTriangle, border: "border-red-400",   bg: "bg-red-50",    iconColor: "text-red-600" },
  "important-note":  { label: "Important Note",     Icon: Info,          border: "border-blue-400",  bg: "bg-blue-50",   iconColor: "text-blue-600" },
  "key-takeaway":    { label: "Key Takeaway",       Icon: Star,          border: "border-amber-400", bg: "bg-amber-50",  iconColor: "text-amber-600" },
  "chemical-warning":{ label: "Chemical Warning",   Icon: FlaskConical,  border: "border-red-600",   bg: "bg-red-100",   iconColor: "text-red-700" },
  "pro-tip":         { label: "Professional Tip",   Icon: Wrench,        border: "border-green-400", bg: "bg-green-50",  iconColor: "text-green-700" },
  "fabric-care":     { label: "Fabric Care",        Icon: Shirt,         border: "border-indigo-400",bg: "bg-indigo-50", iconColor: "text-indigo-700" },
  "stain-removal":   { label: "Stain Removal",      Icon: SprayCan,      border: "border-violet-400",bg: "bg-violet-50", iconColor: "text-violet-700" },
};

const CalloutBlock = Node.create({
  name: "calloutBlock",
  group: "block",
  content: "block+",
  defining: true,

  addAttributes() {
    return { calloutType: { default: "expert-tip" } };
  },

  parseHTML() {
    return [{ tag: "div[data-callout]", getAttrs: el => ({ calloutType: (el as HTMLElement).dataset.callout }) }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const t = node.attrs.calloutType as string;
    const info = CALLOUT_TYPES[t] ?? CALLOUT_TYPES["expert-tip"];
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-callout": t,
        class: `callout callout-${t}`,
        style: `border-left: 4px solid; padding: 1rem 1.25rem; margin: 1.25rem 0; border-radius: 0 0.5rem 0.5rem 0;`,
      }),
      ["p", { class: "callout-label", style: "font-weight:700;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 0.5rem;" },
        info.label],
      ["div", { class: "callout-content" }, 0],
    ];
  },

  addCommands() {
    return {
      setCallout: (calloutType: string) => ({ commands }: any) =>
        commands.wrapIn(this.name, { calloutType }),
    } as any;
  },
});

// ── Link Modal ─────────────────────────────────────────────────────────────────
function LinkModal({ onConfirm, onClose, initialUrl = "" }: {
  onConfirm: (url: string, newTab: boolean) => void;
  onClose: () => void;
  initialUrl?: string;
}) {
  const [url, setUrl] = useState(initialUrl);
  const [newTab, setNewTab] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select(); }, []);

  const submit = () => {
    if (!url.trim()) return;
    onConfirm(url.trim(), newTab);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-stone-900 text-sm">Insert Link</h3>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-600"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">URL</label>
            <input ref={inputRef} className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30"
              placeholder="https://…" value={url} onChange={e => setUrl(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") submit(); if (e.key === "Escape") onClose(); }} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={newTab} onChange={e => setNewTab(e.target.checked)} className="w-4 h-4 rounded text-[#4a7c59]" />
            <span className="text-sm text-stone-700">Open in new tab</span>
          </label>
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={submit} className="flex-1 py-2 bg-[#4a7c59] text-white text-sm font-medium rounded-lg hover:bg-[#3d6849]">
            Insert Link
          </button>
          <button onClick={onClose} className="flex-1 py-2 border border-stone-200 text-sm rounded-lg hover:bg-stone-50">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Image Modal ────────────────────────────────────────────────────────────────
const API_ORIGIN = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";

function ImageModal({ onConfirm, onClose }: {
  onConfirm: (src: string, alt: string) => void;
  onClose: () => void;
}) {
  type Tab = "url" | "upload";
  const [tab, setTab] = useState<Tab>("url");

  // URL tab state
  const [src, setSrc] = useState("");
  const [alt, setAlt] = useState("");
  const urlInputRef = useRef<HTMLInputElement>(null);

  // Upload tab state
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [uploadAlt, setUploadAlt] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (tab === "url") urlInputRef.current?.focus();
  }, [tab]);

  // Generate local preview when file is chosen
  useEffect(() => {
    if (!file) { setPreview(""); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) { setUploadError("Please select an image file."); return; }
    if (f.size > 10 * 1024 * 1024) { setUploadError("Image must be under 10 MB."); return; }
    setUploadError("");
    setFile(f);
  };

  const submitUrl = () => { if (src.trim()) onConfirm(src.trim(), alt); };

  const submitUpload = async () => {
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      // Step 1 — request presigned URL
      const metaRes = await fetch(`${API_ORIGIN}/api/storage/uploads/request-url`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
      });
      if (!metaRes.ok) {
        const e = await metaRes.json().catch(() => ({}));
        throw new Error((e as any).error || `HTTP ${metaRes.status}`);
      }
      const { uploadURL, servingUrl: fileServingUrl } = await metaRes.json();

      // Step 2 — upload file directly to Supabase Storage
      const putRes = await fetch(uploadURL, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putRes.ok) throw new Error("Upload to storage failed.");

      // Step 3 — use the permanent public URL returned by the API
      onConfirm(fileServingUrl, uploadAlt || file.name.replace(/\.[^.]+$/, ""));
    } catch (err: any) {
      setUploadError(err.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h3 className="font-semibold text-stone-900 text-sm">Insert Image</h3>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-600"><X className="w-4 h-4" /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-200 px-5">
          {(["url", "upload"] as Tab[]).map(t => (
            <button key={t} type="button" onClick={() => setTab(t)}
              className={`pb-2.5 mr-5 text-xs font-medium border-b-2 transition-colors ${
                tab === t ? "border-[#4a7c59] text-[#4a7c59]" : "border-transparent text-stone-500 hover:text-stone-700"
              }`}>
              <span className="flex items-center gap-1.5">
                {t === "url" ? <><Link2 className="w-3 h-3" /> Paste URL</> : <><Upload className="w-3 h-3" /> Upload from device</>}
              </span>
            </button>
          ))}
        </div>

        <div className="p-5 space-y-3">
          {/* ── URL tab ── */}
          {tab === "url" && (
            <>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Image URL</label>
                <input ref={urlInputRef}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30"
                  placeholder="https://…/image.jpg" value={src} onChange={e => setSrc(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") submitUrl(); if (e.key === "Escape") onClose(); }} />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">
                  Alt text <span className="text-red-400">*</span>
                </label>
                <input className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30"
                  placeholder="Describe the image for accessibility…" value={alt} onChange={e => setAlt(e.target.value)} />
                {src && !alt && <p className="text-xs text-amber-600 mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3 shrink-0" /> Alt text improves accessibility and SEO.</p>}
              </div>
              {src && (
                <img src={src} alt={alt} className="w-full h-32 object-contain border border-stone-100 rounded-lg bg-stone-50"
                  onError={e => (e.currentTarget.style.display = "none")} />
              )}
              <div className="flex gap-2 pt-1">
                <button onClick={submitUrl} disabled={!src.trim()}
                  className="flex-1 py-2 bg-[#4a7c59] text-white text-sm font-medium rounded-lg hover:bg-[#3d6849] disabled:opacity-50">
                  Insert Image
                </button>
                <button onClick={onClose} className="flex-1 py-2 border border-stone-200 text-sm rounded-lg hover:bg-stone-50">Cancel</button>
              </div>
            </>
          )}

          {/* ── Upload tab ── */}
          {tab === "upload" && (
            <>
              {/* Drop zone / file picker */}
              {!file ? (
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-stone-200 rounded-xl p-8 text-center hover:border-[#4a7c59] hover:bg-[#4a7c59]/5 transition-colors group">
                  <ImageIcon className="w-10 h-10 text-stone-300 group-hover:text-[#4a7c59]/50 mx-auto mb-2 transition-colors" />
                  <p className="text-sm font-medium text-stone-700 group-hover:text-[#4a7c59]">Click to choose an image</p>
                  <p className="text-xs text-stone-400 mt-1">JPG, PNG, GIF, WebP — up to 10 MB</p>
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="relative rounded-lg overflow-hidden border border-stone-200 bg-stone-50">
                    <img src={preview} alt="Preview" className="w-full h-40 object-contain" />
                    <button type="button" onClick={() => { setFile(null); setPreview(""); setUploadAlt(""); }}
                      className="absolute top-2 right-2 p-1 bg-white/80 rounded-full shadow text-stone-500 hover:text-red-500 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-stone-500 truncate">{file.name} · {(file.size / 1024).toFixed(0)} KB</p>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

              {file && (
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">
                    Alt text <span className="text-stone-400">(recommended)</span>
                  </label>
                  <input className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30"
                    placeholder="Describe the image for accessibility…"
                    value={uploadAlt} onChange={e => setUploadAlt(e.target.value)} />
                </div>
              )}

              {uploadError && (
                <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{uploadError}</p>
              )}

              <div className="flex gap-2 pt-1">
                <button onClick={submitUpload} disabled={!file || uploading}
                  className="flex-1 py-2 bg-[#4a7c59] text-white text-sm font-medium rounded-lg hover:bg-[#3d6849] disabled:opacity-50 flex items-center justify-center gap-2">
                  {uploading ? (
                    <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" /> Uploading…</>
                  ) : "Upload & Insert"}
                </button>
                <button onClick={onClose} className="flex-1 py-2 border border-stone-200 text-sm rounded-lg hover:bg-stone-50">Cancel</button>
              </div>
              {!file && (
                <p className="text-center text-xs text-stone-400 mt-1">
                  Or <button type="button" className="text-[#4a7c59] underline underline-offset-2" onClick={() => setTab("url")}>paste a URL instead</button>
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Toolbar button ─────────────────────────────────────────────────────────────
function Btn({ active = false, disabled = false, onClick, title, children }: {
  active?: boolean; disabled?: boolean; onClick: () => void; title: string; children: React.ReactNode;
}) {
  return (
    <button type="button" title={title} disabled={disabled} onClick={onClick}
      className={`p-1.5 rounded transition-colors ${active
        ? "bg-[#4a7c59] text-white"
        : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
      } ${disabled ? "opacity-30 cursor-default" : ""}`}>
      {children}
    </button>
  );
}

function Sep() {
  return <div className="w-px h-5 bg-stone-200 mx-0.5" />;
}

// ── Main Editor ────────────────────────────────────────────────────────────────
interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  onSave?: () => void;
}

export function RichTextEditor({ value, onChange, placeholder, onSave }: RichTextEditorProps) {
  const [linkModal, setLinkModal] = useState<{ open: boolean; initialUrl?: string }>({ open: false });
  const [imageModal, setImageModal] = useState(false);
  const [calloutOpen, setCalloutOpen] = useState(false);
  const [headingOpen, setHeadingOpen] = useState(false);
  const [htmlView, setHtmlView] = useState(false);
  const [htmlRaw, setHtmlRaw] = useState(value);
  const [h1Warn, setH1Warn] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4, 5] },
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Subscript,
      Superscript,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer" },
      }),
      Image.configure({ inline: false }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder: placeholder ?? "Start writing your article…" }),
      CharacterCount,
      CalloutBlock,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
      // Detect H1 attempts via typed shortcuts
      if (html.includes("<h1>") || html.includes("<h1 ")) setH1Warn(true);
      else setH1Warn(false);
    },
    editorProps: {
      handleKeyDown: (_view, event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === "s") {
          event.preventDefault();
          onSave?.();
          return true;
        }
        return false;
      },
    },
  });

  // Sync external value changes (e.g., loading an article)
  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value || "", false);
    }
  }, [value, editor]);

  const insertLink = useCallback((url: string, newTab: boolean) => {
    if (!editor) return;
    const attrs: Record<string, string> = { href: url };
    if (newTab) { attrs.target = "_blank"; attrs.rel = "noopener noreferrer"; }
    editor.chain().focus().extendMarkToLink?.()
      .setLink(attrs).run();
    setLinkModal({ open: false });
  }, [editor]);

  const insertImage = useCallback((src: string, alt: string) => {
    editor?.chain().focus().setImage({ src, alt }).run();
    setImageModal(false);
  }, [editor]);

  const insertTable = useCallback(() => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  const setCallout = useCallback((type: string) => {
    (editor?.chain().focus() as any).setCallout(type).run();
    setCalloutOpen(false);
  }, [editor]);

  const applyHtmlView = useCallback(() => {
    if (!editor) return;
    editor.commands.setContent(htmlRaw, false);
    onChange(htmlRaw);
    setHtmlView(false);
  }, [editor, htmlRaw, onChange]);

  if (!editor) return null;

  const wordCount = editor.storage.characterCount?.words?.() ?? 0;

  // Heading dropdown label
  const currentHeading = editor.isActive("heading", { level: 2 }) ? "H2"
    : editor.isActive("heading", { level: 3 }) ? "H3"
    : editor.isActive("heading", { level: 4 }) ? "H4"
    : editor.isActive("heading", { level: 5 }) ? "H5"
    : "¶";

  return (
    <div className="border border-stone-200 rounded-xl overflow-hidden bg-white">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-stone-100 bg-stone-50 sticky top-0 z-10">

        {/* Undo / Redo */}
        <Btn title="Undo (Ctrl+Z)" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
          <Undo2 className="w-3.5 h-3.5" />
        </Btn>
        <Btn title="Redo (Ctrl+Shift+Z)" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
          <Redo2 className="w-3.5 h-3.5" />
        </Btn>

        <Sep />

        {/* Block type */}
        <div className="relative">
          <button type="button" onClick={() => { setHeadingOpen(o => !o); setCalloutOpen(false); }}
            className="flex items-center gap-1 px-2 py-1.5 rounded text-xs font-mono font-semibold text-stone-700 hover:bg-stone-100 transition-colors">
            {currentHeading} <ChevronDown className="w-3 h-3" />
          </button>
          {headingOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-stone-200 py-1 z-20 min-w-[140px]">
              {[
                { label: "Paragraph", cmd: () => editor.chain().focus().setParagraph().run(), active: editor.isActive("paragraph") },
                { label: "H2 — Section", cmd: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive("heading", { level: 2 }) },
                { label: "H3 — Sub-section", cmd: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive("heading", { level: 3 }) },
                { label: "H4", cmd: () => editor.chain().focus().toggleHeading({ level: 4 }).run(), active: editor.isActive("heading", { level: 4 }) },
                { label: "H5", cmd: () => editor.chain().focus().toggleHeading({ level: 5 }).run(), active: editor.isActive("heading", { level: 5 }) },
              ].map(({ label, cmd, active }) => (
                <button key={label} type="button" onClick={() => { cmd(); setHeadingOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-stone-50 transition-colors ${active ? "text-[#4a7c59] font-semibold" : "text-stone-700"}`}>
                  {label}
                </button>
              ))}
              <div className="px-3 py-1 border-t border-stone-100 mt-1">
                <p className="text-[10px] text-stone-400">H1 is reserved for the article title</p>
              </div>
            </div>
          )}
        </div>

        <Sep />

        {/* Inline marks */}
        <Btn title="Bold (Ctrl+B)" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="w-3.5 h-3.5" /></Btn>
        <Btn title="Italic (Ctrl+I)" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="w-3.5 h-3.5" /></Btn>
        <Btn title="Underline (Ctrl+U)" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon className="w-3.5 h-3.5" /></Btn>
        <Btn title="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough className="w-3.5 h-3.5" /></Btn>
        <Btn title="Inline Code" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}><Code className="w-3.5 h-3.5" /></Btn>

        <Sep />

        <Btn title="Superscript" active={editor.isActive("superscript")} onClick={() => editor.chain().focus().toggleSuperscript().run()}><SupIcon className="w-3.5 h-3.5" /></Btn>
        <Btn title="Subscript" active={editor.isActive("subscript")} onClick={() => editor.chain().focus().toggleSubscript().run()}><SubIcon className="w-3.5 h-3.5" /></Btn>

        <Sep />

        {/* Alignment */}
        <Btn title="Align Left" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}><AlignLeft className="w-3.5 h-3.5" /></Btn>
        <Btn title="Align Center" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}><AlignCenter className="w-3.5 h-3.5" /></Btn>
        <Btn title="Align Right" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}><AlignRight className="w-3.5 h-3.5" /></Btn>
        <Btn title="Justify" active={editor.isActive({ textAlign: "justify" })} onClick={() => editor.chain().focus().setTextAlign("justify").run()}><AlignJustify className="w-3.5 h-3.5" /></Btn>

        <Sep />

        {/* Lists */}
        <Btn title="Bullet List" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="w-3.5 h-3.5" /></Btn>
        <Btn title="Ordered List" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="w-3.5 h-3.5" /></Btn>
        <Btn title="Outdent" onClick={() => editor.chain().focus().liftListItem("listItem").run()}><IndentDecrease className="w-3.5 h-3.5" /></Btn>
        <Btn title="Indent" onClick={() => editor.chain().focus().sinkListItem("listItem").run()}><IndentIncrease className="w-3.5 h-3.5" /></Btn>

        <Sep />

        {/* Block elements */}
        <Btn title="Blockquote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="w-3.5 h-3.5" /></Btn>
        <Btn title="Code Block" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}><Code2 className="w-3.5 h-3.5" /></Btn>
        <Btn title="Horizontal Rule" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus className="w-3.5 h-3.5" /></Btn>

        <Sep />

        {/* Link */}
        <Btn title="Insert / Edit Link (Ctrl+K)" active={editor.isActive("link")}
          onClick={() => setLinkModal({ open: true, initialUrl: editor.getAttributes("link").href ?? "" })}>
          <LinkIcon className="w-3.5 h-3.5" />
        </Btn>

        {/* Image */}
        <Btn title="Insert Image" onClick={() => setImageModal(true)}>
          <ImageIcon className="w-3.5 h-3.5" />
        </Btn>

        {/* Table */}
        <Btn title="Insert Table" onClick={insertTable}>
          <TableIcon className="w-3.5 h-3.5" />
        </Btn>

        <Sep />

        {/* Callout blocks */}
        <div className="relative">
          <button type="button" onClick={() => { setCalloutOpen(o => !o); setHeadingOpen(false); }}
            className="flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium text-stone-700 hover:bg-stone-100 transition-colors">
            Block <ChevronDown className="w-3 h-3" />
          </button>
          {calloutOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-stone-200 py-1 z-20 min-w-[180px]">
              {Object.entries(CALLOUT_TYPES).map(([type, info]) => (
                <button key={type} type="button" onClick={() => setCallout(type)}
                  className="w-full text-left px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-50 transition-colors flex items-center gap-2">
                  <info.Icon className={`w-3.5 h-3.5 shrink-0 ${info.iconColor}`} /> {info.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <Sep />

        {/* HTML source toggle */}
        <button type="button" title="HTML source view" onClick={() => { setHtmlRaw(editor.getHTML()); setHtmlView(v => !v); }}
          className={`flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${htmlView ? "bg-[#4a7c59] text-white" : "text-stone-600 hover:bg-stone-100"}`}>
          <Code2 className="w-3 h-3" /> HTML
        </button>

        {/* Word count */}
        <div className="ml-auto text-[10px] text-stone-400 pr-1">
          {wordCount} words
        </div>
      </div>

      {/* ── H1 warning ── */}
      {h1Warn && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-700 text-xs">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          The article title is already the H1. Using another H1 in the body hurts SEO — use H2 for sections instead.
          <button type="button" className="ml-auto text-amber-500 hover:text-amber-700" onClick={() => setH1Warn(false)}><X className="w-3 h-3" /></button>
        </div>
      )}

      {/* ── Bubble menu (link editing) ── */}
      {editor && (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}
          shouldShow={({ editor }) => editor.isActive("link")}>
          <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-lg shadow-lg p-1">
            <button type="button" className="px-2 py-1 text-xs text-[#4a7c59] hover:bg-stone-50 rounded"
              onClick={() => setLinkModal({ open: true, initialUrl: editor.getAttributes("link").href })}>
              Edit
            </button>
            <button type="button" className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded"
              onClick={() => editor.chain().focus().unsetLink().run()}>
              Remove
            </button>
          </div>
        </BubbleMenu>
      )}

      {/* ── Editor content or HTML source ── */}
      {htmlView ? (
        <div className="p-4 space-y-3">
          <p className="text-xs text-stone-500">Editing raw HTML. Click "Apply" to update the editor.</p>
          <textarea
            className="w-full min-h-[400px] font-mono text-xs p-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30 resize-y bg-stone-50"
            value={htmlRaw}
            onChange={e => setHtmlRaw(e.target.value)}
          />
          <div className="flex gap-2">
            <button type="button" onClick={applyHtmlView}
              className="px-4 py-2 bg-[#4a7c59] text-white text-sm rounded-lg hover:bg-[#3d6849] flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" /> Apply HTML
            </button>
            <button type="button" onClick={() => setHtmlView(false)}
              className="px-4 py-2 border border-stone-200 text-sm rounded-lg hover:bg-stone-50">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <EditorContent editor={editor} className="rich-editor-content" />
      )}

      {/* ── Modals ── */}
      {linkModal.open && (
        <LinkModal
          initialUrl={linkModal.initialUrl}
          onConfirm={insertLink}
          onClose={() => setLinkModal({ open: false })}
        />
      )}
      {imageModal && <ImageModal onConfirm={insertImage} onClose={() => setImageModal(false)} />}

      {/* Close dropdowns on outside click */}
      {(calloutOpen || headingOpen) && (
        <div className="fixed inset-0 z-10" onClick={() => { setCalloutOpen(false); setHeadingOpen(false); }} />
      )}
    </div>
  );
}
