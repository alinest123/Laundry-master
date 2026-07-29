import { useState, useEffect, useRef } from "react";
import { Shell } from "@/components/layout/Shell";
import { useRoute, Link, useLocation } from "wouter";
import {
  ChevronRight,
  Clock,
  User,
  Share2,
  Bookmark,
  MessageCircle,
  Send,
  CheckCircle,
  Copy,
  Twitter,
  Linkedin,
  Facebook,
  Zap,
  BookOpen,
  ArrowRight,
  GitBranch,
  Shield,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useGetArticle, getGetArticleQueryKey } from "@workspace/api-client-react";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { useAuth } from "@/lib/auth";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { getArticleImage } from "@/lib/articleImages";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Comment {
  id: number;
  authorName: string;
  content: string;
  createdAt: string;
}

// ── Share dropdown ────────────────────────────────────────────────────────────

function ShareDropdown({ title, url }: { title: string; url: string }) {
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
    // execCommand is the most iframe-compatible clipboard method
    try {
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0;pointer-events:none";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => { setCopied(false); setOpen(false); }, 1800);
    } catch {
      // nothing more we can do
    }
  };

  const enc = encodeURIComponent(url);
  const encT = encodeURIComponent(title);

  const socials = [
    { label: "Twitter / X",  Icon: Twitter,  href: `https://twitter.com/intent/tweet?text=${encT}&url=${enc}` },
    { label: "LinkedIn",     Icon: Linkedin,  href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc}` },
    { label: "Facebook",     Icon: Facebook,  href: `https://www.facebook.com/sharer/sharer.php?u=${enc}` },
  ];

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-primary"
        onClick={() => setOpen(o => !o)}
      >
        <Share2 className="w-4 h-4" />
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-[#e8e8e8] rounded-xl shadow-lg py-1.5 z-50">
          {socials.map(({ label, Icon, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-[#333] hover:bg-[#f5f5f2] transition-colors"
            >
              <Icon className="w-3.5 h-3.5 text-[#888]" />
              {label}
            </a>
          ))}
          <div className="border-t border-[#f0f0f0] my-1" />
          <button
            onClick={copyLink}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#333] hover:bg-[#f5f5f2] transition-colors"
          >
            {copied
              ? <><CheckCircle className="w-3.5 h-3.5 text-[#4a7c59]" /><span className="text-[#4a7c59] font-medium">Copied!</span></>
              : <><Copy className="w-3.5 h-3.5 text-[#888]" />Copy link</>
            }
          </button>
        </div>
      )}
    </div>
  );
}

