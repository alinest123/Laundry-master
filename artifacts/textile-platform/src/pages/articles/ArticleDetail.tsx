import { useState, useEffect } from "react";
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
              <p className="text-xl md:text-2xl text-muted-foreground font-light leading-relaxed mb-10">
                {article.excerpt}
              </p>
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    onClick={() =>
                      navigator.share?.({ title: article.title, url: window.location.href }).catch(() => {})
                    }
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
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
      </article>
    </Shell>
  );
}
