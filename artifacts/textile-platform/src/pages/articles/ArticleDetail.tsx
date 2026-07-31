import { useState, useEffect, useRef, useCallback } from "react";
import { Shell } from "@/components/layout/Shell";
import { useRoute, Link, useLocation } from "wouter";
import {
  ChevronRight, Clock, User, Share2, Bookmark, MessageCircle, Send,
  CheckCircle, Copy, Linkedin, Facebook, Zap, BookOpen,
  ArrowRight, GitBranch, Shield, Lightbulb, Download, Type, Moon,
  Sun, Quote, FileText, BarChart2, Star, Award, TrendingUp,
  ChevronDown, ChevronUp, Printer,
} from "lucide-react";
import { PageSeo } from "@/components/seo/PageSeo";
import { ArticleSchema, BreadcrumbSchema, FAQSchema, PersonSchema } from "@/components/seo/JsonLd";

const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined) ?? "";

// X (formerly Twitter) logo — replaces the removed Twitter bird icon
function XLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useGetArticle, getGetArticleQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { getArticleImage } from "@/lib/articleImages";
import { marked, Renderer } from "marked";

// ── Markdown renderer setup ────────────────────────────────────────────────────

const buildRenderer = () => {
  const renderer = new Renderer();
  renderer.heading = ({ text, depth }: { text: string; depth: number }) => {
    const id = text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    return `<h${depth} id="${id}">${text}</h${depth}>`;
  };
  renderer.blockquote = ({ text }: { text: string }) =>
    `<blockquote class="article-blockquote">${text}</blockquote>`;
  renderer.table = (token: any) => {
    const header = token.header.map((h: any) =>
      `<th>${typeof h === "object" ? h.text ?? String(h) : h}</th>`
    ).join("");
    const rows = token.rows.map((row: any[]) =>
      `<tr>${row.map((cell: any) =>
        `<td>${typeof cell === "object" ? cell.text ?? String(cell) : cell}</td>`
      ).join("")}</tr>`
    ).join("");
    return `<div class="table-wrapper"><table class="article-table"><thead><tr>${header}</tr></thead><tbody>${rows}</tbody></table></div>`;
  };
  return renderer;
};

marked.use({ renderer: buildRenderer(), breaks: true });

/**
 * When users paste raw markdown into TipTap, it collapses all newlines so
 * the entire article ends up as one long line, with ## headings, --- rules,
 * and - list items all embedded inline.  marked needs these at the start of
 * a line to recognise them as block-level elements.
 *
 * This function handles two complementary problems:
 * 1. insertMarkdownNewlines — adds \n\n before/after block-level markers
 *    (##, ###, ---, and list items that follow sentence-ending punctuation)
 *    that appear mid-line.
 * 2. splitMergedHeadingLines — for any line that already starts with a
 *    heading marker, splits off trailing paragraph text that TipTap merged
 *    onto the same line.
 */