// ── Bookmark button ───────────────────────────────────────────────────────────

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
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, articleId]);

  const toggle = async () => {
    if (!user) { setLocation("/login"); return; }
    try {
      if (saved) {
        await apiDelete(`/api/user/saved-articles/${articleId}`);
        setSaved(false);
        toast({ title: "Removed from saved articles" });
      } else {
        await apiPost(`/api/user/saved-articles/${articleId}`);
        setSaved(true);
        toast({ title: "Article saved", description: "Find it in your dashboard." });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={`h-8 w-8 transition-colors ${saved ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
      onClick={toggle}
      disabled={loading}
      title={saved ? "Remove bookmark" : "Save article"}
    >
      <Bookmark className={`w-4 h-4 ${saved ? "fill-current" : ""}`} />
    </Button>
  );
}

// ── Comments section ──────────────────────────────────────────────────────────

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
      .then(setComments)
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
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
    setErrors({});
    setSubmitting(true);
    try {
      await apiPost(`/api/articles/${slug}/comments`, form);
      setSubmitted(true);
      setForm({ authorName: "", authorEmail: "", content: "" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to submit comment.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="mt-16 pt-12 border-t border-border">
      {/* ── Approved comments ── */}
      <div className="flex items-center gap-2 mb-8">
        <MessageCircle className="w-5 h-5 text-primary" />
        <h3 className="font-serif font-bold text-2xl text-primary">
          {loading ? "Comments" : `${comments.length} Comment${comments.length !== 1 ? "s" : ""}`}
        </h3>
      </div>

      {loading ? (
        <div className="space-y-4 mb-12">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse p-5 border border-border bg-muted/30 rounded-xl">
              <div className="h-4 bg-muted w-1/4 rounded mb-2" />
              <div className="h-3 bg-muted w-full rounded mb-1" />
              <div className="h-3 bg-muted w-3/4 rounded" />
            </div>
          ))}
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-5 mb-12">
          {comments.map((comment) => (
            <div key={comment.id} className="p-5 border border-border bg-muted/20 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {comment.authorName.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold text-sm text-primary">{comment.authorName}</span>
                </div>
                <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{comment.content}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm mb-12 italic">
          No comments yet. Be the first to share your thoughts.
        </p>
      )}

      {/* ── Comment form ── */}
      <div className="bg-muted/20 border border-border rounded-xl p-6 md:p-8">
        <h4 className="font-serif font-bold text-xl text-primary mb-6">Leave a Comment</h4>

        {submitted ? (
          <div className="flex items-start gap-3 p-4 bg-secondary/10 border border-secondary/20 rounded-lg text-secondary">
            <CheckCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Thank you for your comment!</p>
              <p className="text-sm opacity-80">Your comment is awaiting moderation and will appear once approved.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={form.authorName}
                  onChange={(e) => setForm((f) => ({ ...f, authorName: e.target.value }))}
                  placeholder="Your name"
                  className={errors.authorName ? "border-red-400" : ""}
                />
                {errors.authorName && (
                  <p className="text-xs text-red-500 mt-1">{errors.authorName}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Email <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  value={form.authorEmail}
                  onChange={(e) => setForm((f) => ({ ...f, authorEmail: e.target.value }))}
                  placeholder="your@email.com"
                  className={errors.authorEmail ? "border-red-400" : ""}
                />
                {errors.authorEmail && (
                  <p className="text-xs text-red-500 mt-1">{errors.authorEmail}</p>
                )}
                <p className="text-[11px] text-muted-foreground mt-1">Email will not be published.</p>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Comment <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                placeholder="Share your thoughts..."
                rows={5}
                className={errors.content ? "border-red-400" : ""}
              />
              {errors.content && (
                <p className="text-xs text-red-500 mt-1">{errors.content}</p>
              )}
            </div>
            <Button type="submit" disabled={submitting} className="gap-2">
              <Send className="w-4 h-4" />
              {submitting ? "Submitting..." : "Post Comment"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ArticleDetail() {
  const [, params] = useRoute("/articles/:slug");
  const slug = params?.slug || "";

  const { data: article, isLoading } = useGetArticle(slug, {
    query: { enabled: !!slug, queryKey: getGetArticleQueryKey(slug) },
  });

  if (isLoading) {
    return (
      <Shell>
        <div className="container mx-auto px-4 py-20 animate-pulse">
          <div className="h-8 bg-muted w-32 mb-8" />
          <div className="h-16 bg-muted w-3/4 mb-6" />
          <div className="h-6 bg-muted w-1/2 mb-12" />
          <div className="aspect-[21/9] bg-muted w-full mb-12" />
        </div>
      </Shell>
    );
  }

  if (!article) {
    return (
      <Shell>
        <div className="container mx-auto px-4 py-32 text-center">
          <h1 className="text-4xl font-serif font-bold mb-4">Article Not Found</h1>
          <Button asChild>
            <Link href="/articles">Back to Knowledge Hub</Link>
          </Button>
        </div>
      </Shell>
    );
  }

  const heroImage = article.featuredImage || getArticleImage(article.id);

  return (
    <Shell>
      <article className="bg-background">
        {/* Header */}
        <header className="pt-16 pb-12 border-b border-border">
          <div className="container mx-auto px-4 md:px-8 max-w-4xl">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold uppercase tracking-wider mb-8">
              <Link href="/articles" className="hover:text-primary transition-colors">
                Knowledge Hub
              </Link>
              <ChevronRight className="w-3 h-3" />
              {article.categories?.[0] && (
                <>
                  <Link
                    href={`/categories/${article.categories[0].slug}`}
                    className="hover:text-primary transition-colors"
                  >
                    {article.categories[0].name}
                  </Link>
                  <ChevronRight className="w-3 h-3" />
                </>
              )}
              <span className="text-primary truncate">Article</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-primary leading-[1.1] mb-6">
              {article.title}
            </h1>

            {article.excerpt && (
              <p className="text-xl md:text-2xl text-muted-foreground font-light leading-relaxed mb-6">
                {article.excerpt}
              </p>
            )}

            {/* Knowledge metadata badges */}
            {(article as any).contentType && (
              <div className="flex flex-wrap gap-2 mb-8">
                {(() => {
                  const level = (article as any).knowledgeLevel;
                  const ct = (article as any).contentType;
                  const diff = (article as any).difficulty;
                  const reviewStatus = (article as any).expertReviewStatus;
                  const levelColors: Record<string, string> = {
                    quick: "bg-amber-100 text-amber-800 border-amber-200",
                    professional: "bg-blue-100 text-blue-800 border-blue-200",
                    advanced: "bg-purple-100 text-purple-800 border-purple-200",
                  };
                  const levelLabels: Record<string, string> = {
                    quick: "60-Second Knowledge", professional: "Professional", advanced: "Advanced / Technical",
                  };
                  const reviewBadge: Record<string, { label: string; cls: string }> = {
                    "technically-verified": { label: "Technically Verified", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
                    "expert-reviewed": { label: "Expert Reviewed", cls: "bg-green-50 text-green-700 border-green-200" },
                    "editorially-reviewed": { label: "Editorially Reviewed", cls: "bg-gray-50 text-gray-600 border-gray-200" },
                  };
                  const rb = reviewBadge[reviewStatus];
                  const ctLabels: Record<string, string> = {
                    "60-second": "60-Second", "professional-article": "Article", "practical-guide": "Practical Guide",
                    "technical-article": "Technical Article", "research-paper": "Research Paper",
                    "white-paper": "White Paper", "case-study": "Case Study",
                    "best-practice-guide": "Best Practice Guide", "sop": "Standard Operating Procedure",
                    "technical-reference": "Technical Reference",
                  };
                  return (
                    <>
                      {level && (
                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full border uppercase tracking-wider ${levelColors[level] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                          {level === "quick" && <Zap className="w-3 h-3" fill="currentColor" />}
                          {levelLabels[level] ?? level}
                        </span>
                      )}
                      {ct && ct !== "professional-article" && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full border bg-[#fafaf9] text-[#555] border-[#e0e0da]">
                          <BookOpen className="w-3 h-3" />
                          {ctLabels[ct] ?? ct}
                        </span>
                      )}
                      {diff && (
                        <span className="inline-flex items-center text-xs font-medium px-3 py-1.5 rounded-full border bg-[#fafaf9] text-[#666] border-[#e0e0da] capitalize">
                          {diff}
                        </span>
                      )}
                      {rb && (
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full border ${rb.cls}`}>
                          <Shield className="w-3 h-3" />
                          {rb.label}
                        </span>
                      )}
                    </>
                  );
                })()}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-6 py-6 border-y border-border">
              <div className="flex items-center gap-4">
                {article.author?.avatar ? (
                  <img
                    src={article.author.avatar}
                    alt={article.author.name}
                    className="w-12 h-12 grayscale object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-secondary/10 flex items-center justify-center text-secondary">
                    <User className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <div className="font-bold text-primary">{article.author?.name}</div>
                  <div className="text-sm text-muted-foreground">{article.author?.role}</div>
                </div>
              </div>

              <div className="flex items-center gap-6 text-sm font-medium text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{article.readingTime} min read</span>
                </div>
                <div className="uppercase tracking-widest text-xs font-bold">
                  {article.publishedAt
                    ? new Date(article.publishedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : ""}
                </div>
                <div className="flex gap-2">
                  <BookmarkButton articleId={article.id} />
                  <ShareDropdown title={article.title} url={window.location.href} />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Featured Image */}
        <div className="container mx-auto px-4 md:px-8 py-10 max-w-5xl">
          <img
            src={heroImage}
            alt={article.title}
            className="w-full aspect-[21/9] object-cover bg-muted rounded-2xl"
          />
        </div>

        {/* Content & Sidebar */}
        <div className="container mx-auto px-4 md:px-8 max-w-6xl py-12">
          <div className="flex flex-col lg:flex-row gap-16">
            {/* Table of Contents */}
            <aside className="lg:w-1/4 order-2 lg:order-1">
              <div className="sticky top-24">
                <h3 className="font-serif font-bold text-lg mb-6 text-primary border-b border-border pb-2">
                  Contents
                </h3>
                {article.tableOfContents && article.tableOfContents.length > 0 ? (
                  <ul className="space-y-3">
                    {article.tableOfContents.map((item) => (
                      <li key={item.id} style={{ paddingLeft: `${(item.level - 2) * 1}rem` }}>
                        <a
                          href={`#${item.id}`}
                          className="text-sm text-muted-foreground hover:text-secondary transition-colors block"
                        >
                          {item.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No index available.</p>
                )}

                <div className="mt-12 bg-muted/30 p-6 border border-border rounded-xl">
                  <h4 className="font-bold text-sm uppercase tracking-wider text-primary mb-3">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {article.tags?.map((tag) => (
                      <span
                        key={tag.id}
                        className="text-xs bg-white px-2 py-1 text-muted-foreground border border-border rounded"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <div className="lg:w-3/4 order-1 lg:order-2">

              {/* Key Takeaway */}
              {(article as any).keyTakeaway && (
                <div className="flex gap-3 bg-[#f0f7f0] border border-[#c8dfc8] rounded-xl p-5 mb-8">
                  <Lightbulb className="w-5 h-5 text-[#4a7c59] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-[#4a7c59] uppercase tracking-wider mb-1">Key Takeaway</p>
                    <p className="text-sm text-[#2d5a3d] leading-relaxed">{(article as any).keyTakeaway}</p>
                  </div>
                </div>
              )}

              {/* Learning Objectives */}
              {(article as any).learningObjectives && (
                <div className="border border-[#eaeaea] rounded-xl p-5 mb-8 bg-[#fafaf9]">
                  <p className="text-xs font-bold text-[#666] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" /> What You'll Learn
                  </p>
                  <ul className="space-y-1.5">
                    {((article as any).learningObjectives as string).split("\n").filter(Boolean).map((obj: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#444]">
                        <span className="text-[#4a7c59] font-bold shrink-0 mt-0.5">✓</span>
                        {obj.trim()}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div
                className="prose prose-lg prose-slate max-w-none
                           prose-headings:font-serif prose-headings:text-primary prose-headings:font-bold
                           prose-a:text-secondary prose-a:no-underline hover:prose-a:underline
                           prose-img:bg-muted"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />

              {/* Author Bio */}
              <div className="mt-20 p-8 bg-muted/30 border border-border rounded-xl flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                {article.author?.avatar ? (
                  <img
                    src={article.author.avatar}
                    alt={article.author.name}
                    className="w-24 h-24 grayscale object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                    <User className="w-10 h-10" />
                  </div>
                )}
                <div>
                  <h3 className="font-serif font-bold text-xl text-primary mb-1">
                    Written by {article.author?.name}
                  </h3>
                  <p className="text-sm text-secondary font-bold mb-3">{article.author?.role}</p>
                  <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                    {article.author?.bio ||
                      "Expert contributor to The Science of Professional Textile Care."}
                  </p>
                  <Button variant="link" className="p-0 h-auto text-primary" asChild>
                    <Link href={`/search?q=${article.author?.name}`}>
                      View all {article.author?.articleCount} articles →
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Comments */}
              <CommentsSection slug={slug} />
            </div>
          </div>
        </div>

        {/* Related Articles */}
        {article.relatedArticles && article.relatedArticles.length > 0 && (
          <div className="bg-muted/30 py-20 border-t border-border mt-12">
            <div className="container mx-auto px-4 md:px-8">
              <h2 className="text-3xl font-serif font-bold text-primary mb-10 text-center">
                Related Research
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {article.relatedArticles.map((related) => (
                  <ArticleCard key={related.id} article={related} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Continue Learning — content relationships */}
        {(() => {
          const rels = (article as any).contentRelationships as Array<{
            id: number; relationshipType: string; direction: string;
            article: { id: number; title: string; slug: string; excerpt?: string; readingTime: number; contentType: string; knowledgeLevel: string; expertReviewStatus: string };
          }> ?? [];
          const paths = (article as any).learningPathMemberships as Array<{ pathId: number; pathTitle: string; pathSlug: string; stage: string }> ?? [];
          if (!rels.length && !paths.length) return null;

          // Group relationships into journey lanes
          const prerequisites = rels.filter(r => r.relationshipType === "prerequisite" && r.direction === "inbound");
          const nextSteps = rels.filter(r => (r.relationshipType === "follow-up" && r.direction === "outbound") || r.relationshipType === "quick-to-professional" || r.relationshipType === "professional-to-technical");
          const related = rels.filter(r => r.relationshipType === "related");

          const levelColors: Record<string, string> = {
            quick: "bg-amber-50 border-amber-200 text-amber-800",
            professional: "bg-blue-50 border-blue-200 text-blue-800",
            advanced: "bg-purple-50 border-purple-200 text-purple-800",
          };
          const levelLabels: Record<string, string> = { quick: "60-sec", professional: "Professional", advanced: "Advanced" };

          const RelCard = ({ a, label }: { a: typeof rels[0]["article"]; label?: string }) => (
            <Link href={`/articles/${a.slug}`}
              className="group flex items-start gap-3 bg-white border border-[#eaeaea] rounded-xl p-4 hover:border-[#4a7c59]/50 hover:shadow-sm transition-all">
              <div className="flex-1 min-w-0">
                {label && <p className="text-[10px] font-bold text-[#888] uppercase tracking-wider mb-1">{label}</p>}
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

          return (
            <div className="border-t border-[#eaeaea] mt-12 pt-16 pb-20 bg-[#fafaf9]">
              <div className="container mx-auto px-4 md:px-8 max-w-4xl">
                <div className="flex items-center gap-2 mb-10">
                  <GitBranch className="w-5 h-5 text-[#4a7c59]" />
                  <h2 className="text-2xl font-serif font-bold text-[#1a1a1a]">Continue Learning</h2>
                </div>

                <div className="space-y-8">
                  {/* Before this article — prerequisites */}
                  {prerequisites.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-[#888] uppercase tracking-wider mb-3">Read First</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {prerequisites.map(r => <RelCard key={r.id} a={r.article} />)}
                      </div>
                    </div>
                  )}

                  {/* Next steps / journey advancement */}
                  {nextSteps.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-[#888] uppercase tracking-wider mb-3">Up Next</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {nextSteps.map(r => <RelCard key={r.id} a={r.article} />)}
                      </div>
                    </div>
                  )}

                  {/* Learning path membership */}
                  {paths.length > 0 && (
                    <div className="bg-[#1a2e1a] rounded-xl p-5 text-white">
                      <div className="flex items-center gap-2 mb-3">
                        <BookOpen className="w-4 h-4 text-white/60" />
                        <p className="text-xs font-bold text-white/60 uppercase tracking-wider">Part of a Learning Path</p>
                      </div>
                      {paths.map((p, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <p className="font-semibold text-white">{p.pathTitle}</p>
                          <span className="text-xs text-white/50 capitalize">{p.stage?.replace(/-/g, " ")}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Related */}
                  {related.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-[#888] uppercase tracking-wider mb-3">Also Relevant</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {related.map(r => <RelCard key={r.id} a={r.article} />)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </article>
    </Shell>
  );
}