function insertMarkdownNewlines(text: string): string {
  let t = text;
  // Insert double newline before ## and ### headings that appear mid-text
  t = t.replace(/([^\n])(#{1,6} )/g, '$1\n\n$2');
  // Insert double newline before --- horizontal rules mid-text
  t = t.replace(/([^\n])(---)/g, '$1\n\n$2');
  // Insert double newline after --- if followed immediately by text (no newline)
  t = t.replace(/(---)\s*([^\n\-])/g, '$1\n\n$2');
  // Insert newline before - list items that follow sentence-ending punctuation
  t = t.replace(/([.!?:]) (- )/g, '$1\n\n$2');
  // Insert newline before | table rows mid-text
  t = t.replace(/([^\n])(\|[^\n]+\|)/g, '$1\n\n$2');
  return t;
}

function splitMergedHeadingLines(text: string): string {
  return text.split('\n').map(line => {
    if (!/^#{1,6}\s/.test(line)) return line;
    // Split after closing inline italic/bold marker
    let split = line.replace(/^(#{1,6}\s.*?[*_])\s+([A-Z])/, '$1\n\n$2');
    if (split !== line) return split;
    // Split after sentence-ending punctuation + capital
    split = line.replace(/^(#{1,6}\s.*?[.!?])\s+([A-Z])/, '$1\n\n$2');
    return split;
  }).join('\n');
}

function renderMarkdown(content: string): string {
  if (!content) return "";
  const trimmed = content.trim();
  try {
    // TipTap saves as HTML. Clean HTML should be rendered directly.
    // Exception: when raw markdown is pasted into TipTap, it wraps everything
    // in <p> tags — <p>## Heading *text*</p>. The ## inside a <p> is invisible
    // to marked, so we detect this pattern, strip the HTML wrapper, split any
    // merged heading+paragraph lines, then re-parse.
    if (trimmed.startsWith('<')) {
      const flat = trimmed.replace(/\s+/g, ' ');
      const hasWrappedMarkdown = /<p>\s*#{1,6}\s/.test(flat);
      if (!hasWrappedMarkdown) return trimmed; // clean TipTap HTML — render as-is
      // Strip HTML → plain markdown text
      let text = trimmed
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
        .trim();
      // Re-insert newlines before block-level markers collapsed by TipTap,
      // then split any heading lines that still have merged paragraph text.
      text = insertMarkdownNewlines(text);
      text = splitMergedHeadingLines(text);
      return marked.parse(text) as string;
    }
    // Raw markdown — may still be one long line if TipTap collapsed newlines
    // before the content was stripped of its <p> wrapper.
    let processed = insertMarkdownNewlines(trimmed);
    processed = splitMergedHeadingLines(processed);
    return marked.parse(processed) as string;
  } catch {
    return content;
  }
}

function countWords(markdown: string): number {
  return markdown.replace(/<[^>]*>/g, "").trim().split(/\s+/).filter(Boolean).length;
}

// ── Types ──────────────────────────────────────────────────────────────────────

interface Comment {
  id: number; authorName: string; content: string; createdAt: string;
}

// ── Reading progress bar ───────────────────────────────────────────────────────

function ReadingProgressBar() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const update = () => {
      const scrolled = window.scrollY;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setPct(total > 0 ? Math.min(100, (scrolled / total) * 100) : 0);
    };
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-[3px] bg-[#e8e8e4]">
      <div
        className="h-full bg-[#4a7c59] transition-[width] duration-75 ease-linear"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ── Floating share sidebar ─────────────────────────────────────────────────────

function FloatingShare({ title, url, pdfUrl }: { title: string; url: string; pdfUrl?: string }) {
  const [copied, setCopied] = useState(false);
  const copyLink = () => {
    try {
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.cssText = "position:fixed;top:-9999px;opacity:0;pointer-events:none";
      document.body.appendChild(ta); ta.focus(); ta.select();
      document.execCommand("copy"); document.body.removeChild(ta);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    } catch { /* nothing */ }
  };
  const enc = encodeURIComponent(url), encT = encodeURIComponent(title);
  const items = [
    { Icon: Linkedin, label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc}`, color: "#0A66C2" },
    { Icon: XLogo, label: "X", href: `https://twitter.com/intent/tweet?text=${encT}&url=${enc}`, color: "#000" },
    { Icon: Facebook, label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${enc}`, color: "#1877F2" },
  ];
  return (
    <div className="hidden xl:flex flex-col items-center gap-3 sticky top-32 self-start">
      <span className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-1">Share</span>
      {items.map(({ Icon, label, href, color }) => (
        <a key={label} href={href} target="_blank" rel="noopener noreferrer" title={label}
          className="w-9 h-9 rounded-full border border-[#e8e8e4] bg-white hover:border-[#ccc] hover:shadow-sm flex items-center justify-center transition-all group">
          <Icon className="w-4 h-4 text-[#aaa] group-hover:text-[var(--share-color)] transition-colors"
            style={{ "--share-color": color } as React.CSSProperties} />
        </a>
      ))}
      <button onClick={copyLink} title="Copy link"
        className="w-9 h-9 rounded-full border border-[#e8e8e4] bg-white hover:border-[#ccc] hover:shadow-sm flex items-center justify-center transition-all">
        {copied ? <CheckCircle className="w-4 h-4 text-[#4a7c59]" /> : <Copy className="w-4 h-4 text-[#aaa]" />}
      </button>
      <button onClick={() => window.print()} title="Print / Save as PDF"
        className="w-9 h-9 rounded-full border border-[#e8e8e4] bg-white hover:border-[#ccc] hover:shadow-sm flex items-center justify-center transition-all">
        <Printer className="w-4 h-4 text-[#aaa]" />
      </button>
      {pdfUrl && (
        <a href={pdfUrl} download title="Download PDF"
          className="w-9 h-9 rounded-full border border-[#e8e8e4] bg-white hover:border-[#4a7c59] hover:shadow-sm flex items-center justify-center transition-all group">
          <Download className="w-4 h-4 text-[#aaa] group-hover:text-[#4a7c59] transition-colors" />
        </a>
      )}
    </div>
  );
}

// ── Active TOC sidebar ─────────────────────────────────────────────────────────

function ArticleTOC({
  items, tags,
}: {
  items: { id: string; title: string; level: number }[];
  tags?: { id: number; name: string; slug: string }[];
}) {
  const [activeId, setActiveId] = useState<string>("");
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!items.length) return;
    const headingEls = items.map(i => document.getElementById(i.id)).filter(Boolean) as HTMLElement[];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length > 0) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );
    headingEls.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  return (
    <aside className="w-64 shrink-0 hidden lg:block sticky top-28 self-start max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
      <div>
        {/* Contents */}
        <button onClick={() => setOpen(o => !o)}
          className="w-full flex items-center justify-between mb-4 group">
          <span className="text-[11px] font-bold text-[#888] uppercase tracking-widest">Contents</span>
          {open ? <ChevronUp className="w-3 h-3 text-[#aaa]" /> : <ChevronDown className="w-3 h-3 text-[#aaa]" />}
        </button>
        {open && items.length > 0 && (
          <nav>
            <ul className="space-y-0.5 border-l border-[#e8e8e4]">
              {items.map((item) => {
                const active = activeId === item.id;
                return (
                  <li key={item.id} style={{ paddingLeft: `${(item.level - 2) * 12 + 12}px` }}>
                    <a href={`#${item.id}`}
                      className={`block py-1.5 text-[13px] leading-snug transition-colors border-l-2 -ml-px pl-3
                        ${active
                          ? "border-[#4a7c59] text-[#4a7c59] font-semibold"
                          : "border-transparent text-[#888] hover:text-[#333] hover:border-[#ccc]"
                        }`}>
                      {item.title}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="mt-8 pt-6 border-t border-[#eaeaea]">
            <p className="text-[11px] font-bold text-[#888] uppercase tracking-widest mb-3">Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {tags.map(tag => (
                <span key={tag.id}
                  className="text-[11px] bg-[#f5f5f2] px-2.5 py-1 text-[#666] border border-[#e8e8e4] rounded-full">
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

// ── Knowledge info cards ───────────────────────────────────────────────────────

function KnowledgeCards({ article }: { article: any }) {
  const levelMap: Record<string, { label: string; color: string; bg: string }> = {
    quick: { label: "60-Second", color: "#92400e", bg: "#fffbeb" },
    professional: { label: "Professional", color: "#1e40af", bg: "#eff6ff" },
    advanced: { label: "Advanced", color: "#5b21b6", bg: "#f5f3ff" },
  };
  const reviewMap: Record<string, { label: string; icon: string }> = {
    "technically-verified": { label: "Technically Verified", icon: "✓" },
    "expert-reviewed": { label: "Expert Reviewed", icon: "✓" },
    "editorially-reviewed": { label: "Editorially Reviewed", icon: "✓" },
    "pending": { label: "Pending Review", icon: "○" },
  };
  const level = levelMap[article.knowledgeLevel];
  const review = reviewMap[article.expertReviewStatus];

  const cards = [
    level && {
      label: "Knowledge Level",
      value: level.label,
      color: level.color,
      bg: level.bg,
      Icon: BookOpen,
    },
    article.readingTime && {
      label: "Reading Time",
      value: `${article.readingTime} min`,
      color: "#374151",
      bg: "#f9fafb",
      Icon: Clock,
    },
    article.difficulty && {
      label: "Difficulty",
      value: article.difficulty,
      color: "#374151",
      bg: "#f9fafb",
      Icon: BarChart2,
    },
    review && {
      label: "Review Status",
      value: review.label,
      color: "#065f46",
      bg: "#ecfdf5",
      Icon: Shield,
    },
  ].filter(Boolean) as { label: string; value: string; color: string; bg: string; Icon: any }[];

  if (!cards.length) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 mb-2">
      {cards.map(({ label, value, color, bg, Icon }) => (
        <div key={label} className="rounded-xl border border-[#eaeaea] px-4 py-3" style={{ backgroundColor: bg }}>
          <Icon className="w-4 h-4 mb-2" style={{ color }} />
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#888] mb-0.5">{label}</p>
          <p className="text-sm font-semibold" style={{ color }}>{value}</p>
        </div>
      ))}
    </div>
  );
}

// ── References section ─────────────────────────────────────────────────────────

interface ArticleRef {
  id: number; title: string; url?: string | null; description?: string | null; refType: string;
}

function ArticleReferences({ refs }: { refs: ArticleRef[] }) {
  if (!refs?.length) return null;
  const typeLabels: Record<string, string> = {
    reference: "Reference",
    citation: "Citation",
    external: "External Source",
    book: "Book",
    journal: "Journal",
    paper: "Research Paper",
    standard: "Standard",
    website: "Website",
  };
  return (
    <div className="mt-14 pt-10 border-t-2 border-[#eaeaea]">
      <div className="flex items-center gap-2 mb-6">
        <BookOpen className="w-5 h-5 text-[#4a7c59]" />
        <h3 className="font-serif font-bold text-xl text-[#1a1a1a]">References & Sources</h3>
      </div>
      <ol className="space-y-4">
        {refs.map((ref, i) => (
          <li key={ref.id} className="flex gap-4 text-[13.5px] leading-relaxed">
            <span className="shrink-0 w-6 h-6 rounded-full bg-[#f0f7f0] border border-[#c8dfc8] text-[#4a7c59] font-bold text-[11px] flex items-center justify-center mt-0.5">
              {i + 1}
            </span>
            <span>
              {ref.url ? (
                <a href={ref.url} target="_blank" rel="noopener noreferrer"
                  className="font-semibold text-[#4a7c59] hover:text-[#3a6449] hover:underline transition-colors">
                  {ref.title}
                </a>
              ) : (
                <span className="font-semibold text-[#1a1a1a]">{ref.title}</span>
              )}
              {ref.refType && ref.refType !== "reference" && (
                <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full bg-[#f5f5f2] border border-[#e8e8e4] text-[#888] font-medium">
                  {typeLabels[ref.refType] ?? ref.refType}
                </span>
              )}
              {ref.description && (
                <span className="block text-[#777] text-[12.5px] mt-0.5">{ref.description}</span>
              )}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ── Citation box ───────────────────────────────────────────────────────────────

function CitationBox({ article }: { article: any }) {
  const [format, setFormat] = useState<"apa" | "chicago" | "mla">("apa");
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const year = article.publishedAt ? new Date(article.publishedAt).getFullYear() : new Date().getFullYear();
  const authorLast = article.author?.name?.split(" ").pop() ?? "Author";
  const authorFirst = article.author?.name?.split(" ").slice(0, -1).join(" ") ?? "";
  const title = article.title ?? "";
  const pub = "Laundry Master — The Science of Professional Textile Care";
  const url = typeof window !== "undefined" ? window.location.href : "";

  const citations: Record<string, string> = {
    apa: `${authorLast}, ${authorFirst ? authorFirst[0] + "." : ""} (${year}). ${title}. ${pub}. ${url}`,
    chicago: `${article.author?.name ?? "Author"}. "${title}." ${pub}, ${year}. ${url}.`,
    mla: `${authorLast}, ${authorFirst}. "${title}." ${pub}, ${year}, ${url}.`,
  };

  const copyText = () => {
    try {
      const ta = document.createElement("textarea");
      ta.value = citations[format];
      ta.style.cssText = "position:fixed;top:-9999px;opacity:0";
      document.body.appendChild(ta); ta.focus(); ta.select();
      document.execCommand("copy"); document.body.removeChild(ta);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    } catch { /* nothing */ }
  };

  return (
    <div className="mt-10 border border-[#e8e8e4] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 bg-[#fafaf8] hover:bg-[#f5f5f2] transition-colors">
        <div className="flex items-center gap-2">
          <Quote className="w-4 h-4 text-[#888]" />
          <span className="text-sm font-semibold text-[#444]">Cite this article</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-[#aaa]" /> : <ChevronDown className="w-4 h-4 text-[#aaa]" />}
      </button>
      {open && (
        <div className="px-5 pb-5 pt-4 bg-white border-t border-[#eaeaea]">
          <div className="flex gap-2 mb-4">
            {(["apa", "chicago", "mla"] as const).map(f => (
              <button key={f} onClick={() => setFormat(f)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg uppercase tracking-wider transition-colors
                  ${format === f ? "bg-[#1a2e1a] text-white" : "bg-[#f5f5f2] text-[#666] hover:bg-[#eee]"}`}>
                {f.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="bg-[#f9f9f7] border border-[#eaeaea] rounded-lg p-4 text-[13px] text-[#444] leading-relaxed font-mono mb-3">
            {citations[format]}
          </div>
          <button onClick={copyText}
            className="flex items-center gap-2 text-sm font-semibold text-[#4a7c59] hover:text-[#3a6449] transition-colors">
            {copied ? <><CheckCircle className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy citation</>}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Rich author card ───────────────────────────────────────────────────────────

function AuthorCard({ author }: { author: any }) {
  if (!author) return null;
  const expertise = [
    "Textile Care Research", "Commercial Laundry", "Fabric Chemistry",
  ];
  return (
    <div className="mt-16 border border-[#e8e8e4] rounded-2xl overflow-hidden">
      <div className="bg-[#1a2e1a] px-6 py-4">
        <p className="text-[11px] font-bold text-white/50 uppercase tracking-widest">About the Author</p>
      </div>
      <div className="p-6 flex flex-col sm:flex-row gap-6 bg-white">
        {author.avatar ? (
          <img src={author.avatar} alt={author.name}
            className="w-20 h-20 rounded-full grayscale object-cover shrink-0 ring-2 ring-[#e8e8e4]" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-[#1a2e1a]/10 flex items-center justify-center shrink-0 ring-2 ring-[#e8e8e4]">
            <User className="w-9 h-9 text-[#1a2e1a]/40" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-serif font-bold text-xl text-[#1a1a1a] mb-0.5">{author.name}</h3>
          <p className="text-sm text-[#4a7c59] font-semibold mb-3">{author.role ?? "Founder & Editor-in-Chief"}</p>
          {author.bio && (
            <p className="text-sm text-[#555] leading-relaxed mb-4">{author.bio}</p>
          )}
          <div className="flex flex-wrap gap-4 text-[13px] text-[#666] mb-4">
            {author.articleCount > 0 && (
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#888]" />
                {author.articleCount} article{author.articleCount !== 1 ? "s" : ""}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-[#888]" />
              25+ years experience
            </span>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {expertise.map(e => (
              <span key={e} className="text-[11px] px-2.5 py-1 rounded-full bg-[#f0f7f0] border border-[#c8dfc8] text-[#4a7c59] font-medium">
                {e}
              </span>
            ))}
          </div>
          <Link href={`/search?q=${author.name}`}
            className="text-sm font-semibold text-[#4a7c59] hover:text-[#3a6449] flex items-center gap-1 transition-colors">
            View all articles <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Reading completion ─────────────────────────────────────────────────────────

function ReadingCompletion({ nextArticle }: { nextArticle?: { title: string; slug: string } | null }) {
  return (
    <div className="mt-16 border-t-2 border-[#4a7c59] pt-12 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#4a7c59] mb-4">
        <CheckCircle className="w-6 h-6 text-white" />
      </div>
      <h3 className="font-serif font-bold text-2xl text-[#1a1a1a] mb-2">
        You've completed this article
      </h3>
      <p className="text-[#666] mb-6 text-sm">
        Excellent work. Continue building your expertise.
      </p>
      {nextArticle ? (
        <Link href={`/articles/${nextArticle.slug}`}>
          <Button className="gap-2 bg-[#1a2e1a] hover:bg-[#243824] text-white">
            Continue Learning: {nextArticle.title.slice(0, 40)}{nextArticle.title.length > 40 ? "…" : ""}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      ) : (
        <Link href="/articles">
          <Button variant="outline" className="gap-2">
            Explore More Articles <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      )}
    </div>
  );
}

// ── Professional badges ────────────────────────────────────────────────────────

function ProfessionalBadges({ article }: { article: any }) {
  const badges = [];
  if (article.expertReviewStatus === "technically-verified" || article.expertReviewStatus === "expert-reviewed") {
    badges.push({ label: "Peer Reviewed", Icon: Award, cls: "bg-[#fffbeb] border-[#fbbf24] text-[#92400e]" });
  }
  if (article.isFeatured) {
    badges.push({ label: "Editor's Pick", Icon: Star, cls: "bg-[#eff6ff] border-[#93c5fd] text-[#1e40af]" });
  }
  if (article.views > 500) {
    badges.push({ label: "Most Read", Icon: TrendingUp, cls: "bg-[#f0fdf4] border-[#86efac] text-[#166534]" });
  }
  const year = article.publishedAt ? new Date(article.publishedAt).getFullYear() : null;
  if (year) {
    badges.push({ label: `Updated ${year}`, Icon: CheckCircle, cls: "bg-[#f9fafb] border-[#d1d5db] text-[#374151]" });
  }
  if (!badges.length) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {badges.map(({ label, Icon, cls }) => (
        <span key={label} className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full border ${cls}`}>
          <Icon className="w-3 h-3" />
          {label}
        </span>
      ))}
    </div>
  );
}

// ── Share dropdown (inline header) ────────────────────────────────────────────

function ShareDropdown({ title, url, pdfUrl }: { title: string; url: string; pdfUrl?: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);
  const copyLink = () => {
    try {
      const ta = document.createElement("textarea");
      ta.value = url; ta.style.cssText = "position:fixed;top:-9999px;opacity:0;pointer-events:none";
      document.body.appendChild(ta); ta.focus(); ta.select();
      document.execCommand("copy"); document.body.removeChild(ta);
      setCopied(true); setTimeout(() => { setCopied(false); setOpen(false); }, 1800);
    } catch { /* nothing */ }
  };
  const enc = encodeURIComponent(url), encT = encodeURIComponent(title);
  return (
    <div ref={ref} className="relative">
      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => setOpen(o => !o)}>
        <Share2 className="w-4 h-4" />
      </Button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-[#e8e8e8] rounded-xl shadow-lg py-1.5 z-50">
          {[
            { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc}` },
            { label: "X",           href: `https://twitter.com/intent/tweet?text=${encT}&url=${enc}` },
            { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${enc}` },
          ].map(({ label, href }) => (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-[#333] hover:bg-[#f5f5f2] transition-colors">
              <Share2 className="w-3.5 h-3.5 text-[#888]" />{label}
            </a>
          ))}
          <div className="border-t border-[#f0f0f0] my-1" />
          <button onClick={copyLink} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#333] hover:bg-[#f5f5f2] transition-colors">
            {copied ? <><CheckCircle className="w-3.5 h-3.5 text-[#4a7c59]" /><span className="text-[#4a7c59] font-medium">Copied!</span></>
              : <><Copy className="w-3.5 h-3.5 text-[#888]" />Copy link</>}
          </button>
          <button onClick={() => { window.print(); setOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#333] hover:bg-[#f5f5f2] transition-colors">
            <Printer className="w-3.5 h-3.5 text-[#888]" />Print / PDF
          </button>
          {pdfUrl && (
            <a href={pdfUrl} download onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-[#333] hover:bg-[#f5f5f2] transition-colors">
              <Download className="w-3.5 h-3.5 text-[#888]" />Download PDF
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ── Bookmark button ────────────────────────────────────────────────────────────

function BookmarkButton({ articleId }: { articleId: number }) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    apiGet<number[]>("/api/user/saved-article-ids")
      .then((ids) => setSaved(ids.includes(articleId)))
      .catch(() => {}).finally(() => setLoading(false));
  }, [user, articleId]);
  const toggle = async () => {
    if (!user) { setLocation("/login"); return; }
    try {
      if (saved) {
        await apiDelete(`/api/user/saved-articles/${articleId}`); setSaved(false);
        toast({ title: "Removed from saved articles" });
      } else {
        await apiPost(`/api/user/saved-articles/${articleId}`); setSaved(true);
        toast({ title: "Article saved", description: "Find it in your dashboard." });
      }
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };
  return (
    <Button variant="ghost" size="icon"
      className={`h-8 w-8 transition-colors ${saved ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
      onClick={toggle} disabled={loading} title={saved ? "Remove bookmark" : "Save article"}>
      <Bookmark className={`w-4 h-4 ${saved ? "fill-current" : ""}`} />
    </Button>
  );
}

// ── Comments section ───────────────────────────────────────────────────────────

function CommentsSection({ slug }: { slug: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ authorName: "", authorEmail: "", content: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  useEffect(() => {
    apiGet<Comment[]>(`/api/articles/${slug}/comments`)
      .then(setComments).catch(() => setComments([])).finally(() => setLoading(false));
  }, [slug]);
  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.authorName.trim()) e.authorName = "Name is required.";
    if (!form.authorEmail.trim()) e.authorEmail = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.authorEmail)) e.authorEmail = "Enter a valid email.";
    if (!form.content.trim()) e.content = "Comment is required.";
    else if (form.content.trim().length < 5) e.content = "Comment is too short.";
    return e;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({}); setSubmitting(true);
    try {
      await apiPost(`/api/articles/${slug}/comments`, form);
      setSubmitted(true); setForm({ authorName: "", authorEmail: "", content: "" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to submit.", variant: "destructive" });
    } finally { setSubmitting(false); }
  };
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  return (
    <div className="mt-16 pt-12 border-t border-[#eaeaea]">
      <div className="flex items-center gap-3 mb-2">
        <MessageCircle className="w-5 h-5 text-[#4a7c59]" />
        <h3 className="font-serif font-bold text-2xl text-[#1a1a1a]">
          Professional Discussion
        </h3>
      </div>
      <p className="text-sm text-[#888] mb-8">Moderated · Verified professionals · Be respectful</p>
      {loading ? (
        <div className="space-y-4 mb-12">
          {[1, 2].map(i => (
            <div key={i} className="animate-pulse p-5 border border-[#eaeaea] bg-[#fafaf9] rounded-xl">
              <div className="h-4 bg-[#e8e8e4] w-1/4 rounded mb-2" />
              <div className="h-3 bg-[#e8e8e4] w-full rounded mb-1" />
              <div className="h-3 bg-[#e8e8e4] w-3/4 rounded" />
            </div>
          ))}
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-5 mb-12">
          {comments.map(c => (
            <div key={c.id} className="p-5 border border-[#eaeaea] bg-white rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#1a2e1a]/10 flex items-center justify-center text-[#1a2e1a] font-bold text-sm">
                    {c.authorName.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold text-sm text-[#1a1a1a]">{c.authorName}</span>
                </div>
                <span className="text-xs text-[#aaa]">{formatDate(c.createdAt)}</span>
              </div>
              <p className="text-sm text-[#555] leading-relaxed">{c.content}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[#aaa] text-sm mb-12 italic">No comments yet. Be the first professional to share your insights.</p>
      )}
      <div className="bg-[#fafaf9] border border-[#eaeaea] rounded-xl p-6 md:p-8">
        <h4 className="font-serif font-bold text-xl text-[#1a1a1a] mb-6">Leave a Comment</h4>
        {submitted ? (
          <div className="flex items-start gap-3 p-4 bg-[#f0f7f0] border border-[#c8dfc8] rounded-lg text-[#4a7c59]">
            <CheckCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Thank you!</p>
              <p className="text-sm opacity-80">Your comment will appear once approved by a moderator.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#888] mb-1.5">
                  Name <span className="text-red-500">*</span>
                </label>
                <Input value={form.authorName} onChange={e => setForm(f => ({ ...f, authorName: e.target.value }))}
                  placeholder="Your name" className={errors.authorName ? "border-red-400" : ""} />
                {errors.authorName && <p className="text-xs text-red-500 mt-1">{errors.authorName}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#888] mb-1.5">
                  Email <span className="text-red-500">*</span>
                </label>
                <Input type="email" value={form.authorEmail} onChange={e => setForm(f => ({ ...f, authorEmail: e.target.value }))}
                  placeholder="your@email.com" className={errors.authorEmail ? "border-red-400" : ""} />
                {errors.authorEmail && <p className="text-xs text-red-500 mt-1">{errors.authorEmail}</p>}
                <p className="text-[11px] text-[#aaa] mt-1">Email will not be published.</p>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#888] mb-1.5">
                Comment <span className="text-red-500">*</span>
              </label>
              <Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder="Share your professional insights..." rows={5}
                className={errors.content ? "border-red-400" : ""} />
              {errors.content && <p className="text-xs text-red-500 mt-1">{errors.content}</p>}
            </div>
            <Button type="submit" disabled={submitting} className="gap-2 bg-[#1a2e1a] hover:bg-[#243824] text-white">
              <Send className="w-4 h-4" />
              {submitting ? "Submitting…" : "Post Comment"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function ArticleDetail() {
  const [, params] = useRoute("/articles/:slug");
  const slug = params?.slug || "";
  const [fontSize, setFontSize] = useState<"base" | "lg" | "xl">("base");
  const [darkMode, setDarkMode] = useState(false);

  const { data: article, isLoading } = useGetArticle(slug, {
    query: { enabled: !!slug, queryKey: getGetArticleQueryKey(slug) },
  });

  if (isLoading) {
    return (
      <Shell>
        <ReadingProgressBar />
        <div className="container mx-auto px-4 py-20 animate-pulse max-w-5xl">
          <div className="h-4 bg-muted w-48 mb-8 rounded" />
          <div className="h-14 bg-muted w-4/5 mb-4 rounded" />
          <div className="h-6 bg-muted w-2/3 mb-12 rounded" />
          <div className="aspect-[21/9] bg-muted w-full mb-12 rounded-2xl" />
        </div>
      </Shell>
    );
  }

  if (!article) {
    return (
      <Shell>
        <div className="container mx-auto px-4 py-32 text-center">
          <h1 className="text-4xl font-serif font-bold mb-4">Article Not Found</h1>
          <Button asChild><Link href="/articles">Back to Knowledge Hub</Link></Button>
        </div>
      </Shell>
    );
  }

  const heroImage = article.featuredImage || getArticleImage(article.id);
  const htmlContent = renderMarkdown(article.content ?? "");
  const wordCount = countWords(article.content ?? "");
  const toc = (article as any).tableOfContents as { id: string; title: string; level: number }[] ?? [];
  const rels = (article as any).contentRelationships as Array<{
    id: number; relationshipType: string; direction: string;
    article: { id: number; title: string; slug: string; excerpt?: string; readingTime: number; contentType: string; knowledgeLevel: string };
  }> ?? [];
  const paths = (article as any).learningPathMemberships as Array<{ pathId: number; pathTitle: string; pathSlug: string; stage: string }> ?? [];

  // Identify next recommended article from content relationships
  const nextRelated = rels.find(r =>
    (r.relationshipType === "follow-up" && r.direction === "outbound") ||
    r.relationshipType === "quick-to-professional" || r.relationshipType === "professional-to-technical"
  )?.article ?? null;

  const prerequisites = rels.filter(r => r.relationshipType === "prerequisite" && r.direction === "inbound");
  const nextSteps = rels.filter(r =>
    (r.relationshipType === "follow-up" && r.direction === "outbound") ||
    r.relationshipType === "quick-to-professional" || r.relationshipType === "professional-to-technical"
  );
  const relatedRels = rels.filter(r => r.relationshipType === "related");

  // ── SEO variables ──────────────────────────────────────────────────────────
  const seoTitle   = (article as any).metaTitle    || article.title;
  const seoDesc    = (article as any).metaDescription || article.excerpt || "";
  const seoImage   = (article as any).ogImage      || article.featuredImage || "";
  const articleUrl = `${SITE_URL}/articles/${article.slug}`;
  const canonical  = (article as any).canonicalUrl || articleUrl;
  const firstCat   = article.categories?.[0] as { name: string; slug: string } | undefined;
  const articleAuthor = (article as any).author as { name: string; jobTitle?: string; bio?: string } | null;
  const articleFaqs   = (article as any).faqs as { question: string; answer: string }[] | undefined ?? [];
  const articleTags   = (article as any).tags  as { name: string }[] | undefined ?? [];

  const levelColors: Record<string, string> = {
    quick: "bg-amber-50 border-amber-200 text-amber-800",
    professional: "bg-blue-50 border-blue-200 text-blue-800",
    advanced: "bg-purple-50 border-purple-200 text-purple-800",
  };
  const levelLabels: Record<string, string> = { quick: "60-sec", professional: "Professional", advanced: "Advanced" };

  const RelCard = ({ a, badge }: { a: typeof rels[0]["article"]; badge?: string }) => (
    <Link href={`/articles/${a.slug}`}
      className="group flex items-start gap-3 bg-white border border-[#eaeaea] rounded-xl p-4 hover:border-[#4a7c59]/50 hover:shadow-sm transition-all">
      <div className="flex-1 min-w-0">
        {badge && <p className="text-[10px] font-bold text-[#888] uppercase tracking-wider mb-1">{badge}</p>}
        <p className="text-sm font-semibold text-[#1a1a1a] group-hover:text-[#4a7c59] transition-colors leading-snug line-clamp-2">{a.title}</p>
        <div className="flex items-center gap-2 mt-2">
          {a.knowledgeLevel && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${levelColors[a.knowledgeLevel] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
              {levelLabels[a.knowledgeLevel] ?? a.knowledgeLevel}
            </span>
          )}
          <span className="text-[11px] text-[#999] flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{a.readingTime}m</span>
        </div>
      </div>
      <ArrowRight className="w-4 h-4 text-[#bbb] group-hover:text-[#4a7c59] shrink-0 mt-1 transition-colors" />
    </Link>
  );

  const fontSizeClass = { base: "text-base", lg: "text-lg", xl: "text-xl" }[fontSize];

  return (
    <Shell>
      {/* ── SEO ──────────────────────────────────────────────────────────── */}
      <PageSeo
        title={seoTitle}
        description={seoDesc}
        canonical={canonical}
        noindex={(article as any).noindex}
        nofollow={(article as any).nofollow}
        ogType="article"
        ogImage={seoImage}
        ogImageAlt={(article as any).ogImageAlt || (article as any).featuredImageAlt || ""}
        articlePublishedTime={(article as any).publishedAt ?? undefined}
        articleModifiedTime={(article as any).updatedAt ?? undefined}
        articleAuthor={articleAuthor?.name}
        articleSection={firstCat?.name}
        articleTags={articleTags.map(t => t.name)}
        keywords={(article as any).metaKeywords ?? undefined}
      />
      <ArticleSchema
        headline={article.title}
        description={seoDesc}
        url={articleUrl}
        imageUrl={article.featuredImage ?? undefined}
        imageAlt={(article as any).featuredImageAlt ?? undefined}
        datePublished={(article as any).publishedAt ?? undefined}
        dateModified={(article as any).updatedAt ?? undefined}
        authorName={articleAuthor?.name}
        articleSection={firstCat?.name}
        keywords={(article as any).metaKeywords ?? undefined}
        wordCount={wordCount}
      />
      <BreadcrumbSchema items={[
        { name: "Home", url: SITE_URL || "/" },
        { name: "Knowledge Hub", url: `${SITE_URL}/articles` },
        ...(firstCat ? [{ name: firstCat.name, url: `${SITE_URL}/categories/${firstCat.slug}` }] : []),
        { name: article.title },
      ]} />
      {articleFaqs.length > 0 && <FAQSchema items={articleFaqs} />}
      {articleAuthor && (
        <PersonSchema
          name={articleAuthor.name}
          jobTitle={articleAuthor.jobTitle}
          description={articleAuthor.bio}
        />
      )}

      <ReadingProgressBar />
      <article className={`bg-background ${darkMode ? "dark" : ""}`}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header className="pt-14 pb-10 border-b border-[#eaeaea]">
          <div className="container mx-auto px-4 md:px-8 max-w-5xl">

            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#aaa] mb-8 flex-wrap">
              <Link href="/articles" className="hover:text-[#4a7c59] transition-colors">Knowledge Hub</Link>
              <ChevronRight className="w-3 h-3" />
              {article.categories?.[0] && (
                <>
                  <Link href={`/categories/${article.categories[0].slug}`} className="hover:text-[#4a7c59] transition-colors">
                    {article.categories[0].name}
                  </Link>
                  <ChevronRight className="w-3 h-3" />
                </>
              )}
              {(article as any).topics?.[0] && (
                <>
                  <span className="text-[#aaa]">{(article as any).topics[0].name}</span>
                  <ChevronRight className="w-3 h-3" />
                </>
              )}
              <span className="text-[#4a7c59]">Article</span>
            </nav>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-[3.25rem] font-serif font-bold text-[#1a1a1a] leading-[1.1] mb-5">
              {article.title}
            </h1>

            {article.excerpt && (
              <p className="text-xl md:text-2xl text-[#555] font-light leading-relaxed mb-6 max-w-3xl">
                {article.excerpt}
              </p>
            )}

            {/* Professional badges */}
            <ProfessionalBadges article={{ ...article, ...(article as any) }} />

            {/* Knowledge level cards */}
            <KnowledgeCards article={article as any} />

            {/* Metadata strip */}
            <div className="flex flex-wrap items-center justify-between gap-4 py-5 border-y border-[#eaeaea] mt-6">
              {/* Author */}
              <div className="flex items-center gap-3">
                {article.author?.avatar ? (
                  <img src={article.author.avatar} alt={article.author.name}
                    className="w-10 h-10 rounded-full grayscale object-cover ring-2 ring-[#eaeaea]"
                    onError={e => {
                      const el = e.currentTarget;
                      el.style.display = "none";
                      const fb = el.nextElementSibling as HTMLElement | null;
                      if (fb) fb.style.display = "flex";
                    }} />
                ) : null}
                <div className="w-10 h-10 rounded-full bg-[#1a2e1a]/10 items-center justify-center"
                  style={{ display: article.author?.avatar ? "none" : "flex" }}>
                  <User className="w-5 h-5 text-[#1a2e1a]/40" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-[#1a1a1a]">{article.author?.name}</p>
                  <p className="text-xs text-[#888]">{article.author?.role}</p>
                </div>
              </div>

              {/* Meta + actions */}
              <div className="flex flex-wrap items-center gap-4 text-[13px] text-[#888]">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />{article.readingTime} min read
                </span>
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />{wordCount.toLocaleString()} words
                </span>
                {article.publishedAt && (
                  <span className="text-[13px] font-medium text-[#888]">
                    {new Date(article.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                )}
                {/* Font size controls */}
                <div className="flex items-center gap-1 border border-[#eaeaea] rounded-lg p-0.5 bg-[#fafaf9]">
                  <button onClick={() => setFontSize("base")}
                    className={`px-2 py-1 text-xs rounded transition-colors ${fontSize === "base" ? "bg-white shadow-sm font-bold text-[#333]" : "text-[#aaa] hover:text-[#555]"}`}>
                    A
                  </button>
                  <button onClick={() => setFontSize("lg")}
                    className={`px-2 py-1 text-sm rounded transition-colors ${fontSize === "lg" ? "bg-white shadow-sm font-bold text-[#333]" : "text-[#aaa] hover:text-[#555]"}`}>
                    A
                  </button>
                  <button onClick={() => setFontSize("xl")}
                    className={`px-2 py-1 text-base rounded transition-colors ${fontSize === "xl" ? "bg-white shadow-sm font-bold text-[#333]" : "text-[#aaa] hover:text-[#555]"}`}>
                    A
                  </button>
                </div>
                <BookmarkButton articleId={article.id} />
                <ShareDropdown title={article.title} url={window.location.href} pdfUrl={(article as any).pdfUrl ?? undefined} />
              </div>
            </div>
          </div>
        </header>

        {/* ── Hero image ─────────────────────────────────────────────────── */}
        <div className="container mx-auto px-4 md:px-8 py-10 max-w-5xl">
          <figure>
            <img src={heroImage} alt={article.title}
              className="w-full aspect-[21/9] object-cover bg-muted rounded-2xl" />
            <figcaption className="text-center text-[12px] text-[#aaa] mt-3 italic">
              Professional textile care requires a deep understanding of fibre chemistry and process variables.
            </figcaption>
          </figure>
        </div>

        {/* ── Content area ───────────────────────────────────────────────── */}
        <div className="container mx-auto px-4 md:px-8 max-w-[1240px] pb-16">
          <div className="flex gap-12 items-start">

            {/* Left: floating share */}
            <div className="w-12 shrink-0 hidden xl:block">
              <FloatingShare title={article.title} url={window.location.href} pdfUrl={(article as any).pdfUrl ?? undefined} />
            </div>

            {/* Centre: article body */}
            <main className="flex-1 min-w-0 max-w-[748px]">

              {/* Key Takeaway */}
              {(article as any).keyTakeaway && (
                <div className="flex gap-3 bg-[#f0f7f0] border border-[#c8dfc8] rounded-xl p-5 mb-8">
                  <Lightbulb className="w-5 h-5 text-[#4a7c59] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] font-bold text-[#4a7c59] uppercase tracking-widest mb-1">Key Takeaway</p>
                    <p className="text-[15px] text-[#2d5a3d] leading-relaxed">{(article as any).keyTakeaway}</p>
                  </div>
                </div>
              )}

              {/* Learning Objectives */}
              {(article as any).learningObjectives && (
                <div className="border border-[#eaeaea] rounded-xl p-5 mb-8 bg-[#fafaf9]">
                  <p className="text-[11px] font-bold text-[#888] uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" /> What You'll Learn
                  </p>
                  <ul className="space-y-1.5">
                    {((article as any).learningObjectives as string).split("\n").filter(Boolean).map((obj: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-[14px] text-[#444]">
                        <span className="text-[#4a7c59] font-bold shrink-0 mt-0.5">✓</span>
                        {obj.trim()}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Main body — markdown rendered to HTML */}
              <div
                className={`article-body prose prose-slate max-w-none ${fontSizeClass}
                  prose-headings:font-serif prose-headings:text-[#1a1a1a] prose-headings:font-bold
                  prose-h2:text-[2.25rem] prose-h2:leading-tight prose-h2:mt-16 prose-h2:mb-6 prose-h2:pb-4 prose-h2:border-b prose-h2:border-[#e0e0da]
                  prose-h3:text-[1.5rem] prose-h3:leading-snug prose-h3:mt-10 prose-h3:mb-4
                  prose-p:text-[#333] prose-p:leading-[1.85]
                  prose-li:text-[#333] prose-li:leading-relaxed prose-li:my-1.5
                  prose-ul:my-5 prose-ul:pl-6 prose-ol:my-5 prose-ol:pl-6
                  prose-ul:marker:text-[#4a7c59] prose-ol:marker:text-[#4a7c59] prose-ol:marker:font-bold
                  prose-strong:text-[#1a1a1a] prose-strong:font-semibold
                  prose-a:text-[#4a7c59] prose-a:no-underline hover:prose-a:underline
                  prose-code:bg-[#f5f5f2] prose-code:text-[#c7254e] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[0.85em] prose-code:font-mono
                  prose-pre:bg-[#1a1a1a] prose-pre:text-[#f5f5f2] prose-pre:rounded-xl
                  prose-blockquote:border-l-4 prose-blockquote:border-[#4a7c59] prose-blockquote:bg-[#f9fdf9] prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-blockquote:text-[#2d5a3d] prose-blockquote:px-5 prose-blockquote:py-3
                  prose-hr:border-[#e0e0da] prose-hr:my-10
                  prose-img:rounded-xl
                  [&_.article-blockquote]:border-l-4 [&_.article-blockquote]:border-[#4a7c59] [&_.article-blockquote]:pl-5 [&_.article-blockquote]:py-3 [&_.article-blockquote]:my-6 [&_.article-blockquote]:bg-[#f9fdf9] [&_.article-blockquote]:rounded-r-lg [&_.article-blockquote]:text-[#2d5a3d]
                  [&_.table-wrapper]:overflow-x-auto [&_.table-wrapper]:my-8 [&_.table-wrapper]:rounded-xl [&_.table-wrapper]:border [&_.table-wrapper]:border-[#e0e0da]
                  [&_.article-table]:min-w-full [&_.article-table]:border-collapse [&_.article-table]:text-sm
                  [&_.article-table_th]:bg-[#1a2e1a] [&_.article-table_th]:text-white [&_.article-table_th]:px-5 [&_.article-table_th]:py-3 [&_.article-table_th]:text-left [&_.article-table_th]:text-[12px] [&_.article-table_th]:font-bold [&_.article-table_th]:uppercase [&_.article-table_th]:tracking-wider
                  [&_.article-table_td]:px-5 [&_.article-table_td]:py-3 [&_.article-table_td]:border-t [&_.article-table_td]:border-[#eaeaea] [&_.article-table_td]:text-[#444]
                  [&_.article-table_tr:nth-child(even)_td]:bg-[#fafaf8]`}
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />

              {/* References */}
              {(() => {
                const refs = (article as any).references as ArticleRef[] | undefined;
                return refs && refs.length > 0 ? <ArticleReferences refs={refs} /> : null;
              })()}

              {/* Citation box */}
              <CitationBox article={article} />

              {/* Author card */}
              <AuthorCard author={article.author} />

              {/* Reading completion */}
              <ReadingCompletion nextArticle={nextRelated} />

              {/* Comments */}
              <CommentsSection slug={slug} />
            </main>

            {/* Right: sticky TOC */}
            <ArticleTOC items={toc} tags={article.tags} />
          </div>
        </div>

        {/* ── Related articles ───────────────────────────────────────────── */}
        {article.relatedArticles && article.relatedArticles.length > 0 && (
          <div className="bg-[#fafaf9] py-20 border-t border-[#eaeaea]">
            <div className="container mx-auto px-4 md:px-8 max-w-5xl">
              <div className="flex items-end justify-between mb-10">
                <div>
                  <p className="text-[11px] font-bold text-[#4a7c59] uppercase tracking-widest mb-2">Because you read this…</p>
                  <h2 className="text-3xl font-serif font-bold text-[#1a1a1a]">Recommended Reading</h2>
                </div>
                <Link href="/articles" className="text-sm font-semibold text-[#4a7c59] hover:text-[#3a6449] flex items-center gap-1 transition-colors">
                  All articles <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {article.relatedArticles.map((r: any) => (
                  <Link key={r.id} href={`/articles/${r.slug}`}
                    className="group bg-white border border-[#eaeaea] rounded-2xl overflow-hidden hover:shadow-md hover:border-[#4a7c59]/30 transition-all">
                    <div className="aspect-[16/9] bg-[#f5f5f2] overflow-hidden">
                      <img src={getArticleImage(r.id)} alt={r.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="p-5">
                      {r.knowledgeLevel && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wide ${levelColors[r.knowledgeLevel] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                          {levelLabels[r.knowledgeLevel] ?? r.knowledgeLevel}
                        </span>
                      )}
                      <h3 className="font-serif font-bold text-[#1a1a1a] mt-3 mb-2 leading-snug group-hover:text-[#4a7c59] transition-colors line-clamp-2">
                        {r.title}
                      </h3>
                      <p className="text-[13px] text-[#888] line-clamp-2 leading-relaxed">{r.excerpt}</p>
                      <div className="flex items-center gap-1.5 mt-3 text-[12px] text-[#aaa]">
                        <Clock className="w-3 h-3" />{r.readingTime} min read
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Continue Learning ─────────────────────────────────────────── */}
        {(rels.length > 0 || paths.length > 0) && (
          <div className="border-t border-[#eaeaea] pt-16 pb-20 bg-white">
            <div className="container mx-auto px-4 md:px-8 max-w-4xl">
              <div className="flex items-center gap-2 mb-10">
                <GitBranch className="w-5 h-5 text-[#4a7c59]" />
                <h2 className="text-2xl font-serif font-bold text-[#1a1a1a]">Continue Learning</h2>
                <p className="text-sm text-[#aaa] ml-2">Your structured learning journey</p>
              </div>

              {/* Journey timeline */}
              <div className="relative pl-6 border-l-2 border-[#e8e8e4] space-y-8">
                {prerequisites.length > 0 && (
                  <div>
                    <div className="absolute -left-[9px] w-4 h-4 rounded-full bg-[#e8e8e4] border-2 border-white" />
                    <p className="text-[11px] font-bold text-[#888] uppercase tracking-widest mb-3">Read First</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {prerequisites.map(r => <RelCard key={r.id} a={r.article} />)}
                    </div>
                  </div>
                )}

                <div>
                  <div className="absolute -left-[9px] w-4 h-4 rounded-full bg-[#4a7c59] border-2 border-white" />
                  <p className="text-[11px] font-bold text-[#4a7c59] uppercase tracking-widest mb-3">Current Article</p>
                  <div className="bg-[#f0f7f0] border border-[#c8dfc8] rounded-xl px-4 py-3 text-sm font-semibold text-[#2d5a3d]">
                    {article.title}
                  </div>
                </div>

                {nextSteps.length > 0 && (
                  <div>
                    <div className="absolute -left-[9px] w-4 h-4 rounded-full bg-[#e8e8e4] border-2 border-white" />
                    <p className="text-[11px] font-bold text-[#888] uppercase tracking-widest mb-3">Up Next</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {nextSteps.map(r => <RelCard key={r.id} a={r.article} />)}
                    </div>
                  </div>
                )}

                {paths.length > 0 && (
                  <div>
                    <div className="absolute -left-[9px] w-4 h-4 rounded-full bg-[#1a2e1a] border-2 border-white" />
                    <p className="text-[11px] font-bold text-[#888] uppercase tracking-widest mb-3">Learning Path</p>
                    <div className="bg-[#1a2e1a] rounded-xl p-5 text-white">
                      <div className="flex items-center gap-2 mb-3">
                        <BookOpen className="w-4 h-4 text-white/60" />
                        <p className="text-xs font-bold text-white/60 uppercase tracking-wider">Part of a structured learning path</p>
                      </div>
                      {paths.map((p, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <p className="font-semibold text-white">{p.pathTitle}</p>
                          <span className="text-xs text-white/50 capitalize">{p.stage?.replace(/-/g, " ")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {relatedRels.length > 0 && (
                  <div>
                    <div className="absolute -left-[9px] w-4 h-4 rounded-full bg-[#e8e8e4] border-2 border-white" />
                    <p className="text-[11px] font-bold text-[#888] uppercase tracking-widest mb-3">Also Relevant</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {relatedRels.map(r => <RelCard key={r.id} a={r.article} />)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </article>
    </Shell>
  );
}
